// lib/notifications.ts
import { sendWhatsAppTemplate } from "./whatsapp";

export const NotificationService = {
  // ==========================================
  // 1. ORDER CREATED (Cart Checkout / Immediate Buy)
  // ==========================================
  async orderCreated(
    sellerPhone: string, 
    buyerPhone: string, 
    productName: string, 
    buyerName: string, 
    orderNumber: string
  ) {
    console.log(`[WhatsApp Trigger] New Order: ${orderNumber}`);

    // Notify Seller
    try {
      console.log(`-> Attempting to notify SELLER at ${sellerPhone}...`);
      await sendWhatsAppTemplate(sellerPhone, "new_order_notification", [productName], "en_US");
      console.log("✅ SELLER notification sent successfully!");
    } catch (error: any) {
      console.error("❌ SELLER NOTIFICATION FAILED:", error.message || error);
    }

    // Notify Buyer
    try {
      console.log(`-> Attempting to notify BUYER at ${buyerPhone}...`);
      await sendWhatsAppTemplate(
        buyerPhone, 
        "order_confirmation_clean", 
        [buyerName || "Customer", orderNumber], 
        "en_US"
      );
      console.log("✅ BUYER notification sent successfully!");
    } catch (error: any) {
      console.error("❌ BUYER NOTIFICATION FAILED:", error.message || error);
    }
  },

  // ==========================================
  // 2. NEW BUYER INQUIRY (Website "Buy via WhatsApp" Button)
  // ==========================================
  async buyerInquiry(sellerPhone: string, productName: string) {
    try {
      // ⚠️ Uses the newly approved "new_buyer_inquiry" template
      await sendWhatsAppTemplate(sellerPhone, "new_buyer_inquiry", [productName], "en_US");
      console.log("✅ BUYER INQUIRY sent successfully!");
    } catch (error: any) {
      console.error("❌ BUYER INQUIRY FAILED:", error.message || error);
    }
  },

  // ==========================================
  // 3. CONVERSATION TIMEOUTS & UPDATES (New Templates)
  // ==========================================
  
  // Ping when the 24-hour window is about to close or the seller hasn't replied
  async awaitingResponse(targetPhone: string, productName: string) {
    try {
      await sendWhatsAppTemplate(targetPhone, "conversation_awaiting_response", [productName], "en_US");
      console.log(`✅ Awaiting response ping sent to ${targetPhone}`);
    } catch (error: any) {
      console.error("❌ AWAITING RESPONSE PING FAILED:", error.message || error);
    }
  },

  // Ping if an admin or the system needs to force an update into a closed chat
  async updateNotice(targetPhone: string, productName: string) {
    try {
      await sendWhatsAppTemplate(targetPhone, "conversation_update_notice", [productName], "en_US");
      console.log(`✅ Update notice sent to ${targetPhone}`);
    } catch (error: any) {
      console.error("❌ UPDATE NOTICE FAILED:", error.message || error);
    }
  },

  // ==========================================
  // 4. FUTURE STATUS UPDATES (Placeholders)
  // ==========================================
  async orderAccepted(buyerPhone: string, productName: string) {
    console.log("Order Accepted triggered");
  },

  async orderReady(buyerPhone: string, agentPhone: string | null, productName: string) {
    console.log("Order Ready triggered");
  },

  async orderDelivered(buyerPhone: string, sellerPhone: string, productName: string) {
    console.log("Order Delivered triggered");
  },

  async orderCancelled(buyerPhone: string, sellerPhone: string, productName: string) {
    console.log("Order Cancelled triggered");
  }
};
