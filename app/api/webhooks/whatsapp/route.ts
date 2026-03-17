import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp, query, where, limit, getDocs } from "firebase/firestore";
import { sendWhatsAppReplyAlert } from "@/lib/brevo";

// Helper to normalize phone numbers for database lookups
function getPhoneVariations(whatsappPhone: string) {
  const cleanPhone = whatsappPhone.replace(/\D/g, "");
  if (cleanPhone.startsWith("256")) {
    const localFormat = "0" + cleanPhone.substring(3);
    return [cleanPhone, `+${cleanPhone}`, localFormat];
  }
  return [cleanPhone];
}

// 1. Handle Webhook Verification (GET)
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode && token) {
    if (mode === "subscribe" && token === verifyToken) {
      console.log("✅ Webhook verified successfully!");
      return new NextResponse(challenge, { status: 200 });
    }
    return new NextResponse("Forbidden", { status: 403 });
  }
  return new NextResponse("Bad Request", { status: 400 });
}

// 2. Handle Incoming WhatsApp Events (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 🚨 DIAGNOSTIC LOG 1: See exactly what Meta is sending us
    console.log("==========================================");
    console.log("🚨 RAW WEBHOOK RECEIVED FROM META:");
    console.log(JSON.stringify(body, null, 2));
    console.log("==========================================");

    if (body.object === "whatsapp_business_account") {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          const value = change.value;

          // Check if this is an actual message (and not just a 'delivered' or 'read' receipt)
          if (value.messages && value.messages.length > 0) {
            console.log(`✅ FOUND ${value.messages.length} INCOMING MESSAGE(S)`);

            for (const message of value.messages) {
              const fromPhone = message.from; 
              const text = message.text?.body || "[Media/Voice Note]"; 
              const messageId = message.id;

              console.log(`💬 Processing message from ${fromPhone}: "${text}"`);

              let savedDocId = "failed_to_save";

              // 🔥 STEP 1: SAVE TO FIREBASE
              try {
                console.log("⏳ Saving message to Firebase...");
                const docRef = await addDoc(collection(db, "whatsapp_messages"), {
                  metaMessageId: messageId,
                  senderPhone: fromPhone,
                  content: text,
                  status: "unread",
                  timestamp: serverTimestamp(),
                });
                savedDocId = docRef.id;
                console.log(`✅ Firebase Save SUCCESS! Document ID: ${savedDocId}`);
              } catch (dbError: any) {
                console.error("❌ FIREBASE SAVE FAILED:", dbError.message);
                // We do NOT throw here so the email can still try to send
              }

              // 🔥 STEP 2: FIND THE SELLER EMAIL
              let targetEmail = process.env.SENDER_EMAIL || "shopkabale@gmail.com"; 
              let orderIdContext = "General Inquiry";
              
              try {
                console.log("⏳ Looking up recent order for phone:", fromPhone);
                const phoneVariations = getPhoneVariations(fromPhone);
                const orderQuery = query(
                  collection(db, "orders"), 
                  where("buyerPhone", "in", phoneVariations),
                  limit(1)
                );
                const orderSnapshot = await getDocs(orderQuery);

                if (!orderSnapshot.empty) {
                  const recentOrder = orderSnapshot.docs[0].data();
                  if (recentOrder.sellerEmail) {
                    targetEmail = recentOrder.sellerEmail;
                    orderIdContext = recentOrder.orderId || orderSnapshot.docs[0].id;
                    console.log(`🎯 Found matching order ${orderIdContext}. Routing to: ${targetEmail}`);
                  }
                } else {
                  console.log("⚠️ No recent order found. Routing to Admin fallback.");
                }
              } catch (lookupError: any) {
                console.error("❌ ORDER LOOKUP FAILED:", lookupError.message);
              }

              // 🔥 STEP 3: SEND BREVO EMAIL
              try {
                console.log(`⏳ Sending Brevo Magic Link to ${targetEmail}...`);
                await sendWhatsAppReplyAlert(
                  targetEmail,
                  fromPhone,
                  text,
                  savedDocId,
                  orderIdContext
                );
                console.log("✅ Brevo Email SUCCESS!");
              } catch (emailError: any) {
                console.error("❌ BREVO EMAIL FAILED:", emailError.message);
              }
            }
          } else if (value.statuses) {
            // It's just a delivery receipt (sent, delivered, read)
            console.log(`ℹ️ Ignoring status update: ${value.statuses[0].status}`);
          } else {
            console.log("ℹ️ Webhook received, but no messages or statuses found.");
          }
        }
      }
      
      // Always return 200 OK to Meta so they don't disable your webhook
      return NextResponse.json({ success: true }, { status: 200 });

    } else {
      console.error("❌ Webhook event not from whatsapp_business_account");
      return new NextResponse("Not Found", { status: 404 });
    }

  } catch (error: any) {
    console.error("🚨 FATAL WEBHOOK CRASH:", error.message);
    // Still returning 200 sometimes prevents Meta from blocking the webhook during a code bug
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
