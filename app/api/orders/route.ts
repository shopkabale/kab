import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, productId, sellerId, total, deliveryLocation, contactPhone, items } = body;

    if (!userId || !productId) {
      return NextResponse.json({ error: "Missing user or product ID" }, { status: 400 });
    }

    // Generate a beautiful Kabale Order Number
    const orderNumber = `KAB-${Math.floor(1000 + Math.random() * 9000)}`;

    const orderData = {
      orderNumber,
      userId,
      sellerId: sellerId || "SYSTEM",
      items: items || [{ productId, quantity: 1, price: total }],
      total: Number(total),
      paymentMethod: "cash_on_delivery",
      status: "pending",
      deliveryLocation: deliveryLocation || "Kabale Town",
      contactPhone: contactPhone || "",
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const docRef = await adminDb.collection("orders").add(orderData);

    return NextResponse.json({ success: true, orderId: docRef.id }, { status: 200 });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
  }
}