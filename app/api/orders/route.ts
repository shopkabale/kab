import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { Order } from "@/types";
import { sendOrderConfirmation } from "@/lib/brevo";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, productId, price, quantity } = body;

    if (!userId || !productId || !price) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Fetch user to get their email securely for Brevo
    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const userData = userDoc.data();

    // 2. Generate Order in a secure transaction
    const counterRef = adminDb.collection("counters").doc("order_ORD");
    const newOrderRef = adminDb.collection("orders").doc();
    const orderTotal = Number(price) * (quantity || 1);

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
        total: orderTotal,
        paymentMethod: "cash_on_delivery",
        status: "pending",
        createdAt: Date.now(),
      };

      transaction.set(newOrderRef, newOrder);
      return formattedId;
    });

    // 3. Fire off the Brevo Email silently in the background
    // We don't await this blocking the response, so the user sees success instantly
    if (userData?.email) {
      sendOrderConfirmation(
        userData.email,
        userData.displayName || "Customer",
        orderNumber,
        orderTotal
      ).catch(err => console.error("Background email failed:", err));
    }

    return NextResponse.json({ success: true, orderNumber }, { status: 201 });

  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}