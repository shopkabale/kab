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
  async orderCreated(
    sellerPhone: string, 
    buyerPhone: string, 
    productName: string, 
    buyerName: string, 
    orderNumber: string
  ) {
    await sendMultiple([
      // Seller Template: Verified, uses 1 variable in the body for the product name
      sendWhatsAppTemplate(sellerPhone, "new_order_notification", [productName], "en_US"),

      // Buyer Template: Verified, uses 2 variables in the body for buyer name and order number
      sendWhatsAppTemplate(buyerPhone, "order_confirmation_buyer", [buyerName || "Customer", orderNumber], "en_US")
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
