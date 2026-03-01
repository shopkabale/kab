import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { Order } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, productId, price, quantity } = body;

    if (!userId || !productId || !price) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const counterRef = adminDb.collection("counters").doc("order_ORD");
    const newOrderRef = adminDb.collection("orders").doc();

    const orderNumber = await adminDb.runTransaction(async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      
      let nextSeq = 1;
      if (counterDoc.exists) {
        nextSeq = (counterDoc.data()?.seq || 0) + 1;
      }

      const formattedId = `ORD-${nextSeq.toString().padStart(4, "0")}`;

      transaction.set(counterRef, { seq: nextSeq }, { merge: true });

      const newOrder: Order = {
        id: newOrderRef.id,
        orderNumber: formattedId,
        userId: userId,
        items: [
          {
            productId,
            quantity: quantity || 1,
            price: Number(price),
          }
        ],
        total: Number(price) * (quantity || 1),
        paymentMethod: "cash_on_delivery",
        status: "pending",
        createdAt: Date.now(),
      };

      transaction.set(newOrderRef, newOrder);
      return formattedId;
    });

    return NextResponse.json({ success: true, orderNumber }, { status: 201 });

  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}