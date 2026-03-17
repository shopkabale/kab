import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { toPhone, text, originalMessageId } = body;

    // 1. Validate the incoming data
    if (!toPhone || !text) {
      return NextResponse.json({ error: "Missing phone number or text" }, { status: 400 });
    }

    // ⚠️ IMPORTANT: This must be your permanent Meta System User Access Token, 
    // NOT the verify token you made up for the webhook.
    const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN; 
    const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID; 

    if (!WHATSAPP_ACCESS_TOKEN || !PHONE_NUMBER_ID) {
      console.error("Missing Meta Environment Variables.");
      return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    // 2. Send the message via Meta Graph API
    const metaRes = await fetch(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: toPhone,
        type: "text",
        text: { 
          preview_url: false, 
          body: text 
        },
      }),
    });

    const metaData = await metaRes.json();

    if (!metaRes.ok) {
      console.error("❌ Meta API Error:", metaData);
      return NextResponse.json(
        { error: metaData.error?.message || "Failed to send via Meta" }, 
        { status: 500 }
      );
    }

    console.log(`✅ Message sent to ${toPhone} successfully! Meta ID:`, metaData.messages?.[0]?.id);

    // 3. Save your outbound reply to Firebase
    // This gives you a history of what the seller replied to the customer.
    try {
      await addDoc(collection(db, "whatsapp_messages"), {
        senderPhone: "Kabale Online (Seller/Admin)",
        recipientPhone: toPhone,
        content: text,
        status: "sent",
        direction: "outbound", 
        originalMessageRef: originalMessageId || null, // Ties this reply to the buyer's message
        timestamp: serverTimestamp(),
      });
    } catch (dbError) {
      console.error("⚠️ Failed to save outbound message to Firebase, but WhatsApp was still sent.", dbError);
    }

    // 4. Return success to the frontend
    return NextResponse.json({ 
      success: true, 
      messageId: metaData.messages?.[0]?.id 
    }, { status: 200 });

  } catch (error) {
    console.error("🚨 Send API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
