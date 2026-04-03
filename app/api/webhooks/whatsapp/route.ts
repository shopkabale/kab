import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

import { sendWhatsAppMessage } from "@/lib/whatsapp"; 
import { checkIsBotFlow } from "@/lib/bot/handlers"; 
import { logChat } from "@/lib/bot/chatLogger"; 

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

    console.warn("⚠️ Webhook verification failed. Invalid token or mode.");
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

    // 1. Validate Payload Origin
    if (body?.object !== "whatsapp_business_account") {
      return new NextResponse("Not Found", { status: 404 });
    }

    const entries = body.entry || [];
    const messagePromises: Promise<void>[] = [];

    // 2. Extract all messages and push them to a concurrent processing queue
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const value = change.value;

        // Handle Status Updates (Read Receipts, Delivered, etc.)
        if (value?.statuses) {
          for (const status of value.statuses) {
            console.log(`ℹ️ Status update: Message ${status.id} is ${status.status}`);
          }
        }

        // Handle Actual Messages
        if (value?.messages && value.messages.length > 0) {
          for (const message of value.messages) {
            // 🔥 Push to array instead of awaiting here to process concurrently!
            messagePromises.push(processWhatsAppMessage(message));
          }
        }
      }
    }

    // 3. Execute all messages simultaneously and safely catch any individual failures
    await Promise.allSettled(messagePromises);

    // 4. Always return a fast 200 OK so Meta doesn't retry and send duplicates
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error("🚨 FATAL WEBHOOK CRASH:", error.message);
    // Still return 200 to Meta on soft crashes to prevent infinite retry loops
    return NextResponse.json({ error: "Internal Server Error handled safely" }, { status: 200 });
  }
}

// ==========================================
// CORE LOGIC: Process a Single Message
// ==========================================
async function processWhatsAppMessage(message: any): Promise<void> {
  const fromPhone = message?.from;
  if (!fromPhone) return;

  try {
    console.log(`💬 Processing incoming payload from ${fromPhone}...`);

    // 1. Determine the text content for logging & proxying safely
    let incomingText = "[Media/Unsupported]";
    if (message.type === "text") {
      incomingText = message.text?.body || "";
    } else if (message.type === "interactive") {
      if (message.interactive?.type === "button_reply") {
        incomingText = `[Button: ${message.interactive.button_reply?.title}]`;
      } else if (message.interactive?.type === "list_reply") {
        incomingText = `[List Selection: ${message.interactive.list_reply?.title}]`;
      }
    } else if (message.type === "image") {
       incomingText = "[Image Received]";
    }

    // 2. Background logging (Fire and forget)
    logChat(fromPhone, "incoming", message.type, incomingText).catch(err => 
      console.error(`⚠️ Failed to log chat for ${fromPhone}:`, err)
    );

    // ==========================================
    // 3. NEW: The "First Contact" Deep Link Interceptor
    // ==========================================
    if (message.type === "text" && incomingText.includes("Product ID:")) {
      const productIdMatch = incomingText.match(/Product ID:\s*\[(.*?)\]/);
      
      if (productIdMatch && productIdMatch[1]) {
        const productId = productIdMatch[1];
        console.log(`🔍 Deep link intercepted for Product ID: ${productId}`);

        // Fetch product from DB to find the seller
        const productSnap = await adminDb.collection("products").doc(productId).get();
        
        if (productSnap.exists) {
          const productData = productSnap.data();
          const rawSellerPhone = productData?.sellerPhone;
          const sellerPhone = normalizeForMeta(rawSellerPhone || "");
          const buyerPhone = normalizeForMeta(fromPhone);

          if (sellerPhone && sellerPhone !== buyerPhone) {
            // Forward the inquiry to the Seller
            const sellerMsg = `🚨 *New Buyer Inquiry!*\n\nSomeone is interested in your: *${productData?.name || "item"}*\n\nBuyer says:\n"${incomingText}"\n\n_Reply to this message to chat with them. Your number is hidden._`;
            await sendWhatsAppMessage(sellerPhone, sellerMsg);
            logChat(sellerPhone, "outgoing", "text", sellerMsg).catch(console.error);

            // 🔥 FIX THE PROXY: Create a 'pending' order so future messages route correctly
            // First, check if a session already exists to prevent spam
            const existingSession = await adminDb.collection("orders")
              .where("buyerPhone", "==", buyerPhone)
              .where("sellerPhone", "==", sellerPhone)
              .where("productId", "==", productId)
              .where("status", "==", "pending")
              .get();

            if (existingSession.empty) {
              const newOrderRef = adminDb.collection("orders").doc();
              await newOrderRef.set({
                id: newOrderRef.id,
                productId: productId,
                productName: productData?.name || "Unknown Item",
                buyerPhone: buyerPhone,
                sellerPhone: sellerPhone,
                status: "pending",
                createdAt: Date.now(), // Keeps sorting intact for getActiveChatPartner
              });
              console.log(`✅ Created new proxy session between ${buyerPhone} and ${sellerPhone}`);
            }

            // Return immediately so the bot doesn't try to handle this message
            return; 
          }
        } else {
          console.log(`⚠️ Product ${productId} not found in database.`);
        }
      }
    }
    // ==========================================

    // 4. Let the Bot try to handle it first (if it wasn't a deep link)
    const isBotHandled = await checkIsBotFlow(fromPhone, message);
    if (isBotHandled) {
      console.log(`🤖 Bot fully handled the interaction for ${fromPhone}.`);
      return; 
    }

    // 5. Proxy Relay Logic (Human-to-Human)
    const targetPhone = await getActiveChatPartner(fromPhone);

    if (targetPhone) {
      const forwardedText = `*New Message:*\n${incomingText}`;

      // Send the forwarded message
      await sendWhatsAppMessage(targetPhone, forwardedText);

      // Log the outgoing message so it appears correctly in your Admin Inbox
      logChat(targetPhone, "outgoing", "text", incomingText).catch(console.error);

      console.log(`✅ Relayed message seamlessly from ${fromPhone} to ${targetPhone}`);
        } else {
      console.log(`ℹ️ No active transaction found for ${fromPhone}. Sending fallback reply.`);
      
      // 🚨 NEW: The "Friendly Fallback" Reply
      const fallbackText = `Hi there! 👋 Welcome to *Kabale Online*.\n\nI am your campus marketplace bot. I can help you safely buy or sell laptops, phones, and more right here at uni.\n\n👉 Type *MENU* to see options.\n👉 Or visit kabaleonline.com to find an item!`;

      await sendWhatsAppMessage(fromPhone, fallbackText);
      logChat(fromPhone, "outgoing", "text", fallbackText).catch(console.error);
    }


  } catch (error: any) {
    console.error(`❌ FAILED TO PROCESS MESSAGE FROM ${fromPhone}:`, error.message);
  }
}

// ==========================================
// HELPER FUNCTION: Format Phone for Meta API
// ==========================================
function normalizeForMeta(phone: string): string {
  if (!phone) return "";
  let cleanPhone = phone.replace(/\D/g, ""); 
  if (cleanPhone.startsWith("0")) {
    cleanPhone = "256" + cleanPhone.substring(1); 
  }
  return cleanPhone;
}

// ==========================================
// HELPER FUNCTION: Find who to send it to (BULLETPROOF EDITION)
// ==========================================
async function getActiveChatPartner(senderPhone: string): Promise<string | null> {
  try {
    const ordersRef = adminDb.collection("orders"); 
    const activeStatuses = ["pending", "confirmed", "out for delivery", "out_for_delivery"];

    const phoneVariations = [senderPhone, `+${senderPhone}`];
    if (senderPhone.startsWith("256")) {
      phoneVariations.push(`0${senderPhone.substring(3)}`); 
    }

    // Fetch ALL active orders for this user
    const [buyerSnap, sellerSnap] = await Promise.all([
      ordersRef.where("buyerPhone", "in", phoneVariations).where("status", "in", activeStatuses).get(),
      ordersRef.where("sellerPhone", "in", phoneVariations).where("status", "in", activeStatuses).get()
    ]);

    let allActiveOrders: any[] = [];

    buyerSnap.forEach(doc => allActiveOrders.push(doc.data()));
    sellerSnap.forEach(doc => allActiveOrders.push(doc.data()));

    // Sort by newest first
    allActiveOrders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    const normalizedSender = normalizeForMeta(senderPhone);

    // Loop through the orders to find a valid, DIFFERENT chat partner
    for (const order of allActiveOrders) {
      const normalizedBuyer = normalizeForMeta(order.buyerPhone);
      const normalizedSeller = normalizeForMeta(order.sellerPhone);

      // SCENARIO 1: Sender is the Buyer. Target is the Seller.
      if (normalizedSender === normalizedBuyer && normalizedSeller !== normalizedSender) {
        return normalizedSeller; 
      }

      // SCENARIO 2: Sender is the Seller. Target is the Buyer.
      if (normalizedSender === normalizedSeller && normalizedBuyer !== normalizedSender) {
        return normalizedBuyer; 
      }
    }

    return null; 
  } catch (error) {
    console.error("❌ Error looking up chat partner:", error);
    return null;
  }
}
