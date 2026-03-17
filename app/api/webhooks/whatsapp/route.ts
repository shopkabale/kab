import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { sendWhatsAppReplyAlert } from "@/lib/brevo";

// 1. Handle Webhook Verification (GET)
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode && token) {
    if (mode === "subscribe" && token === verifyToken) {
      console.log("✅ WhatsApp Webhook verified successfully!");
      return new NextResponse(challenge, { status: 200 });
    } else {
      console.error("❌ Webhook verification failed: Token mismatch.");
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  return new NextResponse("Bad Request", { status: 400 });
}

// 2. Handle Incoming WhatsApp Events (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.object === "whatsapp_business_account") {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          const value = change.value;

          // A. Handle Incoming Messages from the Buyer
          if (value.messages) {
            for (const message of value.messages) {
              const fromPhone = message.from; 
              const text = message.text?.body || "[Sent a Media File/Voice Note]"; 
              const messageId = message.id;

              console.log(`📥 Incoming WhatsApp from ${fromPhone}: "${text}"`);

              try {
                // Step 1: Save the message to Firebase
                const docRef = await addDoc(collection(db, "whatsapp_messages"), {
                  metaMessageId: messageId,
                  senderPhone: fromPhone,
                  content: text,
                  status: "unread",
                  timestamp: serverTimestamp(),
                });

                console.log(`💾 Saved to Firebase. Document ID: ${docRef.id}`);

                // Step 2: Send the Magic Link Email via Brevo
                // We send this to the admin email for now. 
                const adminEmail = "shopkabale@gmail.com"; 
                
                await sendWhatsAppReplyAlert(
                  adminEmail,
                  fromPhone,
                  text,
                  docRef.id
                );

                console.log("✉️ Magic Link email sent to admin!");

              } catch (dbError) {
                console.error("🔥 Error saving to DB or sending email:", dbError);
              }
            }
          }
        }
      }

      // Always return 200 OK so Meta doesn't keep retrying the webhook
      return NextResponse.json({ success: true }, { status: 200 });

    } else {
      return new NextResponse("Not Found", { status: 404 });
    }

  } catch (error) {
    console.error("🚨 Webhook POST Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
