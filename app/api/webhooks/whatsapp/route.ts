import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

import { sendWhatsAppMessage } from "@/lib/whatsapp"; 
import { checkIsBotFlow } from "@/lib/bot/handlers"; 
import { logChat } from "@/lib/bot/chatLogger"; 

// ==========================================
// 1. Handle Webhook Verification (GET)
// ==========================================
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

// ==========================================
// 2. Handle Incoming WhatsApp Events (POST)
// ==========================================
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

              console.log(`💬 Incoming message payload from ${fromPhone}`);

              // 🔥 AUTO-LOG INCOMING MESSAGES TO FIRESTORE
              let incomingText = "Media/Other";
              if (message.type === "text") {
                incomingText = message.text.body;
              } else if (message.type === "interactive" && message.interactive.type === "button_reply") {
                incomingText = `[Button Clicked: ${message.interactive.button_reply.title}]`;
              } else if (message.type === "interactive" && message.interactive.type === "list_reply") {
                incomingText = `[List Item: ${message.interactive.list_reply.title}]`;
              }

              // Fire logger in the background (does not slow down the webhook)
              logChat(fromPhone, "incoming", message.type, incomingText).catch(console.error);

              // 🔥 STEP 1: LET THE BOT TRY TO HANDLE IT FIRST
              const isBotHandled = await checkIsBotFlow(fromPhone, message);

              if (isBotHandled) {
                 console.log(`🤖 Bot handled the interaction for ${fromPhone}. Skipping relay.`);
                 continue; // Skip the chat relay logic below!
              }

              // 🔥 STEP 2: HUMAN-TO-HUMAN PROXY RELAY
              // If it wasn't a bot command, treat it as a normal chat message.
              const text = message.text?.body || "[Media/Voice Note]"; 

              try {
                // Look up the anonymous chat partner
                const targetPhone = await getActiveChatPartner(fromPhone);

                if (targetPhone) {
                  // Format the message so they know who it's from
                  const forwardedText = `*New Message:*\n${text}`;

                  // Send the plain text reply
                  await sendWhatsAppMessage(targetPhone, forwardedText);
                  
                  // Log the outgoing message so it appears in the Admin Dashboard
                  logChat(targetPhone, "outgoing", "text", text).catch(console.error);
                  
                  console.log(`✅ Relayed message from ${fromPhone} to ${targetPhone}`);
                } else {
                  console.log(`ℹ️ No active order found for ${fromPhone}. Message saved but not relayed.`);
                }
              } catch (relayError: any) {
                console.error("❌ FAILED TO RELAY MESSAGE:", relayError.message);
              }
            }
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
// HELPER FUNCTION: Format Phone for Meta API
// ==========================================
function normalizeForMeta(phone: string): string {
  if (!phone) return "";
  let cleanPhone = phone.replace(/\D/g, ""); // Remove +, spaces, dashes
  if (cleanPhone.startsWith("0")) {
    cleanPhone = "256" + cleanPhone.substring(1); // Convert 07... to 2567...
  }
  return cleanPhone;
}

// ==========================================
// HELPER FUNCTION: Find who to send it to (BULLETPROOF EDITION)
// ==========================================
async function getActiveChatPartner(senderPhone: string): Promise<string | null> {
  try {
    const ordersRef = adminDb.collection("orders"); 
    const activeStatuses = ["pending", "confirmed", "out for delivery", "out_for_delivery"];

    const phoneVariations = [senderPhone, `+${senderPhone}`];
    if (senderPhone.startsWith("256")) {
      phoneVariations.push(`0${senderPhone.substring(3)}`); 
    }

    // Fetch ALL active orders for this user to avoid getting stuck on an old test
    const [buyerSnap, sellerSnap] = await Promise.all([
      ordersRef.where("buyerPhone", "in", phoneVariations).where("status", "in", activeStatuses).get(),
      ordersRef.where("sellerPhone", "in", phoneVariations).where("status", "in", activeStatuses).get()
    ]);

    let allActiveOrders: any[] = [];
    
    buyerSnap.forEach(doc => allActiveOrders.push(doc.data()));
    sellerSnap.forEach(doc => allActiveOrders.push(doc.data()));

    // Sort by newest first so real orders beat your late-night test orders!
    allActiveOrders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    const normalizedSender = normalizeForMeta(senderPhone);

    // Loop through the orders to find a valid, DIFFERENT chat partner
    for (const order of allActiveOrders) {
      const normalizedBuyer = normalizeForMeta(order.buyerPhone);
      const normalizedSeller = normalizeForMeta(order.sellerPhone);

      // SCENARIO 1: Sender is the Buyer. Target is the Seller.
      if (normalizedSender === normalizedBuyer && normalizedSeller !== normalizedSender) {
        return normalizedSeller; 
      }
      
      // SCENARIO 2: Sender is the Seller. Target is the Buyer.
      if (normalizedSender === normalizedSeller && normalizedBuyer !== normalizedSender) {
        return normalizedBuyer; 
      }
    }

    return null; // No active transaction with a DIFFERENT person
  } catch (error) {
    console.error("❌ Error looking up chat partner:", error);
    return null;
  }
}
