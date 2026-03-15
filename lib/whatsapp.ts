// 1. Standard Text Message (Only works if user messaged you in last 24 hours)
export async function sendWhatsAppMessage(phoneNumber: string, messageText: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.error("Missing WhatsApp Cloud API credentials.");
    throw new Error("Server configuration error");
  }

  const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');

  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to: cleanPhoneNumber,
    type: "text",
    text: {
      body: messageText,
    },
  };

  return await executeRequest(url, token, payload);
}

// 2. Template Message (Required for initiating conversations/alerts)
export async function sendWhatsAppTemplate(
  phoneNumber: string, 
  templateName: string, 
  variables: string[]
) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.error("Missing WhatsApp Cloud API credentials.");
    throw new Error("Server configuration error");
  }

  const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');

  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to: cleanPhoneNumber,
    type: "template",
    template: {
      name: templateName,
      language: { code: "en_US" }, // Make sure this matches the language you selected in Meta
      components: variables.length > 0 ? [
        {
          type: "body",
          parameters: variables.map(text => ({ type: "text", text }))
        }
      ] : []
    }
  };

  return await executeRequest(url, token, payload);
}

// 3. Shared helper to execute the HTTP request cleanly
async function executeRequest(url: string, token: string, payload: any) {
  try {
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
