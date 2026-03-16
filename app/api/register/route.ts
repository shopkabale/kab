import { NextResponse } from "next/server";

export async function GET() {
  // We grab your Vercel/Local variables
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID; // This should be 1011572122043786
  
  // REPLACE THIS WITH THE 6-DIGIT PIN YOU JUST CREATED
  const pin = "123456"; 

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/register`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        pin: pin
      })
    });

    const data = await res.json();
    return NextResponse.json({ success: true, metaResponse: data });
  } catch (error) {
    return NextResponse.json({ success: false, error });
  }
}
