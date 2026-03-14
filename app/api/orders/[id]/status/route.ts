import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id;
    const body = await request.json();
    const { status, vendorId } = body;

    if (!orderId || !status || !vendorId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const orderRef = adminDb.collection("orders").doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Security check: Make sure the vendor updating the order is the one who owns it
    const orderData = orderDoc.data();
    if (orderData?.sellerId !== vendorId) {
      return NextResponse.json({ error: "Unauthorized to update this order" }, { status: 403 });
    }

    // Update the status
    await orderRef.update({
      status: status,
    });

    return NextResponse.json({ success: true, message: "Order status updated" });

  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
