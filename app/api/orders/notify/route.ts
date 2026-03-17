// app/api/orders/notify/route.ts
import { NextResponse } from "next/server";
import { NotificationService } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventType, payload } = body;

    if (!eventType || !payload) {
      return NextResponse.json({ error: "Missing eventType or payload" }, { status: 400 });
    }

    // Extract ALL possible variables we might need
    const { productName, buyerPhone, sellerPhone, agentPhone, buyerName, orderNumber } = payload;

    switch (eventType) {
      case "ORDER_CREATED":
        if (!sellerPhone || !buyerPhone || !productName || !orderNumber) {
          throw new Error("Missing required fields for ORDER_CREATED");
        }
        // Pass the new variables!
        await NotificationService.orderCreated(
          sellerPhone, 
          buyerPhone, 
          productName, 
          buyerName, 
          orderNumber
        );
        break;

      case "ORDER_ACCEPTED":
        if (!buyerPhone || !productName) throw new Error("Missing required fields for ORDER_ACCEPTED");
        await NotificationService.orderAccepted(buyerPhone, productName);
        break;

      case "ORDER_READY":
        if (!buyerPhone || !productName) throw new Error("Missing required fields for ORDER_READY");
        await NotificationService.orderReady(buyerPhone, agentPhone, productName);
        break;

      case "ORDER_DELIVERED":
        if (!buyerPhone || !sellerPhone || !productName) throw new Error("Missing required fields for ORDER_DELIVERED");
        await NotificationService.orderDelivered(buyerPhone, sellerPhone, productName);
        break;

      case "ORDER_CANCELLED":
        if (!buyerPhone || !sellerPhone || !productName) throw new Error("Missing required fields for ORDER_CANCELLED");
        await NotificationService.orderCancelled(buyerPhone, sellerPhone, productName);
        break;

      case "BUYER_INQUIRY":
        if (!sellerPhone || !productName) throw new Error("Missing required fields for BUYER_INQUIRY");
        await NotificationService.buyerInquiry(sellerPhone, productName);
        break;

      default:
        return NextResponse.json({ error: `Invalid event type: ${eventType}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `Handled ${eventType} successfully` }, { status: 200 });

  } catch (error: any) {
    console.error(`API Route Error (orders/notify):`, error.message || error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
