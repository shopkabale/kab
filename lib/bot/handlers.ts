import { adminDb } from "@/lib/firebase/admin";
import * as admin from "firebase-admin";

import { 
  sendWhatsAppMessage, 
  sendWhatsAppInteractiveButtons, 
  sendWhatsAppListMenu 
} from "@/lib/whatsapp";
import { NotificationService } from "@/lib/notifications";
import { processBotFlow } from "./botFlow"; 
import { sendAdminAlert } from "@/lib/brevo"; 

// 🔥 THE PRIMARY HUMAN HANDOVER NUMBER (Updated to 0784655792)
const HUMAN_AGENT_PHONE = "256784655792"; 

// ==========================================
// MAIN ROUTER: IS THIS A BOT COMMAND?
// ==========================================
export async function checkIsBotFlow(senderPhone: string, message: any): Promise<boolean> {
  let text = "";
  let buttonId = "";

  // 1. Extract text or button ID securely
  if (message.type === "text") {
    text = message.text?.body || "";
  } else if (message.type === "interactive" && message.interactive.type === "button_reply") {
    buttonId = message.interactive.button_reply.id;
    text = message.interactive.button_reply.title; 
  } else if (message.type === "interactive" && message.interactive.type === "list_reply") {
    buttonId = message.interactive.list_reply.id;
    text = message.interactive.list_reply.title;
  } else if (message.type === "image") {
    // If it's an image and they aren't in a proxy chat, they might be trying to upload. 
    // We redirect them to the web since we killed the WhatsApp uploader!
    await sendWhatsAppMessage(
      senderPhone, 
      "📸 *Great photo!*\n\nTo sell this item securely on Kabale Online, please upload it directly via our website:\n👉 https://www.kabaleonline.com/sell\n\n_It only takes 60 seconds!_"
    );
    return true;
  }

  const upperText = text.trim().toUpperCase();

  // ==========================================
  // 🚦 SMART AGENT OVERFLOW & AUTO-CANCEL
  // ==========================================
  const supportRef = adminDb.collection("support_sessions").doc(senderPhone);
  const supportDoc = await supportRef.get();

  if (supportDoc.exists) {
    const supportData = supportDoc.data()!;
    const lastInteraction = supportData.updatedAt || 0;
    const now = Date.now();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000; 

    // SCENARIO A: 24 Hours have passed. Admin is busy. Auto-cancel!
    if (now - lastInteraction > TWENTY_FOUR_HOURS) {
      await sendWhatsAppMessage(
        senderPhone, 
        "⚠️ *Notice:* The agent you were talking to is currently busy handling a high volume of requests.\n\nFor any new or urgent inquiries, please contact our direct line: *0784655792*.\n\n_Your previous chat session has been closed. Type MENU to browse the marketplace._"
      );
      await supportRef.delete(); // Unlock the user
      return true; // Stop processing so they can read the message
    } 
    
    // SCENARIO B: User explicitly wants to leave support mode early
    if (upperText === "MENU" || upperText === "CANCEL" || upperText === "STOP") {
      await supportRef.delete(); // Unlock the user silently
      // DO NOT return true here. We let the code continue downwards so the Welcome Menu triggers!
    } 
    
    // SCENARIO C: User is following up within 24 hours
    else {
      await sendWhatsAppMessage(
        HUMAN_AGENT_PHONE, 
        `💬 *Follow-up from +${senderPhone}:*\n"${text}"`
      );
      await supportRef.update({ updatedAt: now }); // Reset the 24hr clock
      return true; 
    }
  }

  // ==========================================
  // 🚨 THE UPLOAD ESCAPE HATCH (Legacy Support)
  // ==========================================
  if (upperText === "CANCEL" || upperText === "STOP") {
    await adminDb.collection("bot_sessions").doc(senderPhone).delete().catch(() => {});
    await sendWhatsAppMessage(senderPhone, "🚫 *Action Cancelled*\nYour upload has been safely cancelled.\n\nType *MENU* to start over.");
    return true; 
  }

  // 2. Catch the Buyer's Website Inquiry (Regex for "Product ID: [xxx]")
  const productIdMatch = text.match(/Product ID:\s*\[([a-zA-Z0-9_-]+)\]/i);
  if (productIdMatch) {
    const productId = productIdMatch[1];
    await handleNewWebsiteInquiry(senderPhone, productId, text); 
    return true; 
  }

  // ==========================================
  // SHOPPING & CATALOG LOGIC
  // ==========================================

  // A. Trigger the Categories Menu
  if (buttonId === "btn_shop" || upperText === "BUY") {
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
          { id: "cat_student_item_0", title: "🎒 Student Market" }, 
          { id: "cmd_search", title: "🔍 Search for an Item", description: "Type what you want to find" }
        ]
      }]
    );
    return true;
  }

  // B. Handle Category Selection & Pagination
  if (buttonId.startsWith("cat_")) {
    const parts = buttonId.split("_");
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

  // D. Handle Product Selection (Aggressive Lookup)
  if (buttonId.startsWith("item_")) {
    const productId = buttonId.replace("item_", "");
    await handleProductSelection(senderPhone, productId);
    return true;
  }

  // E. Handle "Buy Now" Checkout
  if (buttonId.startsWith("buy_")) {
    const productId = buttonId.replace("buy_", "");
    await handleNativeCheckout(senderPhone, productId);
    return true;
  }

  // ==========================================
  // STRICT SELLER REDIRECT
  // ==========================================
  if (buttonId === "btn_sell" || upperText === "SELL" || text.toLowerCase() === "/add") {
    await sendWhatsAppMessage(
      senderPhone, 
      "🚀 *Ready to make money?*\n\nTo ensure your item is listed beautifully and securely, please upload it directly on our website here:\n\n👉 https://www.kabaleonline.com/sell\n\n_It only takes 60 seconds!_"
    );
    return true;
  }

  // ==========================================
  // HELP DESK
  // ==========================================
  if (buttonId === "btn_help" || upperText === "HELP") {
    // Lock the user into support mode
    await adminDb.collection("support_sessions").doc(senderPhone).set({
      status: "open",
      updatedAt: Date.now()
    });

    await sendWhatsAppMessage(
      senderPhone, 
      "Connecting you to Kabale Online Support. Please type your question below and an agent will reply shortly.\n\n_If you want to stop waiting, just type MENU._"
    );

    // Tag them in CRM
    await adminDb.collection("customers").doc(senderPhone).update({ tags: admin.firestore.FieldValue.arrayUnion("needs_support") }).catch(()=> {});
    return true;
  }

  const greetings = ["HI", "HELLO", "HEY", "MENU", "START", "/START"];
  if (message.type === "text" && greetings.includes(upperText)) {
    await sendWelcomeMenu(senderPhone);
    return true; 
  }

  const isHandledByBotFlow = await processBotFlow(senderPhone, { type: "text", text });
  if (isHandledByBotFlow) {
    return true;
  }

  // ==========================================
  // 🚨 FALLBACK & HUMAN HANDOVER
  // ==========================================
  console.log(`⚠️ Bot didn't understand: "${text}" from ${senderPhone}. Forwarding to Human Agent.`);
  
  // 1. Lock the user in support mode
  await adminDb.collection("support_sessions").doc(senderPhone).set({
    status: "open",
    updatedAt: Date.now()
  });

  // 2. Notify the User
  await sendWhatsAppMessage(
    senderPhone, 
    "🤖 I'm not quite sure how to help with that.\n\nI have forwarded your message to our human agent. They will reply to you shortly! 🕒\n\n_If you want to stop waiting, just type MENU._"
  );
  
  // 3. Forward to Primary Admin
  const handoverMessage = `🚨 *BOT ESCALATION*\n\n*User:* +${senderPhone}\n*Message:* "${text}"\n\n_Please reply to them directly._`;
  await sendWhatsAppMessage(HUMAN_AGENT_PHONE, handoverMessage);

  return true; 
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
// HELPER: FETCH CATEGORY ITEMS
// ==========================================
async function handleCategoryBrowsing(phone: string, category: string, page: number) {
  try {
    const limit = 9;
    const offset = page * limit;

    const productsQuery = await adminDb.collection("products")
      .where("category", "==", category)
      .limit(limit + 1) 
      .offset(offset)
      .get();

    if (productsQuery.empty) {
      return await sendWhatsAppMessage(phone, `There are currently no items in the *${category.replace('_', ' ')}* category. Check back later!`);
    }

    const hasNextPage = productsQuery.docs.length > limit;
    const docsToShow = hasNextPage ? productsQuery.docs.slice(0, limit) : productsQuery.docs;

    const productRows = docsToShow.map(doc => {
      const data = doc.data();
      const safeTitle = (data.title || data.name || "Unknown Item").substring(0, 24);
      const safePrice = Number(data.price || 0).toLocaleString();

      return {
        id: `item_${doc.id}`,
        title: safeTitle,
        description: `UGX ${safePrice}` 
      };
    });

    const sections: any[] = [{ title: "Available Items", rows: productRows }];

    if (hasNextPage) {
      sections.push({
        title: "Navigation",
        rows: [{
          id: `cat_${category}_${page + 1}`,
          title: "➡️ See More Items",
          description: "Load the next page"
        }]
      });
    }

    const formattedCategory = category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

    await sendWhatsAppListMenu(
      phone,
      `Here are the latest items in *${formattedCategory}*:`,
      "View Items",
      sections
    );
  } catch (error: any) {
    console.error("❌ Category Browsing Error:", error.message);
    await sendWhatsAppMessage(phone, "Oops, we ran into an issue loading this category. Please try again.");
  }
}

// ==========================================
// HELPER: SHOW PRODUCT DETAILS
// ==========================================
async function handleProductSelection(phone: string, productId: string) {
  try {
    const cleanId = productId.trim();
    let productData = null;
    let actualDocId = cleanId;

    const exactDoc = await adminDb.collection("products").doc(cleanId).get();
    if (exactDoc.exists) {
      productData = exactDoc.data();
    }

    if (!productData) {
      const idQuery = await adminDb.collection("products").where("publicId", "==", cleanId).limit(1).get();
      if (!idQuery.empty) {
        productData = idQuery.docs[0].data();
        actualDocId = idQuery.docs[0].id; 
      }
    }

    if (!productData) {
      const algoliaQuery = await adminDb.collection("products").where("objectID", "==", cleanId).limit(1).get();
      if (!algoliaQuery.empty) {
        productData = algoliaQuery.docs[0].data();
        actualDocId = algoliaQuery.docs[0].id;
      }
    }

    if (!productData) {
      return await sendWhatsAppMessage(
        phone, 
        "This item has been removed by the seller or is no longer available. 😔\n\nPlease search for something else!"
      );
    }

    const safeTitle = productData.title || productData.name || "Unknown Item";
    const safePrice = Number(productData.price || 0).toLocaleString();
    const safeCondition = productData.condition || "Used";
    const safeDesc = productData.description || "No description provided.";

    const safeImage = (productData.images && productData.images.length > 0) ? productData.images[0] : undefined;

    const messageText = `*${safeTitle}*\n\n💰 Price: *UGX ${safePrice}*\n📝 Condition: ${safeCondition}\n\n${safeDesc}\n\nTo buy this item, tap the button below!`;

    await sendWhatsAppInteractiveButtons(
      phone,
      messageText,
      [{ id: `buy_${actualDocId}`, title: "🛒 Buy Now" }],
      safeImage 
    );
  } catch (error: any) {
    console.error("❌ Product Selection Error:", error.message);
    await sendWhatsAppMessage(phone, "Oops, we couldn't load the details for this item right now.");
  }
}

// ==========================================
// HELPER: NATIVE WHATSAPP CHECKOUT
// ==========================================
async function handleNativeCheckout(buyerPhone: string, productId: string) {
  try {
    const productDoc = await adminDb.collection("products").doc(productId).get();

    if (!productDoc.exists) {
      await sendWhatsAppMessage(buyerPhone, "Sorry, this item is no longer available or has been sold.");
      return;
    }

    const product = productDoc.data()!;
    const orderNumber = `KAB-${Math.floor(1000 + Math.random() * 9000)}`;
    const productPrice = Number(product.price) || 0;

    await adminDb.collection("orders").doc(orderNumber).set({
      orderId: orderNumber,
      productId: productId,
      buyerPhone: buyerPhone,
      sellerPhone: product.sellerPhone,
      status: "pending",
      total: productPrice, 
      items: [{            
        productId: productId,
        title: product.title || product.name || "Unknown Item",
        price: productPrice,
        quantity: 1
      }],
      createdAt: Date.now(),
      updatedAt: Date.now(), 
      messageCount: 0        
    });

    sendAdminAlert(
      orderNumber, 
      product.title || product.name || "Unknown Item", 
      productPrice, 
      buyerPhone, 
      product.sellerPhone
    ).catch(console.error);

    await NotificationService.orderCreated(
      product.sellerPhone, 
      buyerPhone, 
      product.title || product.name, 
      "Valued Customer", 
      orderNumber
    );

    const followUpText = `The seller has been notified. They will reply to you right here in this chat to arrange delivery and payment! 🤝`;
    await sendWhatsAppMessage(buyerPhone, followUpText);

  } catch (error) {
    console.error("❌ Error handling native checkout:", error);
    await sendWhatsAppMessage(buyerPhone, "Oops, something went wrong setting up your chat. Please try again.");
  }
}

// ==========================================
// HELPER: PROCESS NEW WEBSITE INQUIRY
// ==========================================
async function handleNewWebsiteInquiry(buyerPhone: string, productId: string, originalMessage: string) {
  try {
    const productDoc = await adminDb.collection("products").doc(productId).get();

    if (!productDoc.exists) {
      await sendWhatsAppMessage(buyerPhone, "Sorry, we couldn't find that product. It may have been sold or removed.");
      return;
    }

    const product = productDoc.data()!;
    const orderNumber = `KAB-${Math.floor(1000 + Math.random() * 9000)}`;
    const productPrice = Number(product.price) || 0;

    await adminDb.collection("orders").doc(orderNumber).set({
      orderId: orderNumber,
      productId: productId,
      buyerPhone: buyerPhone,
      sellerPhone: product.sellerPhone,
      status: "pending",
      total: productPrice, 
      items: [{            
        productId: productId,
        title: product.title || product.name || "Unknown Item",
        price: productPrice,
        quantity: 1
      }],
      createdAt: Date.now(),
      updatedAt: Date.now(), 
      messageCount: 0        
    });

    sendAdminAlert(
      orderNumber, 
      product.title || product.name || "Unknown Item", 
      productPrice, 
      buyerPhone, 
      product.sellerPhone
    ).catch(console.error);

    const sellerNotification = `🛍️ *New Order Inquiry!*\n\nSomeone is interested in your item: *${product.title || product.name || "Unknown Item"}*\n\n*Buyer says:*\n"${originalMessage}"\n\n_Reply directly to this message to chat with the buyer._`;
    await sendWhatsAppMessage(product.sellerPhone, sellerNotification);

    const buyerConfirmation = `✅ *Inquiry Sent!*\n\nWe have alerted the seller about your interest in *${product.title || product.name || "Unknown Item"}*.\n\nPlease wait for their reply right here in this chat.`;
    await sendWhatsAppMessage(buyerPhone, buyerConfirmation);

  } catch (error) {
    console.error("❌ Error handling website inquiry:", error);
    await sendWhatsAppMessage(buyerPhone, "Oops, something went wrong setting up your chat. Please try again.");
  }
}
