import { NextResponse } from "next/server";
import { NotificationService } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventType, payload } = body;

    if (!eventType || !payload) {
      return NextResponse.json({ error: "Missing eventType or payload" }, { status: 400 });
    }

    const { productName, buyerPhone, sellerPhone, agentPhone } = payload;

    switch (eventType) {
      case "ORDER_CREATED":
        await NotificationService.orderCreated(sellerPhone, buyerPhone, productName);
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
        return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `Handled ${eventType} successfully` }, { status: 200 });

  } catch (error) {
    console.error(`API Route Error (orders/notify):`, error);
    return NextResponse.json(
      { error: "Internal server error processing notification" }, 
      { status: 500 }
    );
  }
}
