import { adminDb } from "@/lib/firebase/admin";
import * as admin from "firebase-admin";

import { sendWhatsAppMessage, sendWhatsAppInteractiveButtons } from "@/lib/whatsapp";
import { NotificationService } from "@/lib/notifications";

// We will build this file next! It handles the multi-step "Sell an Item" process.
import { processBotFlow } from "./botFlow"; 

// ==========================================
// MAIN ROUTER: IS THIS A BOT COMMAND?
// ==========================================
export async function checkIsBotFlow(senderPhone: string, message: any): Promise<boolean> {
  let text = "";
  let buttonId = "";

  // 1. Extract text or button ID securely from the Meta payload
  if (message.type === "text") {
    text = message.text?.body || "";
  } else if (message.type === "interactive" && message.interactive.type === "button_reply") {
    buttonId = message.interactive.button_reply.id;
    text = message.interactive.button_reply.title; 
  } else if (message.type === "image") {
    // If it's an image, immediately pass to the botFlow in case they are uploading a product photo
    return await processBotFlow(senderPhone, { type: "image", mediaId: message.image.id });
  }

  // 2. Catch the Buyer's Website Inquiry (Regex for "Product ID: [xxx]")
  const productIdMatch = text.match(/Product ID:\s*\[([a-zA-Z0-9_-]+)\]/i);
  if (productIdMatch) {
    const productId = productIdMatch[1];
    await handleNewWebsiteInquiry(senderPhone, productId);
    return true; // Stop here, the bot handled it!
  }

  // 3. Handle Interactive Button Clicks
  if (buttonId === "btn_shop") {
    await sendWhatsAppMessage(
      senderPhone, 
      "Great! Visit https://kabaleonline.com to browse our catalog. (Native WhatsApp shopping coming soon!)"
    );
    return true;
  }
  
  if (buttonId === "btn_sell" || text.toLowerCase() === "/add") {
    // Pass them directly into the "Add Product" state machine
    await processBotFlow(senderPhone, { type: "text", text: "/add" });
    return true;
  }

  if (buttonId === "btn_help") {
    await sendWhatsAppMessage(
      senderPhone, 
      "Connecting you to Kabale Online Support. Please type your question below and an admin will reply shortly."
    );
    // You could optionally route this directly to shopkabale@gmail.com in the future!
    return true;
  }

  // 4. Catch Greetings & Trigger the Welcome Menu
  const greetings = ["hi", "hello", "hey", "menu", "start", "/start"];
  if (message.type === "text" && greetings.includes(text.toLowerCase().trim())) {
    await sendWelcomeMenu(senderPhone);
    return true; 
  }

  // 5. Catch active bot sessions (e.g., they are currently typing a price for their product)
  const isHandledByBotFlow = await processBotFlow(senderPhone, { type: "text", text });
  if (isHandledByBotFlow) {
    return true;
  }

  // 6. Fallback: Not a bot command, so let the human-to-human proxy handle it in route.ts
  return false; 
}

// ==========================================
// HELPER: SEND WELCOME MENU
// ==========================================
async function sendWelcomeMenu(phone: string) {
  const bodyText = "Welcome to *Kabale Online*! 🛒\n\nThe safest marketplace in town. What would you like to do today?";
  
  const buttons = [
    { id: "btn_shop", title: "🛍️ Shop Products" },
    { id: "btn_sell", title: "🏪 Sell an Item" },
    { id: "btn_help", title: "📞 Support" }
  ];

  await sendWhatsAppInteractiveButtons(phone, bodyText, buttons);
}

// ==========================================
// HELPER: PROCESS NEW BUYER INQUIRY
// ==========================================
async function handleNewWebsiteInquiry(buyerPhone: string, productId: string) {
  try {
    console.log(`🛒 Processing new website inquiry for Product ID: ${productId} from ${buyerPhone}`);

    // 1. Fetch product details from Firebase
    const productDoc = await adminDb.collection("products").doc(productId).get();
    
    if (!productDoc.exists) {
      await sendWhatsAppMessage(buyerPhone, "Sorry, we couldn't find that product. It may have been sold or removed.");
      return;
    }

    const product = productDoc.data()!;
    
    // 2. Generate a unique Order Number
    const orderNumber = `KAB-${Math.floor(1000 + Math.random() * 9000)}`;

    // 3. Save the active connection to Firebase Orders collection
    await adminDb.collection("orders").doc(orderNumber).set({
      orderId: orderNumber,
      productId: productId,
      buyerPhone: buyerPhone,
      sellerPhone: product.sellerPhone,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 4. Alert the Seller using your shiny new approved Template!
    await NotificationService.buyerInquiry(product.sellerPhone, product.title);

    // 5. Instantly reply to the Buyer (No template needed here because they just messaged you!)
    const buyerConfirmation = `✅ *Inquiry Sent!*\n\nWe have alerted the seller about your interest in *${product.title}*.\n\nPlease wait for their reply right here in this chat.`;
    await sendWhatsAppMessage(buyerPhone, buyerConfirmation);

  } catch (error) {
    console.error("❌ Error handling website inquiry:", error);
    await sendWhatsAppMessage(buyerPhone, "Oops, something went wrong setting up your chat. Please try again.");
  }
}
