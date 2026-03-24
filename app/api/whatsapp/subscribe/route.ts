import { NextResponse } from "next/server";

export async function GET() {
  // This uses your powerful System User token that already works for sending templates
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  
  // ✅ The exact WhatsApp Business Account ID from your screenshot
  const wabaId = "1214897660474927"; 

  if (!token) {
    return NextResponse.json({ error: "Missing WHATSAPP_ACCESS_TOKEN" }, { status: 400 });
  }

  // ✅ Targeting the WABA, not the Phone Number
  const url = `https://graph.facebook.com/v19.0/${wabaId}/subscribed_apps`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();  

    if (!response.ok) {  
      return NextResponse.json({ error: "Meta rejected the subscription", details: data }, { status: response.status });  
    }  

    return NextResponse.json({   
      success: true,  
      message: "🎉 SHADOW DELIVERY FIXED! Your WABA is now linked to your Webhook.",   
      meta_response: data   
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: "Internal Fetch Error", details: error.message }, { status: 500 });
  }
}
