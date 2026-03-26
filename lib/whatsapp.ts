import { logChat } from "./bot/chatLogger";

// 1. Standard Text Message
export async function sendWhatsAppMessage(phoneNumber: string, messageText: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) throw new Error("Missing WhatsApp Cloud API credentials.");

  let cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
  if (cleanPhoneNumber.startsWith('0')) {
    cleanPhoneNumber = `256${cleanPhoneNumber.slice(1)}`;
  }

  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to: cleanPhoneNumber,
    type: "text",
    text: { body: messageText },
  };

  return await executeRequest(url, token, payload);
}

// 2. Template Message 
export async function sendWhatsAppTemplate(
  phoneNumber: string, 
  templateName: string, 
  variables: string[],
  languageCode: string = "en_US" 
) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) throw new Error("Missing WhatsApp Cloud API credentials.");

  let cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
  if (cleanPhoneNumber.startsWith('0')) {
    cleanPhoneNumber = `256${cleanPhoneNumber.slice(1)}`;
  }

  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to: cleanPhoneNumber,
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

// 3. Interactive Button Message (HYBRID IMAGE LOGIC)
export async function sendWhatsAppInteractiveButtons(
  phoneNumber: string,
  bodyText: string,
  buttons: { id: string, title: string }[],
  imageUrl?: string 
) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) throw new Error("Missing WhatsApp Cloud API credentials.");

  let cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
  if (cleanPhoneNumber.startsWith('0')) {
    cleanPhoneNumber = `256${cleanPhoneNumber.slice(1)}`;
  }

  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

  const payload: any = {
    messaging_product: "whatsapp",
    to: cleanPhoneNumber,
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
    // 🔥 HYBRID LOGIC: 
    // Only transform the URL if it contains Cloudinary's auto-format tag.
    // If it is one of your manual uploads, we let it pass through exactly as is.
    let finalImageUrl = imageUrl;
    
    if (imageUrl.includes("f_auto")) {
      finalImageUrl = imageUrl
        .replace("f_auto", "f_jpg")
        .replace("q_auto", "q_auto:good") // Ensure quality stays high but safe for WhatsApp
        .split('?')[0]; // Strip any extra query params that might confuse Meta's CDN parser
        
      // Ensure the extension matches the forced JPG format
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

// 4. Interactive List Menu Message
export async function sendWhatsAppListMenu(
  phoneNumber: string,
  bodyText: string,
  buttonText: string,
  sections: { title: string; rows: { id: string; title: string; description?: string }[] }[]
) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) throw new Error("Missing WhatsApp Cloud API credentials.");

  let cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
  if (cleanPhoneNumber.startsWith('0')) cleanPhoneNumber = `256${cleanPhoneNumber.slice(1)}`;

  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to: cleanPhoneNumber,
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

// 5. Shared helper (With Auto-Logging)
async function executeRequest(url: string, token: string, payload: any) {
  try {
    // 🔥 AUTO-LOG OUTGOING MESSAGES
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

    // Fire the logger in the background
    logChat(phoneTo, "outgoing", msgType, contentSnippet).catch(console.error);

    // Send the actual request to Meta
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
