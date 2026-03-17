// lib/notifications.ts
import { sendWhatsAppTemplate } from "./whatsapp";

const sendMultiple = async (messages: Promise<any>[]) => {
  const results = await Promise.allSettled(messages);
  results.forEach((result) => {
    if (result.status === "rejected") {
      console.error("Notification delivery failed:", result.reason);
    }
  });
};

export const NotificationService = {
  // UPDATED: Added buyerName and orderNumber to match your Meta template
  async orderCreated(
    sellerPhone: string, 
    buyerPhone: string, 
    productName: string, 
    buyerName: string, 
    orderNumber: string
  ) {
    await sendMultiple([
      // Seller Template: Unverified, using 1 variable [productName]
      sendWhatsAppTemplate(sellerPhone, "order_created_seller", [productName], "en_US"),
      
      // Buyer Template: VERIFIED, using 2 variables: [{{1}} Name, {{2}} OrderNumber]
      sendWhatsAppTemplate(buyerPhone, "order_received_buyer", [buyerName || "Customer", orderNumber], "en_US")
    ]);
  },

  // Placeholders remain unchanged
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
    await sendWhatsAppTemplate(sellerPhone, "buyer_inquiry", [productName], "en_US");
  }
};
