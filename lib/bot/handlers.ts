// lib/bot/handlers.ts
import { adminDb } from "@/lib/firebase/admin";
import { sendWhatsAppMessage, sendWhatsAppInteractiveButtons } from "@/lib/whatsapp";
import { NotificationService } from "@/lib/notifications";
import { processBotFlow } from "./botFlow";
import * as admin from "firebase-admin";

export async function checkIsBotFlow(senderPhone: string, message: any): Promise<boolean> {
  let text = "";
  let buttonId = "";

  // 1. Extract text or button ID securely
  if (message.type === "text") {
    text = message.text?.body || "";
  } else if (message.type === "interactive" && message.interactive.type === "button_reply") {
    buttonId = message.interactive.button_reply.id;
    text = message.interactive.button_reply.title; 
  } else if (message.type === "image") {
    // If it's an image, immediately pass to the botFlow in case they are uploading a product
    return await processBotFlow(senderPhone, { type: "image", mediaId: message.image.id });
  }

  // 2. Catch the Buyer's Website Inquiry (Regex for "Product ID: [xxx]")
  const productIdMatch = text.match(/Product ID:\s*\[([a-zA-Z0-9_-]+)\]/i);
  if (productIdMatch) {
    await handleNewWebsiteInquiry(senderPhone, productIdMatch[1]);
    return true; 
  }

  // 3. Catch Bot Commands & Buttons
  if (buttonId === "btn_shop") {
    await sendWhatsAppMessage(senderPhone, "Great! Visit https://kabaleonline.com to browse our catalog. (Native WhatsApp shopping coming soon!)");
    return true;
  }
  
  if (buttonId === "btn_sell" || text.toLowerCase() === "/add") {
    // Pass to the Store Builder bot!
    await processBotFlow(senderPhone, { type: "text", text: "/add" });
    return true;
  }

  // 4. Catch Greetings & Trigger Welcome Menu
  const greetings = ["hi", "hello", "hey", "menu", "start", "/start"];
  if (message.type === "text" && greetings.includes(text.toLowerCase().trim())) {
    await sendWelcomeMenu(senderPhone);
    return true; 
  }

  // 5. Catch active bot sessions (e.g. they are currently typing a price)
  const isHandledByBotFlow = await processBotFlow(senderPhone, { type: "text", text });
  if (isHandledByBotFlow) return true;

  // 6. Fallback: Not a bot command, let the human-to-human proxy handle it
  return false; 
}

// ==========================================
// HELPER: SEND WELCOME MENU
// ==========================================
async function sendWelcomeMenu(phone: string) {
  const bodyText = "Welcome to *Kabale Online*! 🛒\n\nThe safest marketplace in town. What would you like to do today?";
  const buttons = [
    { id: "btn_shop", title: "🛍️ Shop Products" },
    { id: "btn_sell", title: "🏪 Sell an Item" }
  ];
  await sendWhatsAppInteractiveButtons(phone, bodyText, buttons);
}

// ==========================================
// HELPER: PROCESS NEW BUYER INQUIRY
// ==========================================
async function handleNewWebsiteInquiry(buyerPhone: string, productId: string) {
  try {
    const productDoc = await adminDb.collection("products").doc(productId).get();
    
    if (!productDoc.exists) {
      return await sendWhatsAppMessage(buyerPhone, "Sorry, we couldn't find that product. It may have been sold.");
    }

    const product = productDoc.data()!;
    const orderNumber = `KAB-${Math.floor(1000 + Math.random() * 9000)}`;

    await adminDb.collection("orders").doc(orderNumber).set({
      orderId: orderNumber,
      productId: productId,
      buyerPhone: buyerPhone,
      sellerPhone: product.sellerPhone,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Use your centralized Notification Service!
    await NotificationService.buyerInquiry(product.sellerPhone, product.title);
    await sendWhatsAppMessage(buyerPhone, `✅ We have alerted the seller about your interest in *${product.title}*. Please wait for their reply right here.`);

  } catch (error) {
    console.error("❌ Error handling inquiry:", error);
    await sendWhatsAppMessage(buyerPhone, "Oops, something went wrong setting up your chat. Please try again.");
  }
}
