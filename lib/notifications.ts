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
  // Only handle the "Order Created" logic for now
  async orderCreated(sellerPhone: string, buyerPhone: string, productName: string) {
    await sendMultiple([
      // Use the EXACT names you created in the Meta Dashboard
      sendWhatsAppTemplate(sellerPhone, "order_created_seller", [productName]),
      sendWhatsAppTemplate(buyerPhone, "order_created_buyer", [productName])
    ]);
  },

  // Simplified inquiry
  async buyerInquiry(sellerPhone: string, productName: string) {
    await sendWhatsAppTemplate(sellerPhone, "buyer_inquiry", [productName]);
  }
};
