import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import * as admin from "firebase-admin";

// ✅ Updated import to match your upgraded lib/whatsapp.ts file
import { sendWhatsAppMessage } from "@/lib/whatsapp"; 

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

    if (body.object === "whatsapp_business_account") {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          const value = change.value;

          // Check if this is an actual message
          if (value.messages && value.messages.length > 0) {
            for (const message of value.messages) {
              const fromPhone = message.from; 
              const text = message.text?.body || "[Media/Voice Note]"; 
              const messageId = message.id;

              console.log(`💬 Incoming message from ${fromPhone}: "${text}"`);

              // 🔥 STEP 1: SAVE TO FIREBASE FOR RECORD KEEPING
              try {
                await adminDb.collection("whatsapp_messages").add({
                  metaMessageId: messageId,
                  senderPhone: fromPhone,
                  content: text,
                  status: "unread",
                  timestamp: admin.firestore.FieldValue.serverTimestamp(),
                });
                console.log(`✅ Saved incoming message from ${fromPhone} to database.`);
              } catch (dbError: any) {
                console.error("❌ FIREBASE SAVE FAILED:", dbError.message);
              }

              // 🔥 STEP 2: RELAY THE MESSAGE TO THE OTHER PARTY
              try {
                const targetPhone = await getActiveChatPartner(fromPhone);

                if (targetPhone) {
                  // Format the message so they know who it's from
                  const forwardedText = `*New Message:*\n${text}`;

                  // Send the plain text reply
                  await sendWhatsAppMessage(targetPhone, forwardedText);
                  console.log(`✅ Relayed message from ${fromPhone} to ${targetPhone}`);
                } else {
                  console.log(`ℹ️ No active order found for ${fromPhone}. Message saved but not relayed.`);
                }
              } catch (relayError: any) {
                console.error("❌ FAILED TO RELAY MESSAGE:", relayError.message);
              }

            }
          } else if (value.statuses) {
            console.log(`ℹ️ Status update received: ${value.statuses[0].status}`);
          }
        }
      }

      // Always return a 200 OK so Meta knows we received the payload
      return NextResponse.json({ success: true }, { status: 200 });

    } else {
      return new NextResponse("Not Found", { status: 404 });
    }

  } catch (error: any) {
    console.error("🚨 FATAL WEBHOOK CRASH:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ==========================================
// HELPER FUNCTION: Find who to send it to
// ==========================================
async function getActiveChatPartner(senderPhone: string): Promise<string | null> {
  try {
    const ordersRef = adminDb.collection("orders"); 
    const productsRef = adminDb.collection("products"); 

    const activeStatuses = ["pending", "confirmed", "out for delivery"];

    // 💡 CREATE VARIATIONS: Meta sends "256784655792", but your DB has "0784655792"
    const phoneVariations = [senderPhone, `+${senderPhone}`];
    if (senderPhone.startsWith("256")) {
      phoneVariations.push(`0${senderPhone.substring(3)}`); // Creates the 07... version
    }

    // ==========================================
    // SCENARIO 1: SENDER IS THE BUYER
    // ==========================================
    const buyerQuery = await ordersRef
      .where("contactPhone", "in", phoneVariations) // Matches your exact DB field
      .where("status", "in", activeStatuses) 
      .limit(1)
      .get();

    if (!buyerQuery.empty) {
      const orderData = buyerQuery.docs[0].data();
      const productId = orderData.items?.[0]?.productId;

      if (productId) {
        // We found the order! Now look up the product to get the seller's phone
        const productDoc = await productsRef.doc(productId).get();
        if (productDoc.exists && productDoc.data()?.sellerPhone) {
          return productDoc.data()?.sellerPhone; 
        }
      }
    }

    // ==========================================
    // SCENARIO 2: SENDER IS THE SELLER
    // ==========================================
    // Step A: Find the sellerId by checking the products collection
    const productQuery = await productsRef
      .where("sellerPhone", "in", phoneVariations)
      .limit(1)
      .get();

    if (!productQuery.empty) {
      const sellerId = productQuery.docs[0].data().sellerId;

      // Step B: Find an active order belonging to this sellerId
      const sellerOrderQuery = await ordersRef
        .where("sellerId", "==", sellerId)
        .where("status", "in", activeStatuses) 
        .limit(1)
        .get();

      if (!sellerOrderQuery.empty) {
        // Return the buyer's contact phone
        return sellerOrderQuery.docs[0].data().contactPhone;
      }
    }

    return null; // Not part of any active transaction
  } catch (error) {
    console.error("Error looking up chat partner in Firebase:", error);
    return null;
  }
}
