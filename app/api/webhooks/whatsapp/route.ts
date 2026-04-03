import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

import { sendWhatsAppMessage } from "@/lib/whatsapp"; 
import { checkIsBotFlow } from "@/lib/bot/handlers"; 
import { logChat } from "@/lib/bot/chatLogger"; 

// ==========================================
// 1. Handle Webhook Verification (GET)
// ==========================================
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

    if (mode === "subscribe" && token === verifyToken) {
      console.log("✅ Webhook verified successfully!");
      return new NextResponse(challenge, { status: 200 });
    }

    console.warn("⚠️ Webhook verification failed. Invalid token or mode.");
    return new NextResponse("Forbidden", { status: 403 });
  } catch (error) {
    console.error("🚨 Webhook Verification Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// ==========================================
// 2. Handle Incoming WhatsApp Events (POST)
// ==========================================
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body?.object !== "whatsapp_business_account") {
      return new NextResponse("Not Found", { status: 404 });
    }

    const entries = body.entry || [];
    const messagePromises: Promise<void>[] = [];

    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const value = change.value;

        if (value?.statuses) {
          for (const status of value.statuses) {
            console.log(`ℹ️ Status update: Message ${status.id} is ${status.status}`);
          }
        }

        if (value?.messages && value.messages.length > 0) {
          for (const message of value.messages) {
            messagePromises.push(processWhatsAppMessage(message));
          }
        }
      }
    }

    await Promise.allSettled(messagePromises);
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error("🚨 FATAL WEBHOOK CRASH:", error.message);
    return NextResponse.json({ error: "Internal Server Error handled safely" }, { status: 200 });
  }
}

// ==========================================
// CORE LOGIC: Process a Single Message
// ==========================================
async function processWhatsAppMessage(message: any): Promise<void> {
  const fromPhone = message?.from;
  if (!fromPhone) return;

  try {
    console.log(`💬 Processing incoming payload from ${fromPhone}...`);

    // ==========================================
    // 3. Determine text content & Filter Media
    // ==========================================
    let incomingText = "";
    let isUnsupportedMedia = false;

    if (message.type === "text") {
      incomingText = message.text?.body || "";
    } else if (message.type === "interactive") {
      if (message.interactive?.type === "button_reply") {
        incomingText = message.interactive.button_reply?.title || "";
      } else if (message.interactive?.type === "list_reply") {
        incomingText = message.interactive.list_reply?.title || "";
      }
    } else if (message.type === "button") {
      // 🔥 FIX FOR SELLER TEMPLATE BUTTONS
      // If there is a hidden payload, we use it. Otherwise, we use the button text.
      incomingText = message.button?.payload || message.button?.text || "[Template Button Clicked]";
    } else {
      isUnsupportedMedia = true;
    }

    // 🚨 THE GRACEFUL BOUNCE
    if (isUnsupportedMedia) {
      console.log(`🚫 Blocked unsupported media type (${message.type}) from ${fromPhone}`);
      const bounceText = "⚠️ *Media Not Supported:* For your security, this private chat only supports text messages. Please type out your message.";
      await sendWhatsAppMessage(fromPhone, bounceText);
      return; 
    }

    logChat(fromPhone, "incoming", message.type, incomingText).catch(console.error);

    // ==========================================
    // 4. Let the Bot try to handle it first (This will trigger handlers.ts)
    // ==========================================
    const isBotHandled = await checkIsBotFlow(fromPhone, message);
    if (isBotHandled) {
      return; // Handlers.ts successfully handled it!
    }

    // ==========================================
    // 5. ESCAPE HATCH (Manual Close)
    // ==========================================
    if (incomingText.trim().toUpperCase() === "END CHAT") {
      const activeSession = await getActiveChatPartner(fromPhone);
      if (activeSession) {
        await adminDb.collection("orders").doc(activeSession.orderId).update({ 
          status: "closed", 
          updatedAt: Date.now() 
        });
        
        await sendWhatsAppMessage(fromPhone, "✅ *Chat ended successfully.*\nYou are no longer connected to the other person.\n\nType *MENU* to browse more items.");
        await sendWhatsAppMessage(activeSession.phone, "ℹ️ *Chat Ended*\nThe other person has manually ended the chat. You are no longer connected.");
        return; 
      }
    }

    // ==========================================
    // 6. PROXY RELAY LOGIC (With 5-Message Rule)
    // ==========================================
    const activeSession = await getActiveChatPartner(fromPhone);

    if (activeSession) {
      const targetPhone = activeSession.phone;
      const forwardedText = `*New Message:*\n${incomingText}`;

      // A. Relay the message
      await sendWhatsAppMessage(targetPhone, forwardedText);
      logChat(targetPhone, "outgoing", "text", incomingText).catch(console.error);

      // B. Fetch and increment the message count
      const sessionDoc = await adminDb.collection("orders").doc(activeSession.orderId).get();
      const currentCount = sessionDoc.data()?.messageCount || 0;
      const newCount = currentCount + 1;

      // C. Update DB with new count and restart the clock
      adminDb.collection("orders").doc(activeSession.orderId).update({ 
        updatedAt: Date.now(),
        messageCount: newCount
      }).catch(console.error);

      // D. THE 5-MESSAGE REMINDER
      if (newCount === 5) {
        const reminderText = "ℹ️ *System Tip:* You are chatting securely through Kabale Online. When you have finished negotiating, simply type *END CHAT* to close this connection.";
        await sendWhatsAppMessage(fromPhone, reminderText);
        await sendWhatsAppMessage(targetPhone, reminderText);
      }

      console.log(`✅ Relayed message from ${fromPhone} to ${targetPhone}. Count: ${newCount}`);
    } else {
      // THE FALLBACK: No active chat, not a bot command.
      console.log(`ℹ️ No active transaction found for ${fromPhone}. Sending fallback reply.`);
      
      const fallbackText = `Hi there! 👋 Welcome to *Kabale Online*.\n\nI am your campus marketplace bot. I can help you safely buy or sell laptops, phones, and more right here at uni.\n\n👉 Type *MENU* to see options.\n👉 Or visit kabaleonline.com to find an item!`;

      await sendWhatsAppMessage(fromPhone, fallbackText);
      logChat(fromPhone, "outgoing", "text", fallbackText).catch(console.error);
    }

  } catch (error: any) {
    console.error(`❌ FAILED TO PROCESS MESSAGE FROM ${fromPhone}:`, error.message);
  }
}

// ==========================================
// HELPER FUNCTION: Format Phone for Meta API
// ==========================================
function normalizeForMeta(phone: string): string {
  if (!phone) return "";
  let cleanPhone = phone.replace(/\D/g, ""); 
  if (cleanPhone.startsWith("0")) {
    cleanPhone = "256" + cleanPhone.substring(1); 
  }
  return cleanPhone;
}

// ==========================================
// HELPER FUNCTION: Find who to send it to (WITH GHOST SWEEPER)
// ==========================================
async function getActiveChatPartner(senderPhone: string): Promise<{ phone: string, orderId: string } | null> {
  try {
    const ordersRef = adminDb.collection("orders"); 
    const activeStatuses = ["pending", "confirmed", "out for delivery", "out_for_delivery"];

    const phoneVariations = [senderPhone, `+${senderPhone}`];
    if (senderPhone.startsWith("256")) {
      phoneVariations.push(`0${senderPhone.substring(3)}`); 
    }

    const [buyerSnap, sellerSnap] = await Promise.all([
      ordersRef.where("buyerPhone", "in", phoneVariations).where("status", "in", activeStatuses).get(),
      ordersRef.where("sellerPhone", "in", phoneVariations).where("status", "in", activeStatuses).get()
    ]);

    let allActiveOrders: any[] = [];
    buyerSnap.forEach(doc => allActiveOrders.push(doc.data()));
    sellerSnap.forEach(doc => allActiveOrders.push(doc.data()));

    // Sort by newest first
    allActiveOrders.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    const normalizedSender = normalizeForMeta(senderPhone);
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    const now = Date.now();

    for (const order of allActiveOrders) {
      const lastActive = order.updatedAt || order.createdAt || 0;

      // 🚨 THE GHOST SWEEPER
      if (now - lastActive > TWENTY_FOUR_HOURS) {
        console.log(`⏱️ Auto-closing expired proxy session: ${order.id}`);
        ordersRef.doc(order.id).update({ status: "closed", updatedAt: now }).catch(console.error);
        continue; 
      }

      const normalizedBuyer = normalizeForMeta(order.buyerPhone);
      const normalizedSeller = normalizeForMeta(order.sellerPhone);

      if (normalizedSender === normalizedBuyer && normalizedSeller !== normalizedSender) {
        return { phone: normalizedSeller, orderId: order.id }; 
      }

      if (normalizedSender === normalizedSeller && normalizedBuyer !== normalizedSender) {
        return { phone: normalizedBuyer, orderId: order.id }; 
      }
    }

    return null; 
  } catch (error) {
    console.error("❌ Error looking up chat partner:", error);
    return null;
  }
}
