// app/api/orders/notify/route.ts
import { NextResponse } from "next/server";
import { NotificationService } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const { eventType, payload } = await request.json();

    if (!eventType || !payload) {
      return NextResponse.json({ error: "Missing eventType or payload" }, { status: 400 });
    }

    const { 
      productName, 
      buyerPhone, 
      sellerPhone, 
      agentPhone, 
      buyerName, 
      orderNumber 
    } = payload;

    switch (eventType) {
      case "ORDER_CREATED":
        await NotificationService.orderCreated(sellerPhone, buyerPhone, productName, buyerName, orderNumber);
        break;
      case "ORDER_ACCEPTED":
        await NotificationService.orderAccepted(buyerPhone, productName);
        break;
      case "ORDER_READY":
        await NotificationService.orderReady(buyerPhone, agentPhone, productName);
        break;
      case "ORDER_DELIVERED":
        await NotificationService.orderDelivered(buyerPhone, sellerPhone, productName);
        break;
      case "ORDER_CANCELLED":
        await NotificationService.orderCancelled(buyerPhone, sellerPhone, productName);
        break;
      case "BUYER_INQUIRY":
        await NotificationService.buyerInquiry(sellerPhone, productName);
        break;
      default:
        return NextResponse.json({ error: `Invalid event type: ${eventType}` }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error(`[Notify Route Error]:`, error.message || error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
