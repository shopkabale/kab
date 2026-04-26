// lib/notifications.ts
import { sendWhatsAppTemplate } from "./whatsapp";

// Helper function to ensure phone numbers are formatted correctly for Meta
const formatMetaPhone = (phone: string) => {
  let cleanPhone = (phone || "").replace(/\D/g, "");
  if (cleanPhone.startsWith("0")) cleanPhone = "256" + cleanPhone.substring(1);
  return cleanPhone;
};

export const NotificationService = {

  // ==========================================
  // 1. MULTI-SELLER: NOTIFY SELLER 
  // Template: orider_confimation_seller_01 (Exact Meta Spelling)
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
    const cleanPhone = formatMetaPhone(sellerPhone);
    if (!cleanPhone) return console.error("❌ notifySeller failed: No seller phone provided.");

    console.log(`[WhatsApp] Routing seller sub-order to ${cleanPhone}...`);
    try {
      const variables = [
        sellerName || "Partner",                  // {{1}} Hello [Name]
        orderId || "N/A",                         // {{2}} Order ID
        itemsString || "1x Item",                 // {{3}} Items for you
        (subtotal || 0).toLocaleString(),         // {{4}} Total Value
        buyerName || "Customer",                  // {{5}} Name
        buyerLocation || "Kabale Town",           // {{6}} Location
        buyerContact || "No contact provided"     // {{7}} Contact
      ];

      await sendWhatsAppTemplate(cleanPhone, "orider_confimation_seller_01", variables, "en_US");
      console.log(`✅ SELLER (${cleanPhone}) notification sent successfully!`);
    } catch (error: any) {
      console.error(`❌ SELLER NOTIFICATION FAILED [${cleanPhone}]:`, error.message || error);
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
    const cleanPhone = formatMetaPhone(buyerPhone);
    if (!cleanPhone) return console.error("❌ notifyBuyer failed: No buyer phone provided.");

    console.log(`[WhatsApp] Sending consolidated receipt to buyer ${cleanPhone}...`);
    try {
      const variables = [
        orderId || "N/A",                         // {{1}} Order Number
        itemsString || "1x Item",                 // {{2}} Order Details
        (totalAmount || 0).toLocaleString()       // {{3}} Cart Total
      ];

      await sendWhatsAppTemplate(cleanPhone, "notify_buyer_02", variables, "en_US");
      console.log(`✅ BUYER (${cleanPhone}) notification sent successfully!`);
    } catch (error: any) {
      console.error(`❌ BUYER NOTIFICATION FAILED [${cleanPhone}]:`, error.message || error);
    }
  },

  // ==========================================
  // 3. NEW BUYER INQUIRY (Pre-Cart WhatsApp Click)
  // ==========================================
  async buyerInquiry(sellerPhone: string, productName: string) {
    const cleanPhone = formatMetaPhone(sellerPhone);
    if (!cleanPhone) return;

    try {
      await sendWhatsAppTemplate(cleanPhone, "new_buyer_inquiry", [productName || "an item"], "en_US");
    } catch (error: any) {
      console.error("❌ BUYER INQUIRY FAILED:", error.message || error);
    }
  },

  // ==========================================
  // 4. CONVERSATION TIMEOUTS & UPDATES
  // ==========================================
  async awaitingResponse(targetPhone: string, productName: string) {
    const cleanPhone = formatMetaPhone(targetPhone);
    if (!cleanPhone) return;

    try {
      await sendWhatsAppTemplate(cleanPhone, "conversation_awaiting_response", [productName || "item"], "en_US");
    } catch (error: any) {
      console.error("❌ AWAITING RESPONSE PING FAILED:", error.message || error);
    }
  },

  async updateNotice(targetPhone: string, productName: string) {
    const cleanPhone = formatMetaPhone(targetPhone);
    if (!cleanPhone) return;

    try {
      await sendWhatsAppTemplate(cleanPhone, "conversation_update_notice", [productName || "item"], "en_US");
    } catch (error: any) {
      console.error("❌ UPDATE NOTICE FAILED:", error.message || error);
    }
  },

  // ==========================================
  // 5. PARTNER PAYOUT NOTIFICATION (Wallet Credit)
  // Template: wallet_credit_alert
  // ==========================================
  async notifyPartnerCredit(partnerPhone: string, amountCredited: number, newBalance: number) {
    const cleanPhone = formatMetaPhone(partnerPhone);
    if (!cleanPhone) return console.error("❌ notifyPartnerCredit failed: No partner phone provided.");

    console.log(`[WhatsApp] Sending wallet credit alert to partner ${cleanPhone}...`);
    try {
      const variables = [
        (amountCredited || 0).toLocaleString(), // {{1}} Amount Credited
        (newBalance || 0).toLocaleString()      // {{2}} New Wallet Balance
      ];

      await sendWhatsAppTemplate(cleanPhone, "wallet_credit_alert", variables, "en_US");
      console.log(`✅ PARTNER (${cleanPhone}) credit alert sent successfully!`);
    } catch (error: any) {
      console.error(`❌ PARTNER NOTIFICATION FAILED [${cleanPhone}]:`, error.message || error);
    }
  }
};
