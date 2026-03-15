import { sendWhatsAppMessage } from "./whatsapp";

const sendMultiple = async (messages: Promise<any>[]) => {
  const results = await Promise.allSettled(messages);
  results.forEach((result) => {
    if (result.status === "rejected") {
      console.error("Notification delivery failed:", result.reason);
    }
  });
};

export const NotificationService = {
  async orderCreated(sellerPhone: string, buyerPhone: string, productName: string) {
    await sendMultiple([
      sendWhatsAppMessage(sellerPhone, `You have received a new order for ${productName} on Kabale Online.`),
      sendWhatsAppMessage(buyerPhone, `Your order for ${productName} has been received. The seller will process it shortly.`)
    ]);
  },

  async orderAccepted(buyerPhone: string, productName: string) {
    await sendWhatsAppMessage(buyerPhone, `Good news! The seller has accepted your order for ${productName}.`);
  },

  async orderReady(buyerPhone: string, agentPhone: string | null, productName: string) {
    const tasks = [
      sendWhatsAppMessage(buyerPhone, `Your order for ${productName} is packed and ready for delivery.`)
    ];
    if (agentPhone) {
      tasks.push(sendWhatsAppMessage(agentPhone, `New pickup available: ${productName} is ready to be delivered to the buyer.`));
    }
    await sendMultiple(tasks);
  },

  async orderDelivered(buyerPhone: string, sellerPhone: string, productName: string) {
    await sendMultiple([
      sendWhatsAppMessage(buyerPhone, `Your order for ${productName} has been successfully delivered. Thank you for shopping on Kabale Online!`),
      sendWhatsAppMessage(sellerPhone, `Delivery complete: Your sale of ${productName} has been successfully delivered.`)
    ]);
  },

  async orderCancelled(buyerPhone: string, sellerPhone: string, productName: string) {
    const msg = `Order Cancelled: The order for ${productName} has been cancelled.`;
    await sendMultiple([
      sendWhatsAppMessage(buyerPhone, msg),
      sendWhatsAppMessage(sellerPhone, msg)
    ]);
  },

  async buyerInquiry(sellerPhone: string, productName: string) {
    await sendWhatsAppMessage(sellerPhone, `You have a new inquiry about your product ${productName} on Kabale Online.`);
  }
};
