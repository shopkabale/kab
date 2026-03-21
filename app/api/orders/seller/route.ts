// app/api/orders/seller/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { sendStatusUpdateEmail } from "@/lib/brevo";

// GET: Fetch all orders belonging to a specific seller
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get("sellerId");

    if (!sellerId) {
      return NextResponse.json({ error: "Missing seller ID" }, { status: 400 });
    }

    const ordersSnap = await adminDb.collection("orders")
      .where("sellerId", "==", sellerId)
      .orderBy("createdAt", "desc")
      .get();

    const orders = ordersSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch seller orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

// PATCH: Allow sellers to update their own order status (except cancellations)
export async function PATCH(request: Request) {
  try {
    const { sellerId, orderId, newStatus } = await request.json();

    if (!sellerId || !orderId || !newStatus) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Security Check 1: Prevent sellers from cancelling (must go through Admin)
    if (newStatus === "cancelled") {
      return NextResponse.json({ error: "Sellers cannot cancel orders directly. Contact Admin." }, { status: 403 });
    }

    const orderRef = adminDb.collection("orders").doc(orderId);
    
    // Perform this inside a transaction to ensure status and stock are synced perfectly
    await adminDb.runTransaction(async (transaction) => {
      const orderSnap = await transaction.get(orderRef);

      if (!orderSnap.exists) {
        throw new Error("Order not found");
      }

      const orderData = orderSnap.data()!;

      // Security Check 2: Ensure this seller actually owns this order
      if (orderData.sellerId !== sellerId) {
        throw new Error("Unauthorized to edit this order");
      }

      // If updating to delivered, update the product status too
      if (newStatus === "delivered" && orderData.items && orderData.items.length > 0) {
        const productId = orderData.items[0].productId;
        const productRef = adminDb.collection("products").doc(productId);
        const productSnap = await transaction.get(productRef);
        
        if (productSnap.exists) {
          const productData = productSnap.data()!;
          if (productData.stock <= 0) {
            transaction.update(productRef, { status: "sold_out", updatedAt: Date.now() });
          }
        }
      }

      // Update Order Status
      transaction.update(orderRef, {
        status: newStatus,
        updatedAt: Date.now()
      });

      // Fire off an email to the buyer (Outside transaction, no await needed)
      if (orderData.buyerEmail) {
        sendStatusUpdateEmail(
          orderData.buyerEmail, 
          orderData.buyerName || "Valued Customer", 
          orderData.orderNumber, 
          newStatus
        ).catch(err => console.error("Seller triggered email fail:", err));
      }
    });

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error("Seller status update error:", error);
    return NextResponse.json({ error: error.message || "Failed to update status" }, { status: 500 });
  }
}
