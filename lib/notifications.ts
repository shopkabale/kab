// lib/notifications.ts
import { sendWhatsAppTemplate } from "./whatsapp";

export const NotificationService = {
  async orderCreated(
    sellerPhone: string, 
    buyerPhone: string, 
    productName: string, 
    buyerName: string, 
    orderNumber: string
  ) {
    console.log(`[WhatsApp Trigger] New Order: ${orderNumber}`);

    // ==========================================
    // 1. SEND TO SELLER (new_order_notification)
    // ==========================================
    try {
      console.log(`-> Attempting to notify SELLER at ${sellerPhone}...`);
      
      // Sending 1 variable [productName] mapped to {{1}} in your Meta template
      await sendWhatsAppTemplate(sellerPhone, "new_order_notification", [productName], "en_US");
      
      console.log("✅ SELLER notification sent successfully!");
    } catch (error: any) {
      console.error("❌ SELLER NOTIFICATION FAILED!");
      console.error("Meta API Error:", error.message || error);
    }

    // ==========================================
    // 2. SEND TO BUYER (order_confirmation_buyer)
    // ==========================================
    try {
      console.log(`-> Attempting to notify BUYER at ${buyerPhone}...`);
      
      // Sending 2 variables [buyerName, orderNumber] mapped to {{1}} and {{2}}
      await sendWhatsAppTemplate(buyerPhone, "order_confirmation_buyer", [buyerName || "Customer", orderNumber], "en_US");
      
      console.log("✅ BUYER notification sent successfully!");
    } catch (error: any) {
      console.error("❌ BUYER NOTIFICATION FAILED!");
      console.error("Meta API Error:", error.message || error);
    }
  },

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
  },

  async buyerInquiry(sellerPhone: string, productName: string) {
    try {
      await sendWhatsAppTemplate(sellerPhone, "buyer_inquiry", [productName], "en_US");
      console.log("✅ BUYER INQUIRY sent successfully!");
    } catch (error: any) {
      console.error("❌ BUYER INQUIRY FAILED!");
      console.error("Meta API Error:", error.message || error);
    }
  }
};
