import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import * as admin from "firebase-admin";

// 1. Handle Webhook Verification (GET)
// Meta requires this to confirm your endpoint is active
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode && token) {
    if (mode === "subscribe" && token === verifyToken) {
      console.log("✅ Webhook verified successfully!");
      return new NextResponse(challenge, { status: 200 });
    }
    return new NextResponse("Forbidden", { status: 403 });
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

          // Check if this is an actual message
          if (value.messages && value.messages.length > 0) {
            for (const message of value.messages) {
              const fromPhone = message.from; 
              const text = message.text?.body || "[Media/Voice Note]"; 
              const messageId = message.id;

              console.log(`💬 Incoming message from ${fromPhone}: "${text}"`);

              // 🔥 STEP 1: JUST SAVE TO FIREBASE FOR RECORD KEEPING
              try {
                await adminDb.collection("whatsapp_messages").add({
                  metaMessageId: messageId,
                  senderPhone: fromPhone,
                  content: text,
                  status: "unread",
                  timestamp: admin.firestore.FieldValue.serverTimestamp(),
                });
                console.log(`✅ Saved incoming message from ${fromPhone} to database.`);
              } catch (dbError: any) {
                console.error("❌ FIREBASE SAVE FAILED:", dbError.message);
              }
            }
          } else if (value.statuses) {
            console.log(`ℹ️ Status update received: ${value.statuses[0].status}`);
          }
        }
      }

      // Always return a 200 OK so Meta knows we received the payload
      return NextResponse.json({ success: true }, { status: 200 });

    } else {
      return new NextResponse("Not Found", { status: 404 });
    }

  } catch (error: any) {
    console.error("🚨 FATAL WEBHOOK CRASH:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
