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

// 🔥 NEW IMPORTS FOR AI & SEARCH
import { getCustomerIntent } from "./aiEngine";
import algoliasearch from "algoliasearch";

// ==========================================
// INITIALIZE ALGOLIA FOR AI SEARCHES
// ==========================================
const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || "", 
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || ""
);
const index = searchClient.initIndex(process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || "products");

// 🔥 THE PRIMARY HUMAN HANDOVER NUMBER
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
    await sendWhatsAppMessage(
      senderPhone, 
      "📸 *Great photo!*\n\nTo sell this item securely on Kabale Online, please upload it directly via our website:\n👉 https://www.kabaleonline.com/sell\n\n_It only takes 60 seconds!_"
    );
    return true;
  }

  let upperText = text.trim().toUpperCase();

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

    if (now - lastInteraction > TWENTY_FOUR_HOURS) {
      await sendWhatsAppMessage(
        senderPhone, 
        "⚠️ *Notice:* The agent you were talking to is currently busy handling a high volume of requests.\n\nFor any new or urgent inquiries, please contact our direct line: *0784655792*.\n\n_Your previous chat session has been closed. Type MENU to browse the marketplace._"
      );
      await supportRef.delete(); 
      return true; 
    } 

    if (upperText === "MENU" || upperText === "CANCEL" || upperText === "STOP") {
      await supportRef.delete(); 
    } else {
      await sendWhatsAppMessage(
        HUMAN_AGENT_PHONE, 
        `💬 *Follow-up from +${senderPhone}:*\n"${text}"`
      );
      await supportRef.update({ updatedAt: now }); 
      return true; 
    }
  }

  // ==========================================
  // 🚨 THE UPLOAD ESCAPE HATCH (Legacy Support)
  // ==========================================
  if (upperText === "CANCEL" || upperText === "STOP") {
    await adminDb.collection("bot_sessions").doc(senderPhone).delete().catch(() => {});
    await sendWhatsAppMessage(senderPhone, "🚫 *Action Cancelled*\nYour action has been safely cancelled.\n\nType *MENU* to start over.");
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

  if (buttonId.startsWith("cat_")) {
    const parts = buttonId.split("_");
    const categoryName = parts.slice(1, -1).join("_"); 
    const pageNumber = parseInt(parts[parts.length - 1]); 
    await handleCategoryBrowsing(senderPhone, categoryName, pageNumber);
    return true;
  }

  if (buttonId === "cmd_search") {
    await processBotFlow(senderPhone, { type: "text", text: "/search" });
    return true;
  }

  if (buttonId.startsWith("item_")) {
    const productId = buttonId.replace("item_", "");
    await handleProductSelection(senderPhone, productId);
    return true;
  }

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
  // HELP DESK EXPLICIT
  // ==========================================
  if (buttonId === "btn_help" || upperText === "HELP") {
    await adminDb.collection("support_sessions").doc(senderPhone).set({ status: "open", updatedAt: Date.now() });
    await sendWhatsAppMessage(
      senderPhone, 
      "Connecting you to Kabale Online Support. Please type your question below and an agent will reply shortly.\n\n_If you want to stop waiting, just type MENU._"
    );
    await adminDb.collection("customers").doc(senderPhone).update({ tags: admin.firestore.FieldValue.arrayUnion("needs_support") }).catch(()=> {});
    return true;
  }

  // ==========================================
  // BULLETPROOF GREETINGS
  // ==========================================
  const greetings = ["HI", "HELLO", "HEY", "MENU", "START"];
  const pureText = text.replace(/[^a-zA-Z]/g, "").toUpperCase();

  if (message.type === "text" && greetings.includes(pureText)) {
    await adminDb.collection("support_sessions").doc(senderPhone).delete().catch(() => {});
    await sendWelcomeMenu(senderPhone);
    return true; 
  }

  // ==========================================
  // 🧠 AI NLP ROUTING & SEARCH (GEMINI)
  // ==========================================
  if (message.type === "text" && text.split(" ").length >= 2) {
    console.log(`🤖 AI Processing NLP: "${text}"`);
    const aiIntent = await getCustomerIntent(text);

    if (aiIntent.action === "chat" && aiIntent.reply) {
      await sendWhatsAppMessage(senderPhone, `🤖 ${aiIntent.reply}`);
      return true;
    }

    if (aiIntent.action === "search" && aiIntent.query) {
      const { hits } = await index.search(aiIntent.query, { hitsPerPage: 8 });

      if (hits.length > 0) {
        const rows = hits.map((hit: any) => ({
          id: `item_${hit.objectID}`, 
          title: hit.name.substring(0, 24), 
          description: `UGX ${Number(hit.price).toLocaleString()}`.substring(0, 72)
        }));

        await sendWhatsAppListMenu(
          senderPhone,
          `🤖 I understand you're looking for *${aiIntent.query}*. Here are the best matches I found:`,
          "View Matches",
          [{ title: "AI Search Results", rows: rows }]
        );
        return true; 
      } else {
        await sendWhatsAppMessage(senderPhone, `🤖 I searched the marketplace for *${aiIntent.query}* but couldn't find any exact matches right now. Try browsing our categories or typing MENU!`);
        return true;
      }
    }

    if (aiIntent.action === "support") {
        upperText = "HELP"; 
    }
  }

  // ==========================================
  // 🚨 FALLBACK & HUMAN HANDOVER
  // ==========================================
  console.log(`⚠️ Bot & AI Escalating: "${text}" from ${senderPhone}. Forwarding to Human Agent.`);

  await adminDb.collection("support_sessions").doc(senderPhone).set({
    status: "open",
    updatedAt: Date.now()
  });

  await sendWhatsAppMessage(
    senderPhone, 
    "🤖 I'm not quite sure how to help with that, or you've asked for an agent.\n\nI have forwarded your message to our human team. They will reply to you shortly! 🕒\n\n_If you want to stop waiting, just type MENU._"
  );

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
// 🚀 NATIVE WHATSAPP CHECKOUT (UNIFIED COD ENGINE)
// ==========================================
async function handleNativeCheckout(buyerPhone: string, productId: string) {
  try {
    const productDoc = await adminDb.collection("products").doc(productId).get();

    if (!productDoc.exists) {
      await sendWhatsAppMessage(buyerPhone, "Sorry, this item is no longer available or has been sold.");
      return;
    }

    const product = productDoc.data()!;
    const productPrice = Number(product.price) || 0;
    const safeTitle = product.title || product.name || "Unknown Item";
    const orderNumber = `KAB-${Math.floor(1000 + Math.random() * 9000)}`;

    // 🔥 SAVE MASTER COD ORDER SCHEMA
    await adminDb.collection("orders").doc(orderNumber).set({
      orderId: orderNumber,
      buyerPhone: buyerPhone,
      buyerName: "WhatsApp User", 
      source: "whatsapp",
      paymentMode: "COD",
      paymentStatus: "pending",
      status: "processing", 
      totalAmount: productPrice, 
      cartItems: [{            
        productId: productId,
        name: safeTitle,
        price: productPrice,
        quantity: 1,
        sellerId: product.sellerId || "SYSTEM",
        sellerPhone: product.sellerPhone || ""
      }],
      sellerOrders: [{
        sellerId: product.sellerId || "SYSTEM",
        sellerPhone: product.sellerPhone || "",
        subtotal: productPrice,
        items: [{
          productId: productId,
          name: safeTitle,
          price: productPrice,
          quantity: 1
        }]
      }],
      createdAt: Date.now(),
      updatedAt: Date.now(), 
      messageCount: 0        
    });

    // Fire correct notifications
    sendAdminAlert(orderNumber, `1x ${safeTitle}`, productPrice, buyerPhone, product.sellerPhone || "SYSTEM").catch(console.error);
    await NotificationService.notifyBuyer(buyerPhone, orderNumber, `1x ${safeTitle}`, productPrice);
    await NotificationService.notifySeller(
      product.sellerPhone, 
      "Partner", 
      orderNumber, 
      `1x ${safeTitle}`, 
      productPrice, 
      "WhatsApp User", 
      "Kabale", 
      buyerPhone
    );

    // No need for followUpText because notifyBuyer sends the beautiful template!

  } catch (error) {
    console.error("❌ Error handling native checkout:", error);
    await sendWhatsAppMessage(buyerPhone, "Oops, something went wrong setting up your order. Please try again.");
  }
}

// ==========================================
// 🚨 LEGACY WEBSITE INQUIRY FALLBACK 
// (For users clicking old Product ID: [xxx] links)
// ==========================================
async function handleNewWebsiteInquiry(buyerPhone: string, productId: string, originalMessage: string) {
  try {
    const productDoc = await adminDb.collection("products").doc(productId).get();

    if (!productDoc.exists) {
      await sendWhatsAppMessage(buyerPhone, "Sorry, we couldn't find that product. It may have been sold or removed.");
      return;
    }

    const product = productDoc.data()!;
    const productPrice = Number(product.price) || 0;
    const safeTitle = product.title || product.name || "Unknown Item";
    const orderNumber = `KAB-${Math.floor(1000 + Math.random() * 9000)}`;

    // 🔥 SAVE MASTER COD ORDER SCHEMA
    await adminDb.collection("orders").doc(orderNumber).set({
      orderId: orderNumber,
      buyerPhone: buyerPhone,
      buyerName: "Website User",
      source: "whatsapp",
      paymentMode: "COD",
      paymentStatus: "pending",
      status: "processing", 
      totalAmount: productPrice, 
      cartItems: [{            
        productId: productId,
        name: safeTitle,
        price: productPrice,
        quantity: 1,
        sellerId: product.sellerId || "SYSTEM",
        sellerPhone: product.sellerPhone || ""
      }],
      sellerOrders: [{
        sellerId: product.sellerId || "SYSTEM",
        sellerPhone: product.sellerPhone || "",
        subtotal: productPrice,
        items: [{
          productId: productId,
          name: safeTitle,
          price: productPrice,
          quantity: 1
        }]
      }],
      createdAt: Date.now(),
      updatedAt: Date.now(), 
      messageCount: 0        
    });

    sendAdminAlert(orderNumber, `1x ${safeTitle}`, productPrice, buyerPhone, product.sellerPhone || "SYSTEM").catch(console.error);
    await NotificationService.notifyBuyer(buyerPhone, orderNumber, `1x ${safeTitle}`, productPrice);
    await NotificationService.notifySeller(
      product.sellerPhone, 
      "Partner", 
      orderNumber, 
      `1x ${safeTitle}`, 
      productPrice, 
      "Website User", 
      "Kabale", 
      buyerPhone
    );

    // Send the custom context to the seller so they know what the buyer asked
    await sendWhatsAppMessage(product.sellerPhone, `*Buyer added a note via website:*\n"${originalMessage}"`);

  } catch (error) {
    console.error("❌ Error handling website inquiry:", error);
    await sendWhatsAppMessage(buyerPhone, "Oops, something went wrong setting up your chat. Please try again.");
  }
}
