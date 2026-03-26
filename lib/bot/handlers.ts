import { adminDb } from "@/lib/firebase/admin";
import * as admin from "firebase-admin";

import { 
  sendWhatsAppMessage, 
  sendWhatsAppInteractiveButtons, 
  sendWhatsAppListMenu 
} from "@/lib/whatsapp";
import { NotificationService } from "@/lib/notifications";
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
  } else if (message.type === "interactive" && message.interactive.type === "list_reply") {
    buttonId = message.interactive.list_reply.id;
    text = message.interactive.list_reply.title;
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

  // ==========================================
  // SHOPPING & CATALOG LOGIC
  // ==========================================
  
  // A. Trigger the Categories Menu
  if (buttonId === "btn_shop") {
    await sendWhatsAppMessage(senderPhone, "🌐 *For easy browsing and the best experience, visit our full website:*\nhttps://kabaleonline.com\n\nOr, browse directly here on WhatsApp by tapping the menu below 👇");
    
    await sendWhatsAppListMenu(
      senderPhone,
      "Select a category to view the latest items, or search for something specific.",
      "Browse Catalog",
      [{
        title: "Marketplace Menu",
        rows: [
          { id: "cat_electronics_0", title: "📱 Electronics" },
          { id: "cat_agriculture_0", title: "🥕 Agriculture" },
          { id: "cat_student_item_0", title: "🎒 Student Market" }, // Note: 24 char limit on titles
          { id: "cmd_search", title: "🔍 Search for an Item", description: "Type what you want to find" }
        ]
      }]
    );
    return true;
  }

  // B. Handle Category Selection & Pagination
  if (buttonId.startsWith("cat_")) {
    const parts = buttonId.split("_");
    // e.g. "cat_electronics_0" -> parts[1] is "electronics", parts[2] is "0"
    // Rejoin the category name if it has multiple parts (like "student_item")
    const categoryName = parts.slice(1, -1).join("_"); 
    const pageNumber = parseInt(parts[parts.length - 1]); 
    
    await handleCategoryBrowsing(senderPhone, categoryName, pageNumber);
    return true;
  }

  // C. Handle "Search" Trigger
  if (buttonId === "cmd_search") {
    await processBotFlow(senderPhone, { type: "text", text: "/search" });
    return true;
  }

  // D. Handle Product Selection (When they tap an item in the search or category list)
  if (buttonId.startsWith("item_")) {
    const productId = buttonId.replace("item_", "");
    await handleProductSelection(senderPhone, productId);
    return true;
  }

  // E. Handle "Buy Now" Checkout (Native WhatsApp Checkout)
  if (buttonId.startsWith("buy_")) {
    const productId = buttonId.replace("buy_", "");
    await handleNativeCheckout(senderPhone, productId);
    return true;
  }

  // ==========================================
  // EXISTING LOGIC (Sell, Help, Menu)
  // ==========================================

  // Handle "Sell an Item"
  if (buttonId === "btn_sell" || text.toLowerCase() === "/add") {
    await processBotFlow(senderPhone, { type: "text", text: "/add" });
    return true;
  }

  // Handle "Support"
  if (buttonId === "btn_help") {
    await sendWhatsAppMessage(
      senderPhone, 
      "Connecting you to Kabale Online Support. Please type your question below and an admin will reply shortly."
    );
    return true;
  }

  // Catch Greetings & Trigger the Welcome Menu
  const greetings = ["hi", "hello", "hey", "menu", "start", "/start"];
  if (message.type === "text" && greetings.includes(text.toLowerCase().trim())) {
    await sendWelcomeMenu(senderPhone);
    return true; 
  }

  // Catch active bot sessions (e.g., they are currently typing a price or search term)
  const isHandledByBotFlow = await processBotFlow(senderPhone, { type: "text", text });
  if (isHandledByBotFlow) {
    return true;
  }

  // Fallback: Not a bot command, let the human-to-human proxy handle it in route.ts
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
// HELPER: FETCH CATEGORY ITEMS (PAGINATED)
// ==========================================
async function handleCategoryBrowsing(phone: string, category: string, page: number) {
  const limit = 10;
  const offset = page * limit;

  // Query Firebase for active products in this category
  const productsQuery = await adminDb.collection("products")
    .where("category", "==", category)
    .orderBy("createdAt", "desc")
    .limit(limit + 1) // Get 1 extra to check if there is a next page
    .offset(offset)
    .get();

  if (productsQuery.empty) {
    return await sendWhatsAppMessage(phone, `There are currently no items in the *${category.replace('_', ' ')}* category. Check back later!`);
  }

  const hasNextPage = productsQuery.docs.length > limit;
  const docsToShow = hasNextPage ? productsQuery.docs.slice(0, limit) : productsQuery.docs;

  const rows = docsToShow.map(doc => {
    const data = doc.data();
    return {
      id: `item_${doc.id}`,
      title: data.title.substring(0, 24), // Meta limits titles to 24 chars
      description: `UGX ${Number(data.price).toLocaleString()}` 
    };
  });

  // If there's a next page, add a "See More" button at the bottom of the list
  if (hasNextPage) {
    rows.push({
      id: `cat_${category}_${page + 1}`,
      title: "➡️ See More Items",
      description: "Load the next page"
    });
  }

  const formattedCategory = category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

  await sendWhatsAppListMenu(
    phone,
    `Here are the latest items in *${formattedCategory}*:`,
    "View Items",
    [{ title: "Available Items", rows: rows }]
  );
}

// ==========================================
// HELPER: SHOW PRODUCT DETAILS
// ==========================================
async function handleProductSelection(phone: string, productId: string) {
  const productDoc = await adminDb.collection("products").doc(productId).get();
  
  if (!productDoc.exists) {
    return await sendWhatsAppMessage(phone, "This item is no longer available.");
  }

  const product = productDoc.data()!;
  // We can't easily send the image with interactive buttons in a single payload without templates,
  // so we format a beautiful text message with the button attached.
  const messageText = `*${product.title}*\n\n💰 Price: *UGX ${Number(product.price).toLocaleString()}*\n📝 Condition: ${product.condition || "Used"}\n\n${product.description || ""}\n\nTo buy this item, tap the button below!`;

  await sendWhatsAppInteractiveButtons(
    phone,
    messageText,
    [{ id: `buy_${productId}`, title: "🛒 Buy Now" }]
  );
}

// ==========================================
// HELPER: NATIVE WHATSAPP CHECKOUT
// ==========================================
async function handleNativeCheckout(buyerPhone: string, productId: string) {
  try {
    console.log(`🛒 Processing native checkout for Product ID: ${productId} from ${buyerPhone}`);

    const productDoc = await adminDb.collection("products").doc(productId).get();
    
    if (!productDoc.exists) {
      await sendWhatsAppMessage(buyerPhone, "Sorry, this item is no longer available or has been sold.");
      return;
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

    // Alert the Seller using the approved template
    await NotificationService.buyerInquiry(product.sellerPhone, product.title);

    // Reply to the Buyer
    const buyerConfirmation = `✅ *Purchase Request Sent!*\n\nWe have alerted the seller that you want to buy *${product.title}*.\n\nPlease wait for their reply right here in this chat to arrange delivery and payment!`;
    await sendWhatsAppMessage(buyerPhone, buyerConfirmation);

  } catch (error) {
    console.error("❌ Error handling native checkout:", error);
    await sendWhatsAppMessage(buyerPhone, "Oops, something went wrong setting up your chat. Please try again.");
  }
}

// ==========================================
// HELPER: PROCESS NEW WEBSITE INQUIRY
// ==========================================
async function handleNewWebsiteInquiry(buyerPhone: string, productId: string) {
  try {
    console.log(`🛒 Processing new website inquiry for Product ID: ${productId} from ${buyerPhone}`);

    const productDoc = await adminDb.collection("products").doc(productId).get();
    
    if (!productDoc.exists) {
      await sendWhatsAppMessage(buyerPhone, "Sorry, we couldn't find that product. It may have been sold or removed.");
      return;
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

    // Alert the Seller using the approved template
    await NotificationService.buyerInquiry(product.sellerPhone, product.title);

    // Reply to the Buyer
    const buyerConfirmation = `✅ *Inquiry Sent!*\n\nWe have alerted the seller about your interest in *${product.title}*.\n\nPlease wait for their reply right here in this chat.`;
    await sendWhatsAppMessage(buyerPhone, buyerConfirmation);

  } catch (error) {
    console.error("❌ Error handling website inquiry:", error);
    await sendWhatsAppMessage(buyerPhone, "Oops, something went wrong setting up your chat. Please try again.");
  }
}
