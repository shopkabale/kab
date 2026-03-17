import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { sendWhatsAppReplyAlert } from "@/lib/brevo";

// Helper to normalize phone numbers for database lookups
// WhatsApp sends "256771234567". Your DB might store "0771234567" or "+256771234567".
function getPhoneVariations(whatsappPhone: string) {
  const cleanPhone = whatsappPhone.replace(/\D/g, "");
  if (cleanPhone.startsWith("256")) {
    const localFormat = "0" + cleanPhone.substring(3);
    return [cleanPhone, `+${cleanPhone}`, localFormat];
  }
  return [cleanPhone];
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    console.log("✅ Webhook verified!");
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.object === "whatsapp_business_account") {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          const value = change.value;

          if (value.messages) {
            for (const message of value.messages) {
              const fromPhone = message.from; // e.g., "256771234567"
              const text = message.text?.body || "[Media/Voice Note Received]";
              const messageId = message.id;

              console.log(`📥 Routing incoming message from ${fromPhone}`);

              try {
                // 1. Save the message to Firebase immediately so no data is lost
                const messageRef = await addDoc(collection(db, "whatsapp_messages"), {
                  metaMessageId: messageId,
                  senderPhone: fromPhone,
                  content: text,
                  status: "unread",
                  timestamp: serverTimestamp(),
                });

                // 2. DYNAMIC ROUTING: Find the recent order for this buyer
                let targetEmail = process.env.SENDER_EMAIL || "shopkabale@gmail.com"; // Fallback Admin Email
                let orderIdContext = "General Inquiry";
                
                const phoneVariations = getPhoneVariations(fromPhone);
                const ordersRef = collection(db, "orders"); // Adjust if your collection is named differently
                
                // Query orders where the buyerPhone matches one of the variations, get the newest one
                const orderQuery = query(
                  ordersRef, 
                  where("buyerPhone", "in", phoneVariations),
                  // orderBy("createdAt", "desc"), // Ensure you have a composite index in Firestore for this
                  limit(1)
                );

                const orderSnapshot = await getDocs(orderQuery);

                if (!orderSnapshot.empty) {
                  const recentOrder = orderSnapshot.docs[0].data();
                  // Assuming your order document contains the seller's email and order ID
                  if (recentOrder.sellerEmail) {
                    targetEmail = recentOrder.sellerEmail;
                    orderIdContext = recentOrder.orderId || orderSnapshot.docs[0].id;
                    console.log(`🎯 Found matching order ${orderIdContext}. Routing to seller: ${targetEmail}`);
                  }
                } else {
                  console.log("⚠️ No recent order found for this phone. Routing to Admin fallback.");
                }

                // 3. Send the Magic Link via Brevo
                await sendWhatsAppReplyAlert(
                  targetEmail,
                  fromPhone,
                  text,
                  messageRef.id,
                  orderIdContext
                );

              } catch (dbError) {
                console.error("🔥 Firebase/Routing Error:", dbError);
              }
            }
          }
        }
      }
      return NextResponse.json({ success: true }, { status: 200 });
    }
    return new NextResponse("Not Found", { status: 404 });
  } catch (error) {
    console.error("🚨 Webhook Critical Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
