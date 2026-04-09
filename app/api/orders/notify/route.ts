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
      orderNumber,
      totalAmount = 0 // Added safe fallback
    } = payload;

    switch (eventType) {
      case "ORDER_CREATED":
        // 🚀 Bridged to the new Unified Order Methods
        await NotificationService.notifyBuyer(buyerPhone, orderNumber, productName, totalAmount);
        if (sellerPhone) {
          await NotificationService.notifySeller(
            sellerPhone, 
            "Partner", 
            orderNumber, 
            productName, 
            totalAmount, 
            buyerName, 
            "Kabale", 
            buyerPhone
          );
        }
        break;
      
      case "BUYER_INQUIRY":
        await NotificationService.buyerInquiry(sellerPhone, productName);
        break;

      // ⚠️ Commented out legacy placeholders that were removed in the Production-Grade upgrade.
      // If you need these later for driver/delivery tracking, we can easily add them back to lib/notifications.ts!
      /*
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
      */
      
      default:
        return NextResponse.json({ error: `Invalid event type: ${eventType}` }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error(`[Notify Route Error]:`, error.message || error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
