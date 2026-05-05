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
  // 🔥 2. RESTORED LEAD TRACKER (Website Inquiries)
  // ==========================================
  const productIdMatch = text.match(/Product ID:\s*\[([a-zA-Z0-9_-]+)\]/i);
  if (productIdMatch) {
    const productId = productIdMatch[1];
    await handleNewWebsiteInquiry(senderPhone, productId, text); 
    return true; 
  }

  // ==========================================
  // 🧭 3. NATIVE MENUS & NAVIGATION
  // ==========================================
  if (buttonId === "cmd_search") {
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
  // 📞 4. DIRECT HELP & CONTACT
  // ==========================================
  if (buttonId === "btn_help" || upperText === "HELP" || upperText === "SUPPORT") {
    await sendWhatsAppMessage(
      senderPhone, 
      "🛡️ *Kabale Online Support*\n\nIf you have an issue with an order or need assistance, please call or WhatsApp our admin directly at:\n\n📞 *0759997376*\n\n_We are always here to help!_"
    );
    return true;
  }

  // ==========================================
  // 👋 5. BULLETPROOF GREETINGS
  // ==========================================
  const greetings = ["HI", "HELLO", "HEY", "MENU", "START"];
  const pureText = text.replace(/[^a-zA-Z]/g, "").toUpperCase();

  if (message.type === "text" && greetings.includes(pureText)) {
    await sendWelcomeMenu(senderPhone);
    return true; 
  }

  // Pass everything else to April!
  return false; 
}

// ==========================================
// HELPER: SEND WELCOME MENU
// ==========================================
async function sendWelcomeMenu(phone: string) {
  const bodyText = "Welcome to *Kabale Online*! 🛒\n\nThe safest student marketplace in Kabale. What would you like to do today?";
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
    // Stripping hidden characters
    const cleanId = productId.replace(/[^a-zA-Z0-9_-]/g, "");
    let productData = null;
    let actualDocId = cleanId;

    // Direct Firebase Document ID
    const exactDoc = await adminDb.collection("products").doc(cleanId).get();
    if (exactDoc.exists) productData = exactDoc.data();

    // FALLBACK 1: Algolia objectID match
    if (!productData) {
      const algoliaQuery = await adminDb.collection("products").where("objectID", "==", cleanId).limit(1).get();
      if (!algoliaQuery.empty) {
        productData = algoliaQuery.docs[0].data();
        actualDocId = algoliaQuery.docs[0].id;
      }
    }

    // FALLBACK 2: publicId match
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
    
    // Original safeImage logic exactly as it was
    const safeImage = (productData.images && Array.isArray(productData.images) && productData.images.length > 0) ? productData.images[0] : undefined;

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

    await sendWhatsAppMessage(
      buyerPhone, 
      "✅ *Your order is confirmed.*\n\nYou will pay only after receiving the item. 🛡️ We are here to help if anything goes wrong."
    );

  } catch (error) {
    console.error("❌ Error handling native checkout:", error);
    await sendWhatsAppMessage(buyerPhone, "Oops, something went wrong setting up your order. Please try again.");
  }
}

// ==========================================
// 🚨 RESTORED: LEGACY WEBSITE INQUIRY FALLBACK (LEAD TRACKER)
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

    await sendWhatsAppMessage(product.sellerPhone, `*Buyer added a note via website:*\n"${originalMessage}"`);

  } catch (error) {
    console.error("❌ Error handling website inquiry:", error);
    await sendWhatsAppMessage(buyerPhone, "Oops, something went wrong setting up your chat. Please try again.");
  }
}
