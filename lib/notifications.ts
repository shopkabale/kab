// lib/notifications.ts
import { sendWhatsAppTemplate } from "./whatsapp";

export const NotificationService = {
  
  // ==========================================
  // 1. MULTI-SELLER: NOTIFY SELLER 
  // Template: order_confirmation_seller_01
  // ==========================================
  async notifySeller(
    sellerPhone: string, 
    sellerName: string, 
    orderId: string, 
    itemsString: string, 
    subtotal: number, 
    buyerName: string,
    buyerLocation: string,
    buyerContact: string
  ) {
    console.log(`[WhatsApp] Routing seller sub-order to ${sellerPhone}...`);
    try {
      const variables = [
        sellerName || "Partner",                  // {{1}} Hello [Name]
        orderId,                                  // {{2}} Order ID
        itemsString,                              // {{3}} Items for you
        subtotal.toLocaleString(),                // {{4}} Total Value
        buyerName || "Customer",                  // {{5}} Name
        buyerLocation || "Kabale Town",           // {{6}} Location
        buyerContact                              // {{7}} Contact
      ];
      
      await sendWhatsAppTemplate(sellerPhone, "order_confirmation_seller_01", variables, "en_US");
      console.log(`✅ SELLER (${sellerPhone}) notification sent successfully!`);
    } catch (error: any) {
      console.error(`❌ SELLER NOTIFICATION FAILED [${sellerPhone}]:`, error.message || error);
    }
  },

  // ==========================================
  // 2. CONSOLIDATED: NOTIFY BUYER
  // Template: notify_buyer_02
  // ==========================================
  async notifyBuyer(
    buyerPhone: string, 
    orderId: string, 
    itemsString: string, 
    totalAmount: number
  ) {
    console.log(`[WhatsApp] Sending consolidated receipt to buyer ${buyerPhone}...`);
    try {
      const variables = [
        orderId,                                  // {{1}} Order Number
        itemsString,                              // {{2}} Order Details
        totalAmount.toLocaleString()              // {{3}} Cart Total
      ];

      await sendWhatsAppTemplate(buyerPhone, "notify_buyer_02", variables, "en_US");
      console.log(`✅ BUYER (${buyerPhone}) notification sent successfully!`);
    } catch (error: any) {
      console.error(`❌ BUYER NOTIFICATION FAILED [${buyerPhone}]:`, error.message || error);
    }
  },

  // ==========================================
  // 3. NEW BUYER INQUIRY (Pre-Cart WhatsApp Click)
  // ==========================================
  async buyerInquiry(sellerPhone: string, productName: string) {
    try {
      await sendWhatsAppTemplate(sellerPhone, "new_buyer_inquiry", [productName], "en_US");
    } catch (error: any) {
      console.error("❌ BUYER INQUIRY FAILED:", error.message || error);
    }
  },

  // ==========================================
  // 4. CONVERSATION TIMEOUTS & UPDATES
  // ==========================================
  async awaitingResponse(targetPhone: string, productName: string) {
    try {
      await sendWhatsAppTemplate(targetPhone, "conversation_awaiting_response", [productName], "en_US");
    } catch (error: any) {
      console.error("❌ AWAITING RESPONSE PING FAILED:", error.message || error);
    }
  },

  async updateNotice(targetPhone: string, productName: string) {
    try {
      await sendWhatsAppTemplate(targetPhone, "conversation_update_notice", [productName], "en_US");
    } catch (error: any) {
      console.error("❌ UPDATE NOTICE FAILED:", error.message || error);
    }
  }
};
