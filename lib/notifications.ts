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
  // This is the one we are testing now!
  async orderCreated(sellerPhone: string, buyerPhone: string, productName: string) {
    await sendMultiple([
      sendWhatsAppTemplate(sellerPhone, "order_created_seller", [productName]),
      sendWhatsAppTemplate(buyerPhone, "order_created_buyer", [productName])
    ]);
  },

  // Added back as placeholders so the build passes
  async orderAccepted(buyerPhone: string, productName: string) {
    console.log("Order Accepted notification triggered (Template not yet created in Meta)");
  },

  async orderReady(buyerPhone: string, agentPhone: string | null, productName: string) {
    console.log("Order Ready notification triggered (Template not yet created in Meta)");
  },

  async orderDelivered(buyerPhone: string, sellerPhone: string, productName: string) {
    console.log("Order Delivered notification triggered (Template not yet created in Meta)");
  },

  async orderCancelled(buyerPhone: string, sellerPhone: string, productName: string) {
    console.log("Order Cancelled notification triggered (Template not yet created in Meta)");
  },

  async buyerInquiry(sellerPhone: string, productName: string) {
    await sendWhatsAppTemplate(sellerPhone, "buyer_inquiry", [productName]);
  }
};
