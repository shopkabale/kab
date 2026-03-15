import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, items, paymentMethod, total, sellerId } = body;

    // Basic validation
    if (!userId || !items || items.length === 0 || !sellerId) {
      return NextResponse.json({ error: "Invalid checkout data provided." }, { status: 400 });
    }

    // A transaction must return a Promise
    const orderResult = await adminDb.runTransaction(async (transaction) => {

      // ==========================================
      // PHASE 1: READ EVERYTHING FIRST
      // (Firestore rules dictate all reads must happen before any writes)
      // ==========================================
      const productRefs = items.map((item: any) => adminDb.collection("products").doc(item.productId));
      const productDocs = await transaction.getAll(...productRefs);

      const inventoryUpdates: any[] = [];

      // ==========================================
      // PHASE 2: VALIDATE INVENTORY
      // ==========================================
      productDocs.forEach((doc, index) => {
        if (!doc.exists) {
          throw new Error(`Product ${items[index].productId} no longer exists.`);
        }

        // 🚨 FIX IS RIGHT HERE: Added "as any" 
        const productData = doc.data() as any; 
        
        const requestedQuantity = items[index].quantity;
        const currentStock = productData?.stock || 0;

        if (currentStock < requestedQuantity) {
          throw new Error(`Out of stock! Only ${currentStock} left for ${productData?.name || 'this item'}.`);
        }

        // Calculate the new stock number
        const newStock = currentStock - requestedQuantity;

        // Determine if it should be marked as sold out
        const newStatus = newStock <= 0 ? "sold_out" : (productData?.status || "active");

        // Store the updates to apply in Phase 3
        inventoryUpdates.push({
          ref: doc.ref,
          newStock: newStock,
          newStatus: newStatus
        });
      });

      // ==========================================
      // PHASE 3: EXECUTE WRITES (DEDUCT STOCK)
      // ==========================================
      inventoryUpdates.forEach((update) => {
        transaction.update(update.ref, {
          stock: update.newStock,
          status: update.newStatus
        });
      });

      // ==========================================
      // PHASE 4: CREATE THE ORDER DOCUMENT
      // ==========================================
      const orderRef = adminDb.collection("orders").doc();
      const orderNumber = `KAB-${Math.floor(100000 + Math.random() * 900000)}`; // e.g. KAB-482910

      const newOrder = {
        id: orderRef.id,
        orderNumber: orderNumber,
        userId: userId,
        sellerId: sellerId, // Tied to the vendor so it shows in their dashboard
        items: items, // Array of { productId, quantity, price }
        total: total,
        paymentMethod: paymentMethod || "cash_on_delivery",
        status: "pending",
        createdAt: Date.now(), // Respecting your numeric timestamp schema
      };

      transaction.set(orderRef, newOrder);

      return newOrder; // Return the generated order to the frontend
    });

    // If the transaction finishes without throwing an error, the order is secured
    return NextResponse.json({ 
      success: true, 
      message: "Order placed successfully", 
      orderId: orderResult.id,
      orderNumber: orderResult.orderNumber 
    });

  } catch (error: any) {
    console.error("Checkout Transaction Failed:", error);

    // Check if the error is our custom inventory error
    if (error.message.includes("Out of stock") || error.message.includes("no longer exists")) {
      return NextResponse.json({ error: error.message }, { status: 409 }); // 409 Conflict
    }

    return NextResponse.json({ error: "Failed to process order. Please try again." }, { status: 500 });
  }
}
