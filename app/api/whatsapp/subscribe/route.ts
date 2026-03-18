import { NextResponse } from "next/server";

export async function GET() {
  // We will use your permanent access token from your env variables
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  
  // I am hardcoding the exact Phone Number ID from your screenshot to guarantee it targets the right number.
  // (You can also use process.env.WHATSAPP_PHONE_NUMBER_ID if you prefer)
  const phoneNumberId = "1011572122043786"; 

  if (!token) {
    return NextResponse.json({ error: "Missing WHATSAPP_ACCESS_TOKEN in Vercel" }, { status: 400 });
  }

  // The official Meta endpoint to force a phone number to route to your webhook
  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/subscribed_apps`;

  try {
    const response = await fetch(url, {
      method: "POST", // We are POSTing to Meta to create the subscription
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("🚨 Meta API Error:", data);
      return NextResponse.json({ error: "Failed to subscribe to Meta", details: data }, { status: response.status });
    }

    return NextResponse.json({ 
      success: true,
      message: "🎉 SUCCESS! Your Kabale Online phone number is now permanently routed to your Vercel Webhook.", 
      meta_response: data 
    }, { status: 200 });

  } catch (error: any) {
    console.error("🚨 Internal Fetch Error:", error.message);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
