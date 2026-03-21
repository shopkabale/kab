// app/api/admin/orders/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { sendStatusUpdateEmail } from "@/lib/brevo";

export async function PATCH(request: Request) {
  try {
    const { adminId, orderId, newStatus } = await request.json();

    if (!adminId || !orderId || !newStatus) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Verify the user is actually an admin
    const adminSnap = await adminDb.collection("users").doc(adminId).get();
    if (!adminSnap.exists || adminSnap.data()?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    let buyerEmail = null;
    let buyerName = "Valued Customer";
    let orderNumber = "";

    // 2. Perform the stock, lock, and status updates atomically
    await adminDb.runTransaction(async (transaction) => {
      const orderRef = adminDb.collection("orders").doc(orderId);
      const orderSnap = await transaction.get(orderRef);
      
      if (!orderSnap.exists) {
        throw new Error("Order not found");
      }
      
      const orderData = orderSnap.data()!;
      
      // Save details for the email notification later
      buyerEmail = orderData.buyerEmail || null;
      buyerName = orderData.buyerName || buyerName;
      orderNumber = orderData.orderNumber;

      // Ensure items array exists and has at least one product
      if (!orderData.items || orderData.items.length === 0) {
        throw new Error("Order has no items");
      }

      const productId = orderData.items[0].productId; 
      const productRef = adminDb.collection("products").doc(productId);
      const productSnap = await transaction.get(productRef);

      // 3. Status Behavior Rules
      if (newStatus === "cancelled") {
        // Unlock the product and restore the stock
        transaction.update(productRef, {
          stock: FieldValue.increment(1),
          locked: false,
          status: "available",
          updatedAt: Date.now()
        });
      } 
      else if (newStatus === "delivered" && productSnap.exists) {
        // Keep locked. If stock is 0, mark as sold out
        const productData = productSnap.data()!;
        if (productData.stock <= 0) {
          transaction.update(productRef, { 
            status: "sold_out", 
            updatedAt: Date.now() 
          });
        }
      }

      // 4. Update the order itself
      transaction.update(orderRef, {
        status: newStatus,
        updatedAt: Date.now()
      });
    });

    // 5. Send Status Update Email (Outside the transaction for speed/reliability)
    if (buyerEmail) {
      // We don't await this so the admin UI updates instantly while the email sends in the background
      sendStatusUpdateEmail(buyerEmail, buyerName, orderNumber, newStatus)
        .catch(err => console.error("Failed to send status update email:", err));
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error("Status update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update status" }, 
      { status: 500 }
    );
  }
}

// Keep the GET route here if you already have it for fetching orders
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get("adminId");

    if (!adminId) {
      return NextResponse.json({ error: "Missing admin ID" }, { status: 400 });
    }

    const adminSnap = await adminDb.collection("users").doc(adminId).get();
    if (!adminSnap.exists || adminSnap.data()?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch all orders ordered by creation date
    const ordersSnap = await adminDb.collection("orders")
      .orderBy("createdAt", "desc")
      .get();

    const orders = ordersSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch admin orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
