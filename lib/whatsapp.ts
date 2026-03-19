// 1. Standard Text Message
export async function sendWhatsAppMessage(phoneNumber: string, messageText: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) throw new Error("Missing WhatsApp Cloud API credentials.");

  const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
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

  // Format Ugandan numbers correctly for Meta
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

// 3. Shared helper
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
