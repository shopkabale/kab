// lib/bot/handlers.ts
import { adminDb } from "@/lib/firebase/admin";
import * as admin from "firebase-admin";

import { 
  sendWhatsAppMessage, 
  sendWhatsAppInteractiveButtons, 
  sendWhatsAppListMenu 
} from "@/lib/whatsapp";
import { NotificationService } from "@/lib/notifications";
import { sendAdminAlert } from "@/lib/brevo"; 

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
  }

  const upperText = text.trim().toUpperCase();

  // ==========================================
  // 🛒 1. SHOPPING OVERRIDES (MUST BE FIRST)
  // ==========================================
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

  if (buttonId.startsWith("cat_")) {
    const parts = buttonId.split("_");
    const categoryName = parts.slice(1, -1).join("_"); 
    const pageNumber = parseInt(parts[parts.length - 1]); 
    await handleCategoryBrowsing(senderPhone, categoryName, pageNumber);
    return true;
  }

  // ==========================================
  // 🧭 2. NATIVE MENUS & NAVIGATION
  // ==========================================
  if (buttonId === "cmd_search") {
    // We don't need a complex bot flow for search anymore. Just tell them to talk to the AI!
    await sendWhatsAppMessage(senderPhone, "🔍 Just type what you are looking for! (e.g., 'I need a charger' or 'shoes')");
    return true;
  }

  if (buttonId === "btn_shop" || upperText === "BUY") {
    await sendWhatsAppListMenu(
      senderPhone,
      "Select a category to view items, or simply type out what you need!",
      "Browse Catalog",
      [{
        title: "Marketplace Menu",
        rows: [
          { id: "cat_electronics_0", title: "📱 Electronics & Tech" },
          { id: "cat_fashion_0", title: "👕 Fashion & Wear" },
          { id: "cat_student_item_0", title: "🎒 Student Essentials" }, 
          { id: "cmd_search", title: "🔍 Search (Type it out!)", description: "Just tell me what you need" }
        ]
      }]
    );
    return true;
  }

  // ==========================================
  // 📞 3. DIRECT HELP & CONTACT
  // ==========================================
  if (buttonId === "btn_help" || upperText === "HELP" || upperText === "SUPPORT") {
    await sendWhatsAppMessage(
      senderPhone, 
      "🛡️ *Kabale Online Support*\n\nIf you have an issue with an order or need assistance, please call or WhatsApp our admin directly at:\n\n📞 *0759997376*\n\n_We are always here to help!_"
    );
    return true;
  }

  // ==========================================
  // 👋 4. BULLETPROOF GREETINGS
  // ==========================================
  const greetings = ["HI", "HELLO", "HEY", "MENU", "START"];
  const pureText = text.replace(/[^a-zA-Z]/g, "").toUpperCase();

  if (message.type === "text" && greetings.includes(pureText)) {
    await sendWelcomeMenu(senderPhone);
    return true; 
  }

  // If it is none of the above, return false so the Webhook passes it to the Groq AI!
  return false; 
}

// ==========================================
// HELPER: SEND WELCOME MENU
// ==========================================
async function sendWelcomeMenu(phone: string) {
  const bodyText = "Welcome to *Kabale Online*! 🛒\n\nThe safest online marketplace in Kabale. What would you like to do today?";
  const buttons = [
    { id: "btn_shop", title: "🛍️ Shop Products" },
    { id: "btn_help", title: "📞 Contact Support" }
  ];
  await sendWhatsAppInteractiveButtons(phone, bodyText, buttons);
}

// ==========================================
// HELPER: FETCH CATEGORY ITEMS (Firebase)
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
    // 🔥 THE FIX: Sanitize the ID to prevent any weird hidden characters from breaking Firebase
    const cleanId = productId.replace(/[^a-zA-Z0-9_-]/g, "");
    let productData = null;
    let actualDocId = cleanId;

    // 1. Try the direct Firebase Document ID first
    const exactDoc = await adminDb.collection("products").doc(cleanId).get();
    if (exactDoc.exists) {
      productData = exactDoc.data();
    }

    // 2. FALLBACK 1: Try checking if Algolia's objectID matches a field in the database
    if (!productData) {
      const algoliaQuery = await adminDb.collection("products").where("objectID", "==", cleanId).limit(1).get();
      if (!algoliaQuery.empty) {
        productData = algoliaQuery.docs[0].data();
        actualDocId = algoliaQuery.docs[0].id;
      }
    }

    // 3. FALLBACK 2: Try checking the publicId
    if (!productData) {
      const idQuery = await adminDb.collection("products").where("publicId", "==", cleanId).limit(1).get();
      if (!idQuery.empty) {
        productData = idQuery.docs[0].data();
        actualDocId = idQuery.docs[0].id; 
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

    const messageText = `*${safeTitle}*\n\n💰 Price: *UGX ${safePrice}*\n📝 Condition: ${safeCondition}\n\n${safeDesc}\n\nTo buy this item, tap the button below!`;

    // 🔥 THE FIX: Removed the `safeImage` parameter entirely.
    // This stops Meta from silently dropping the 400 error due to long/invalid Firebase image URLs.
    await sendWhatsAppInteractiveButtons(
      phone,
      messageText,
      [{ id: `buy_${actualDocId}`, title: "🛒 Buy Now" }]
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

    // 🔥 POST-CHECKOUT TRUST ASSURANCE
    await sendWhatsAppMessage(
      buyerPhone, 
      "✅ *Your order is confirmed.*\n\nYou will pay only after receiving the item. 🛡️ We are here to help if anything goes wrong."
    );

  } catch (error) {
    console.error("❌ Error handling native checkout:", error);
    await sendWhatsAppMessage(buyerPhone, "Oops, something went wrong setting up your order. Please try again.");
  }
}
