import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import * as admin from "firebase-admin";

import { sendWhatsAppMessage, sendWhatsAppProductCard, sendWhatsAppListMenu } from "@/lib/whatsapp"; 
import { checkIsBotFlow } from "@/lib/bot/handlers"; 
import { logChat } from "@/lib/bot/chatLogger"; 
import { NotificationService } from "@/lib/notifications"; 
import { sendAdminAlert } from "@/lib/brevo"; 

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
    // 🚀 THE LEAD CONVERTER INTERCEPTOR
    // ==========================================
    const isLeadConverted = await handleLeadConversion(fromPhone, contactName, incomingText);
    if (isLeadConverted) {
      return; 
    }

    // ==========================================
    // 🛒 INTERCEPTORS: LIST SELECTIONS & CART ADDS
    // ==========================================
    if (message.type === "interactive") {
      
      // 1. User clicked a product from the AI "View Matches" list
      if (message.interactive.type === "list_reply" && message.interactive.list_reply.id.startsWith("SHOW_PROD_")) {
        const productId = message.interactive.list_reply.id.replace("SHOW_PROD_", "");
        const prodSnap = await adminDb.collection("products").doc(productId).get();
        
        if (prodSnap.exists) {
          const p = prodSnap.data() as any;
          await sendWhatsAppProductCard(fromPhone, {
            id: prodSnap.id,
            title: p.title,
            price: p.price,
            description: p.description,
            image: p.images?.[0] || p.image
          });
        } else {
          await sendWhatsAppMessage(fromPhone, "⚠️ Sorry, this item is no longer available.");
        }
        return; // Stop here, we showed the card
      }

      // 2. User clicked "Add to Cart" on the product card
      if (message.interactive.type === "button_reply" && message.interactive.button_reply.id.startsWith("CART_ADD_")) {
        const productId = message.interactive.button_reply.id.replace("CART_ADD_", "");
        try {
          const { addToWhatsAppCart } = await import("@/lib/bot/whatsappCartService");
          const updatedCart = await addToWhatsAppCart(fromPhone, productId);
          
          await sendWhatsAppMessage(fromPhone, `✅ Added to cart!\n\n🛒 *Cart Total:* UGX ${updatedCart.subtotal.toLocaleString()}\n\nType *Checkout* when you are ready to pay, or keep asking me for more items!`);
        } catch (error: any) {
          await sendWhatsAppMessage(fromPhone, `⚠️ ${error.message}`);
        }
        return; // Stop here, the cart handled it
      }
    }

    // ==========================================
    // 🤖 LEGACY BOT HANDLER (Restricted)
    // ==========================================
    const isInteractive = message.type === "interactive";
    const isExactCommand = ["MENU", "START", "HELP"].includes(incomingText.trim().toUpperCase());

    if (isInteractive || isExactCommand) {
      const isBotHandled = await checkIsBotFlow(fromPhone, message);
      if (isBotHandled) return; 
    }

    // ==========================================
    // 🚪 ESCAPE HATCH (Manual Close)
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
    // 🔒 PROXY RELAY LOGIC
    // ==========================================
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
      // ==========================================
      // 🧠 THE AI STOREFRONT ROUTER
      // ==========================================
      console.log(`🧠 No active proxy chat. Routing message from ${fromPhone} to AI...`);

      try {
        const finalReply = await routeToAIAgent(fromPhone, contactName, incomingText);
        logChat(fromPhone, "outgoing", "text", finalReply).catch(console.error);
      } catch (error: any) {
        console.error(`❌ AI Routing Error for ${fromPhone}:`, error.message);
        const fallbackText = `Whoops, my system is taking a quick break! 😅\n\nType *MENU* to see quick options, or visit kabaleonline.com.`;
        await sendWhatsAppMessage(fromPhone, fallbackText);
        logChat(fromPhone, "outgoing", "text", fallbackText).catch(console.error);
      }
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

    await adminDb.runTransaction(async (t) => {
      const leadRef = adminDb.collection("orders").doc(leadId);
      const leadSnap = await t.get(leadRef);

      if (!leadSnap.exists) throw new Error("Order reference not found.");
      if (leadSnap.data()?.status !== "lead") throw new Error("This order has already been processed.");

      orderData = leadSnap.data();
      const items = orderData.cartItems || [];

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

      const sellerOrders = Object.values(sellerOrdersMap);
      t.update(leadRef, {
        buyerPhone: fromPhone,
        buyerName: contactName,
        status: "processing", 
        sellerOrders: sellerOrders,
        updatedAt: Date.now()
      });
    });

    const allProductsString = orderData.cartItems.map((i: any) => `${i.quantity}x ${i.name}`).join(", ");
    const notificationPromises: Promise<any>[] = [];

    notificationPromises.push(NotificationService.notifyBuyer(fromPhone, leadId, allProductsString, orderData.totalAmount));
    notificationPromises.push(sendAdminAlert(leadId, allProductsString, orderData.totalAmount, fromPhone, "WhatsApp COD Lead Converted"));

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
    return true; 
  }
}

// ==========================================
// HELPER FUNCTIONS 
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

// ==========================================
// 🧠 AI HELPER: ROUTE DIRECTLY TO GROQ ENGINE
// ==========================================
async function routeToAIAgent(phone: string, name: string, text: string): Promise<string> {
  const { executeAIAgent } = await import("@/lib/bot/aiService");
  const rawAiReply = await executeAIAgent([{ role: "user", content: text }], name);

  // Extract the new CATALOG tag
  const catalogRegex = /\|\|CATALOG:(.*?)\|\|/g;
  let cleanReply = rawAiReply;
  let menuRows: any[] = [];

  let match;
  while ((match = catalogRegex.exec(rawAiReply)) !== null) {
    const items = match[1].split('|');
    for (const item of items) {
      const [id, title] = item.split('=');
      if (id && title) {
        menuRows.push({ 
          id: `SHOW_PROD_${id}`, 
          title: title.substring(0, 24) // WhatsApp limits titles to 24 chars
        });
      }
    }
    cleanReply = cleanReply.replace(match[0], ""); 
  }

  // Send the message
  if (menuRows.length > 0) {
    // If we have items, send the original "View Matches" list menu
    await sendWhatsAppListMenu(
      phone,
      cleanReply.trim() || "Here are the best matches I found:",
      "View Matches",
      [{ title: "Available Items", rows: menuRows }]
    );
  } else if (cleanReply.trim()) {
    // Otherwise, just send normal text
    await sendWhatsAppMessage(phone, cleanReply.trim());
  }

  return cleanReply.trim() || "Sent menu.";
}
