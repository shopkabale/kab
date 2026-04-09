import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import * as admin from "firebase-admin";

import { sendWhatsAppMessage } from "@/lib/whatsapp"; 
import { checkIsBotFlow } from "@/lib/bot/handlers"; 
import { logChat } from "@/lib/bot/chatLogger"; 
import { NotificationService } from "@/lib/notifications"; // 🔥 Added
import { sendAdminAlert } from "@/lib/brevo"; // 🔥 Added

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

    console.warn("⚠️ Webhook verification failed.");
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

        if (value?.messages && value.messages.length > 0) {
          for (const message of value.messages) {
            const contactName = value.contacts?.[0]?.profile?.name || "WhatsApp User";
            messagePromises.push(processWhatsAppMessage(message, contactName));
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
async function processWhatsAppMessage(message: any, contactName: string): Promise<void> {
  const fromPhone = message?.from;
  if (!fromPhone) return;

  try {
    console.log(`💬 Processing incoming payload from ${fromPhone}...`);

    // CRM DATA CAPTURE
    adminDb.collection("customers").doc(fromPhone).set({
      phone: fromPhone,
      name: contactName,
      lastInteraction: admin.firestore.FieldValue.serverTimestamp(),
      tags: admin.firestore.FieldValue.arrayUnion("active_user") 
    }, { merge: true }).catch(console.error);

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
      incomingText = message.button?.payload || message.button?.text || "[Template Button Clicked]";
    } else {
      isUnsupportedMedia = true;
    }

    if (isUnsupportedMedia) {
      const bounceText = "⚠️ *Media Not Supported:* For your security, this private chat only supports text messages. Please type out your message.";
      await sendWhatsAppMessage(fromPhone, bounceText);
      return; 
    }

    logChat(fromPhone, "incoming", message.type, incomingText).catch(console.error);

    // ==========================================
    // 🚀 NEW: THE LEAD CONVERTER INTERCEPTOR
    // ==========================================
    const isLeadConverted = await handleLeadConversion(fromPhone, contactName, incomingText);
    if (isLeadConverted) {
      return; // Order was processed! Stop further routing.
    }

    // Let the Bot try to handle it first
    const isBotHandled = await checkIsBotFlow(fromPhone, message);
    if (isBotHandled) return; 

    // ESCAPE HATCH (Manual Close)
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

    // PROXY RELAY LOGIC
    const activeSession = await getActiveChatPartner(fromPhone);

    if (activeSession) {
      const targetPhone = activeSession.phone;
      const forwardedText = `*New Message:*\n${incomingText}`;

      await sendWhatsAppMessage(targetPhone, forwardedText);
      logChat(targetPhone, "outgoing", "text", incomingText).catch(console.error);

      const sessionDoc = await adminDb.collection("orders").doc(activeSession.orderId).get();
      const currentCount = sessionDoc.data()?.messageCount || 0;
      const newCount = currentCount + 1;

      adminDb.collection("orders").doc(activeSession.orderId).update({ 
        updatedAt: Date.now(),
        messageCount: newCount
      }).catch(console.error);

      if (newCount === 5) {
        const reminderText = "ℹ️ *System Tip:* You are chatting securely through Kabale Online. When you have finished negotiating, simply type *END CHAT* to close this connection.";
        await sendWhatsAppMessage(fromPhone, reminderText);
        await sendWhatsAppMessage(targetPhone, reminderText);
      }
    } else {
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
// 🚀 THE LEAD CONVERTER FUNCTION
// ==========================================
async function handleLeadConversion(fromPhone: string, contactName: string, text: string): Promise<boolean> {
  const match = text.match(/Ref:\s*\[(LEAD-\d+)\]/i);
  if (!match) return false;

  const leadId = match[1];
  console.log(`🚀 Lead detected! Converting ${leadId} for ${fromPhone}...`);

  try {
    let orderData: any = null;
    let sellerOrdersMap: any = {};

    // 1. Atomic Transaction to lock stock & activate lead
    await adminDb.runTransaction(async (t) => {
      const leadRef = adminDb.collection("orders").doc(leadId);
      const leadSnap = await t.get(leadRef);

      if (!leadSnap.exists) throw new Error("Order reference not found.");
      if (leadSnap.data()?.status !== "lead") throw new Error("This order has already been processed.");

      orderData = leadSnap.data();
      const items = orderData.cartItems || [];

      // Check stock & Map Sellers
      for (const item of items) {
        const prodRef = adminDb.collection("products").doc(item.productId);
        const prodSnap = await t.get(prodRef);
        
        if (!prodSnap.exists || prodSnap.data()?.stock < item.quantity) {
          throw new Error(`Sorry, ${item.name} is currently out of stock.`);
        }

        if (!sellerOrdersMap[item.sellerPhone]) {
          sellerOrdersMap[item.sellerPhone] = {
            sellerId: item.sellerId,
            sellerPhone: item.sellerPhone,
            items: [],
            subtotal: 0
          };
        }
        sellerOrdersMap[item.sellerPhone].items.push(item);
        sellerOrdersMap[item.sellerPhone].subtotal += (item.price * item.quantity);

        t.update(prodRef, {
          stock: admin.firestore.FieldValue.increment(-item.quantity),
          locked: true,
          updatedAt: Date.now()
        });
      }

      // Activate Order
      const sellerOrders = Object.values(sellerOrdersMap);
      t.update(leadRef, {
        buyerPhone: fromPhone,
        buyerName: contactName,
        status: "processing", // 🔥 Converts lead to active order
        sellerOrders: sellerOrders,
        updatedAt: Date.now()
      });
    });

    // 2. Trigger Notifications
    const allProductsString = orderData.cartItems.map((i: any) => `${i.quantity}x ${i.name}`).join(", ");
    const notificationPromises: Promise<any>[] = [];

    // Notify Buyer
    notificationPromises.push(NotificationService.notifyBuyer(fromPhone, leadId, allProductsString, orderData.totalAmount));
    
    // Notify Admin
    notificationPromises.push(sendAdminAlert(leadId, allProductsString, orderData.totalAmount, fromPhone, "WhatsApp COD Lead Converted"));

    // Notify Sellers
    for (const sellerCut of Object.values(sellerOrdersMap) as any[]) {
      const sellerItemsString = sellerCut.items.map((i: any) => `${i.quantity}x ${i.name}`).join(", ");
      notificationPromises.push(
        NotificationService.notifySeller(
          sellerCut.sellerPhone,
          "Partner",
          leadId,
          sellerItemsString,
          sellerCut.subtotal,
          contactName,
          "Kabale (Confirm in Chat)",
          fromPhone
        )
      );
    }

    await Promise.allSettled(notificationPromises);
    console.log(`✅ Lead ${leadId} successfully converted into active COD order.`);
    return true;

  } catch (error: any) {
    console.error("Lead conversion failed:", error);
    await sendWhatsAppMessage(fromPhone, `⚠️ *Order Update:*\n${error.message}\n\nPlease type *MENU* to browse other items.`);
    return true; // Still return true so the normal bot fallback doesn't trigger
  }
}

// ==========================================
// HELPER FUNCTIONS (Kept Intact)
// ==========================================
function normalizeForMeta(phone: string): string {
  if (!phone) return "";
  let cleanPhone = phone.replace(/\D/g, ""); 
  if (cleanPhone.startsWith("0")) cleanPhone = "256" + cleanPhone.substring(1); 
  return cleanPhone;
}

async function getActiveChatPartner(senderPhone: string): Promise<{ phone: string, orderId: string } | null> {
  try {
    const ordersRef = adminDb.collection("orders"); 
    const activeStatuses = ["pending", "confirmed", "out for delivery", "out_for_delivery"];

    const phoneVariations = [senderPhone, `+${senderPhone}`];
    if (senderPhone.startsWith("256")) phoneVariations.push(`0${senderPhone.substring(3)}`); 

    const [buyerSnap, sellerSnap] = await Promise.all([
      ordersRef.where("buyerPhone", "in", phoneVariations).where("status", "in", activeStatuses).get(),
      ordersRef.where("sellerPhone", "in", phoneVariations).where("status", "in", activeStatuses).get()
    ]);

    let allActiveOrders: any[] = [];
    buyerSnap.forEach(doc => allActiveOrders.push(doc.data()));
    sellerSnap.forEach(doc => allActiveOrders.push(doc.data()));

    allActiveOrders.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    const normalizedSender = normalizeForMeta(senderPhone);
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    const now = Date.now();

    for (const order of allActiveOrders) {
      const lastActive = order.updatedAt || order.createdAt || 0;

      if (now - lastActive > TWENTY_FOUR_HOURS) {
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
    return null;
  }
}
