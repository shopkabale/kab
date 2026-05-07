// app/api/webhook/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import * as admin from "firebase-admin";

import { 
  sendWhatsAppMessage, 
  sendWhatsAppListMenu,
  sendWhatsAppInteractiveButtons 
} from "@/lib/whatsapp"; 
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

    if (mode === "subscribe" && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
      console.log("✅ Webhook verified successfully!");
      return new NextResponse(challenge, { status: 200 });
    }
    return new NextResponse("Forbidden", { status: 403 });
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// ==========================================
// 2. Handle Incoming WhatsApp Events (POST)
// ==========================================
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body?.object !== "whatsapp_business_account") return new NextResponse("Not Found", { status: 404 });

    const entries = body.entry || [];
    const messagePromises: Promise<void>[] = [];

    for (const entry of entries) {
      for (const change of (entry.changes || [])) {
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
    // 📊 CRM DATA CAPTURE
    adminDb.collection("customers").doc(fromPhone).set({
      phone: fromPhone,
      name: contactName,
      lastInteraction: admin.firestore.FieldValue.serverTimestamp(),
      tags: admin.firestore.FieldValue.arrayUnion("active_user") 
    }, { merge: true }).catch(console.error);

    let incomingText = "";
    if (message.type === "text") incomingText = message.text?.body || "";
    else if (message.type === "interactive") {
      if (message.interactive?.type === "button_reply") incomingText = message.interactive.button_reply?.title || "";
      else if (message.interactive?.type === "list_reply") incomingText = message.interactive.list_reply?.title || "";
    }

    if (message.type !== "text" && message.type !== "interactive") {
      await sendWhatsAppMessage(fromPhone, "⚠️ *Media Not Supported:* Please type out your message.");
      return; 
    }

    logChat(fromPhone, "incoming", message.type, incomingText).catch(console.error);

    // ==========================================
    // 👑 SECRET ADMIN COMMANDS
    // ==========================================
    const ADMIN_NUMBERS = ["256740373021", "256784655792"]; 
    const normalizedSender = normalizeForMeta(fromPhone);
    const upperText = incomingText.toUpperCase().trim();

    if (ADMIN_NUMBERS.includes(normalizedSender)) {
      
      // --- 1. THE BROADCAST COMMAND ---
      if (upperText.startsWith("/BROADCAST ")) {
        const broadcastMsg = incomingText.substring(11).trim();
        
        if (!broadcastMsg) {
          await sendWhatsAppMessage(fromPhone, "⚠️ You need to include a message! Example: /broadcast Hello everyone...");
          return;
        }

        await sendWhatsAppMessage(fromPhone, "🚀 *Starting broadcast...* Please wait.");

        try {
          const customersSnap = await adminDb.collection("customers").get();
          let successCount = 0;

          for (const doc of customersSnap.docs) {
            const customerPhone = doc.id;
            if (ADMIN_NUMBERS.includes(customerPhone)) continue; 

            try {
              await sendWhatsAppMessage(customerPhone, broadcastMsg);
              successCount++;
              await new Promise(resolve => setTimeout(resolve, 200)); 
            } catch (e) {
              console.error(`Failed to send broadcast to ${customerPhone}`);
            }
          }

          await sendWhatsAppMessage(fromPhone, `✅ *Broadcast Complete!*\nSuccessfully sent to ${successCount} users.`);
        } catch (error) {
          await sendWhatsAppMessage(fromPhone, `❌ Broadcast failed: ${error}`);
        }
        return; 
      }

      // --- 2. THE CLOSE ORDER COMMAND ---
      if (upperText.startsWith("/CLOSE ")) {
        const orderId = upperText.replace("/CLOSE ", "").trim();
        
        if (!orderId) {
          await sendWhatsAppMessage(fromPhone, "⚠️ Please provide an Order ID. Example: /close KAB-1234");
          return;
        }

        try {
          const orderRef = adminDb.collection("orders").doc(orderId);
          const orderDoc = await orderRef.get();

          if (!orderDoc.exists) {
            await sendWhatsAppMessage(fromPhone, `❌ Order ${orderId} not found in the database.`);
            return;
          }

          await orderRef.update({ 
            status: "completed", 
            paymentStatus: "paid",
            updatedAt: Date.now() 
          });

          await sendWhatsAppMessage(fromPhone, `✅ *Order ${orderId} Closed!*\nMarked as completed and paid. Great job!`);
        } catch (e) {
          await sendWhatsAppMessage(fromPhone, `❌ Failed to close order: ${e}`);
        }
        return;
      }
    }

    // ==========================================
    // 🚀 THE LEAD CONVERTER INTERCEPTOR
    // ==========================================
    const isLeadConverted = await handleLeadConversion(fromPhone, contactName, incomingText);
    if (isLeadConverted) return; 

    // ==========================================
    // 🤖 NATIVE BOT HANDLER (Catalog, Orders, Website Leads, Menus)
    // ==========================================
    const isBotHandled = await checkIsBotFlow(fromPhone, message);
    if (isBotHandled) return; 

    // ==========================================
    // 🚪 ESCAPE HATCH (Manual Close)
    // ==========================================
    if (upperText === "END CHAT") {
      const activeSession = await getActiveChatPartner(fromPhone);
      if (activeSession) {
        await adminDb.collection("orders").doc(activeSession.orderId).update({ status: "closed", updatedAt: Date.now() });
        
        await sendWhatsAppInteractiveButtons(
          fromPhone, 
          "✅ *Chat ended successfully.*\nYou are no longer connected to the other person.\n\nVisit www.kabaleonline.com or tap below to browse more items.",
          [{ id: "btn_shop", title: "🛍️ Main Menu" }]
        );
        
        await sendWhatsAppMessage(activeSession.phone, "ℹ️ *Chat Ended*\nThe other person has manually ended the chat.");
        return; 
      }
    }

    // ==========================================
    // 🔒 PROXY RELAY LOGIC
    // ==========================================
    const activeSession = await getActiveChatPartner(fromPhone);
    if (activeSession) {
      await sendWhatsAppMessage(activeSession.phone, `*New Message:*\n${incomingText}`);
      logChat(activeSession.phone, "outgoing", "text", incomingText).catch(console.error);
      return;
    } 

    // ==========================================
    // 🧠 THE AI STOREFRONT ROUTER
    // ==========================================
    try {
      const finalReply = await routeToAIAgent(fromPhone, contactName, incomingText);
      logChat(fromPhone, "outgoing", "text", finalReply).catch(console.error);
    } catch (error: any) {
      console.error(`❌ AI Routing Error:`, error.message);
      const fallbackText = `Whoops, my system is taking a quick break! 😅\n\nVisit www.kabaleonline.com or tap the menu below to keep browsing.`;
      await sendWhatsAppInteractiveButtons(fromPhone, fallbackText, [{ id: "btn_shop", title: "🛍️ Main Menu" }]);
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
  try {
    let orderData: any = null;
    let sellerOrdersMap: any = {};

    await adminDb.runTransaction(async (t) => {
      const leadRef = adminDb.collection("orders").doc(leadId);
      const leadSnap = await t.get(leadRef);

      if (!leadSnap.exists || leadSnap.data()?.status !== "lead") throw new Error("Order already processed.");

      orderData = leadSnap.data();
      for (const item of (orderData.cartItems || [])) {
        const prodRef = adminDb.collection("products").doc(item.productId);
        const prodSnap = await t.get(prodRef);
        
        if (!prodSnap.exists || prodSnap.data()?.stock < item.quantity) throw new Error(`Sorry, ${item.name} is out of stock.`);

        if (!sellerOrdersMap[item.sellerPhone]) {
          sellerOrdersMap[item.sellerPhone] = { sellerId: item.sellerId, sellerPhone: item.sellerPhone, items: [], subtotal: 0 };
        }
        sellerOrdersMap[item.sellerPhone].items.push(item);
        sellerOrdersMap[item.sellerPhone].subtotal += (item.price * item.quantity);

        t.update(prodRef, { stock: admin.firestore.FieldValue.increment(-item.quantity), locked: true, updatedAt: Date.now() });
      }

      t.update(leadRef, { buyerPhone: fromPhone, buyerName: contactName, status: "processing", sellerOrders: Object.values(sellerOrdersMap), updatedAt: Date.now() });
    });

    const itemsStr = orderData.cartItems.map((i: any) => `${i.quantity}x ${i.name}`).join(", ");

    // 🔥 THE FIX: EXPLICIT SUCCESS MESSAGE SENT IMMEDIATELY
    await sendWhatsAppMessage(
      fromPhone, 
      "✅ *Your order is confirmed.*\n\nYou will pay only after receiving the item. 🛡️ We are here to help if anything goes wrong."
    );

    // 🔥 THE SHOCK ABSORBERS: We run these in the background safely
    sendAdminAlert(leadId, itemsStr, orderData.totalAmount, fromPhone, "WhatsApp COD Lead Converted").catch(e => console.error("Admin Email Error:", e));
    NotificationService.notifyBuyer(fromPhone, leadId, itemsStr, orderData.totalAmount).catch(e => console.error("Buyer Notif Error:", e));

    for (const sellerCut of Object.values(sellerOrdersMap) as any[]) {
      NotificationService.notifySeller(
        sellerCut.sellerPhone, "Partner", leadId, 
        sellerCut.items.map((i: any) => `${i.quantity}x ${i.name}`).join(", "), 
        sellerCut.subtotal, contactName, "Kabale", fromPhone
      ).catch(e => console.error("Seller Notif Error:", e));
    }
    
    return true;
  } catch (error: any) {
    await sendWhatsAppInteractiveButtons(
      fromPhone, 
      `⚠️ *Order Update:*\n${error.message}\n\nTap below to browse other items or visit www.kabaleonline.com.`,
      [{ id: "btn_shop", title: "🛍️ Main Menu" }]
    );
    return true; 
  }
}

// ==========================================
// HELPER FUNCTIONS 
// ==========================================
function normalizeForMeta(phone: string): string {
  let cleanPhone = phone.replace(/\D/g, ""); 
  if (cleanPhone.startsWith("0")) cleanPhone = "256" + cleanPhone.substring(1); 
  return cleanPhone;
}

async function getActiveChatPartner(senderPhone: string): Promise<{ phone: string, orderId: string } | null> {
  try {
    const ordersRef = adminDb.collection("orders"); 
    const phoneVariations = [senderPhone, `+${senderPhone}`, `0${senderPhone.substring(3)}`]; 

    const [buyerSnap, sellerSnap] = await Promise.all([
      ordersRef.where("buyerPhone", "in", phoneVariations).where("status", "in", ["pending", "confirmed", "out for delivery"]).get(),
      ordersRef.where("sellerPhone", "in", phoneVariations).where("status", "in", ["pending", "confirmed", "out for delivery"]).get()
    ]);

    let allActiveOrders: any[] = [];
    buyerSnap.forEach(doc => allActiveOrders.push(doc.data()));
    sellerSnap.forEach(doc => allActiveOrders.push(doc.data()));
    allActiveOrders.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    const normalizedSender = normalizeForMeta(senderPhone);
    for (const order of allActiveOrders) {
      if (Date.now() - (order.updatedAt || 0) > 86400000) {
        ordersRef.doc(order.id).update({ status: "closed", updatedAt: Date.now() }).catch(console.error);
        continue; 
      }
      if (normalizedSender === normalizeForMeta(order.buyerPhone) && normalizeForMeta(order.sellerPhone) !== normalizedSender) return { phone: normalizeForMeta(order.sellerPhone), orderId: order.id }; 
      if (normalizedSender === normalizeForMeta(order.sellerPhone) && normalizeForMeta(order.buyerPhone) !== normalizedSender) return { phone: normalizeForMeta(order.buyerPhone), orderId: order.id }; 
    }
    return null; 
  } catch (error) { return null; }
}

// ==========================================
// 🧠 AI HELPER: ROUTE DIRECTLY TO GROQ ENGINE
// ==========================================
async function routeToAIAgent(phone: string, name: string, text: string): Promise<string> {
  const { executeAIAgent } = await import("@/lib/bot/aiService");
  
  // Now we get BOTH the AI text AND the pure database results
  const aiResponse = await executeAIAgent([{ role: "user", content: text }], name);
  
  const cleanReply = aiResponse.text.trim();
  const products = aiResponse.products;
  let menuRows: any[] = [];

  // We build the menu directly from the exact Algolia IDs (Zero AI Hallucination!)
  if (products && Array.isArray(products) && products.length > 0) {
    for (const p of products) {
      if (p.id && p.title) {
        menuRows.push({ 
          id: `item_${p.id}`.trim(), 
          title: p.title.substring(0, 24).trim() 
        });
      }
    }
  }

  // Render the final message
  if (menuRows.length > 0) {
    await sendWhatsAppListMenu(
      phone,
      cleanReply || "Here are the best matches I found:",
      "View Matches",
      [{ title: "Available Items", rows: menuRows }]
    );
  } else if (cleanReply) {
    // If no products were found, just send the text and a main menu fallback
    if (cleanReply.includes("MENU") || cleanReply.includes("categories")) {
        await sendWhatsAppInteractiveButtons(
            phone, 
            cleanReply, 
            [{ id: "btn_shop", title: "🛍️ Main Menu" }]
        );
    } else {
        await sendWhatsAppMessage(phone, cleanReply);
    }
  }

  return cleanReply || "Sent message.";
}
