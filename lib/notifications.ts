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
  
  // Using the templates we just created
  async orderCreated(sellerPhone: string, buyerPhone: string, productName: string) {
    await sendMultiple([
      // Sends: "You have received a new order for {{1}} on Kabale Online."
      sendWhatsAppTemplate(sellerPhone, "order_created_seller", [productName]),
      
      // Sends: "Your order for {{1}} has been received. The seller will process it shortly."
      sendWhatsAppTemplate(buyerPhone, "order_created_buyer", [productName])
    ]);
  },

  // You will need to create matching templates in Meta for the rest of these:
  async orderAccepted(buyerPhone: string, productName: string) {
    await sendWhatsAppTemplate(buyerPhone, "order_accepted", [productName]);
  },

  async orderReady(buyerPhone: string, agentPhone: string | null, productName: string) {
    const tasks = [
      sendWhatsAppTemplate(buyerPhone, "order_ready_buyer", [productName])
    ];
    if (agentPhone) {
      tasks.push(sendWhatsAppTemplate(agentPhone, "order_ready_agent", [productName]));
    }
    await sendMultiple(tasks);
  },

  async orderDelivered(buyerPhone: string, sellerPhone: string, productName: string) {
    await sendMultiple([
      sendWhatsAppTemplate(buyerPhone, "order_delivered_buyer", [productName]),
      sendWhatsAppTemplate(sellerPhone, "order_delivered_seller", [productName])
    ]);
  },

  async orderCancelled(buyerPhone: string, sellerPhone: string, productName: string) {
    await sendMultiple([
      sendWhatsAppTemplate(buyerPhone, "order_cancelled", [productName]),
      sendWhatsAppTemplate(sellerPhone, "order_cancelled", [productName])
    ]);
  },

  async buyerInquiry(sellerPhone: string, productName: string) {
    await sendWhatsAppTemplate(sellerPhone, "buyer_inquiry", [productName]);
  }
};
