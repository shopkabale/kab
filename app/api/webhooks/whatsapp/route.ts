import { NextResponse } from "next/server";

// 1. Handle Webhook Verification (GET)
export async function GET(request: Request) {
  const url = new URL(request.url);
  
  // Extract the query parameters Meta sends during verification
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === "subscribe" && token === verifyToken) {
      console.log("WhatsApp Webhook verified successfully!");
      // Meta requires us to return the challenge string as plain text with a 200 status
      return new NextResponse(challenge, { status: 200 });
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      console.error("Webhook verification failed: Token mismatch.");
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  return new NextResponse("Bad Request", { status: 400 });
}

// 2. Handle Incoming WhatsApp Events (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Verify this is an event from a WhatsApp Business Account
    if (body.object === "whatsapp_business_account") {
      
      // Iterate over each entry (there may be multiple if batched)
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          const value = change.value;

          // A. Handle Delivery Status Updates (sent, delivered, read, failed)
          if (value.statuses) {
            for (const status of value.statuses) {
              console.log(`Message ID: ${status.id} | Status: ${status.status}`);
              
              // TODO (Future): Update your database here. 
              // Example: updateMessageStatus(status.id, status.status)
            }
          }

          // B. Handle Incoming Messages (A buyer or seller replies to your notification)
          if (value.messages) {
            for (const message of value.messages) {
              const fromPhone = message.from; // Phone number of the sender
              const text = message.text?.body; // The actual text they sent
              
              console.log(`Received incoming message from ${fromPhone}: "${text}"`);
              
              // TODO (Future): Route this to a customer support dashboard, 
              // or trigger an auto-reply using your NotificationService.
            }
          }
        }
      }

      // Return a 200 OK to Meta to acknowledge receipt. 
      // If you don't return 200, Meta will keep retrying and eventually disable your webhook.
      return NextResponse.json({ success: true }, { status: 200 });
      
    } else {
      // Return a '404 Not Found' if event is not from a WhatsApp API
      return new NextResponse("Not Found", { status: 404 });
    }
    
  } catch (error) {
    console.error("Webhook POST Error:", error);
    // Even if our processing fails, it's often best to return 200 so Meta stops retrying the bad payload, 
    // but returning 500 is fine for severe server crashes.
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
