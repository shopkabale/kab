import { logChat } from "./bot/chatLogger";

// ==========================================
// HELPER: Phone Number Normalizer
// ==========================================
function normalizePhone(phoneNumber: string): string {
  let cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
  if (cleanPhoneNumber.startsWith('0')) {
    cleanPhoneNumber = `256${cleanPhoneNumber.slice(1)}`;
  }
  return cleanPhoneNumber;
}

// ==========================================
// 1. Standard Text Message
// ==========================================
export async function sendWhatsAppMessage(phoneNumber: string, messageText: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) throw new Error("Missing WhatsApp Cloud API credentials.");

  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    to: normalizePhone(phoneNumber),
    type: "text",
    text: { body: messageText },
  };

  return await executeRequest(url, token, payload);
}

// ==========================================
// 2. Template Message 
// ==========================================
export async function sendWhatsAppTemplate(
  phoneNumber: string, 
  templateName: string, 
  variables: string[],
  languageCode: string = "en_US" 
) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) throw new Error("Missing WhatsApp Cloud API credentials.");

  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    to: normalizePhone(phoneNumber),
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode }, 
      components: variables.length > 0 ? [
        {
          type: "body",
          parameters: variables.map(text => ({ type: "text", text: String(text) })) 
        }
      ] : []
    }
  };

  return await executeRequest(url, token, payload);
}

// ==========================================
// 3. Interactive Button Message
// ==========================================
export async function sendWhatsAppInteractiveButtons(
  phoneNumber: string,
  bodyText: string,
  buttons: { id: string, title: string }[],
  imageUrl?: string 
) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) throw new Error("Missing WhatsApp Cloud API credentials.");

  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
  const payload: any = {
    messaging_product: "whatsapp",
    to: normalizePhone(phoneNumber),
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: bodyText },
      action: {
        buttons: buttons.slice(0, 3).map(btn => ({
          type: "reply",
          reply: { id: btn.id, title: btn.title }
        }))
      }
    }
  };

  if (imageUrl) {
    // 🔥 HYBRID LOGIC: Safely formats Cloudinary URLs for Meta's strict CDN
    let finalImageUrl = imageUrl;
    
    if (imageUrl.includes("f_auto")) {
      finalImageUrl = imageUrl
        .replace("f_auto", "f_jpg")
        .replace("q_auto", "q_auto:good") 
        .split('?')[0]; 
        
      if (finalImageUrl.endsWith(".webp") || finalImageUrl.endsWith(".avif")) {
        finalImageUrl = finalImageUrl.replace(/\.(webp|avif)$/, ".jpg");
      }
    }

    payload.interactive.header = {
      type: "image",
      image: { link: finalImageUrl }
    };
  }

  return await executeRequest(url, token, payload);
}

// ==========================================
// 4. Interactive List Menu Message
// ==========================================
export async function sendWhatsAppListMenu(
  phoneNumber: string,
  bodyText: string,
  buttonText: string,
  sections: { title: string; rows: { id: string; title: string; description?: string }[] }[]
) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) throw new Error("Missing WhatsApp Cloud API credentials.");

  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    to: normalizePhone(phoneNumber),
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: bodyText },
      action: {
        button: buttonText,
        sections: sections
      }
    }
  };

  return await executeRequest(url, token, payload);
}

// ==========================================
// 🛒 5. NEW: The AI Product Card Builder
// ==========================================
export async function sendWhatsAppProductCard(
  phoneNumber: string,
  product: { id: string; title: string; price: number; image?: string; description?: string }
) {
  // Uses psychology: Bolds the price and uses the orange/black vibe (via emojis)
  const bodyText = `🔥 *${product.title}*\n\n💰 *UGX ${product.price.toLocaleString()}*\n\n${product.description ? product.description.substring(0, 100) + '...' : 'Available now on Kabale Online.'}`;
  
  // Creates standardized button IDs that your webhook can easily intercept
  const buttons = [
    { id: `CART_ADD_${product.id}`, title: "🛒 Add to Cart" },
    { id: `SELLER_CHAT_${product.id}`, title: "💬 Talk to Seller" }
  ];

  return await sendWhatsAppInteractiveButtons(phoneNumber, bodyText, buttons, product.image);
}

// ==========================================
// 6. Shared Executor (With Auto-Logging)
// ==========================================
async function executeRequest(url: string, token: string, payload: any) {
  try {
    const phoneTo = payload.to;
    const msgType = payload.type;
    let contentSnippet = "Media/Interactive";

    if (msgType === "text") {
      contentSnippet = payload.text?.body || "Text Message";
    } else if (msgType === "template") {
      contentSnippet = `[Template: ${payload.template?.name}]`;
    } else if (msgType === "interactive") {
      contentSnippet = `[Menu/Button: ${payload.interactive?.body?.text?.substring(0, 30)}...]`;
    }

    // Fire the logger in the background safely
    logChat(phoneTo, "outgoing", msgType, contentSnippet).catch(console.error);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`WhatsApp API Error: ${response.status}`, JSON.stringify(data, null, 2));
      throw new Error(data.error?.message || "Failed to send WhatsApp message");
    }

    return data;
  } catch (error) {
    console.error("Failed to execute WhatsApp API request:", error);
    throw error;
  }
}
