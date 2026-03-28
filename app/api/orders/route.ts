import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { NotificationService } from "@/lib/notifications"; // 🔥 Triggers WhatsApp Templates
import { sendAdminAlert } from "@/lib/brevo"; // 🔥 Triggers Admin Email

// ==========================================
// POST: Create a new order (Called by FastBuy)
// ==========================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, buyerName, productId, sellerId, total, contactPhone } = body;

    // 1. Basic Validation
    if (!productId || !contactPhone || !buyerName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const productRef = adminDb.collection("products").doc(productId);
    
    let orderNumber = "";
    let sellerPhone = "";
    let productName = "";

    // 2. Perform database transaction to prevent double-booking
    await adminDb.runTransaction(async (transaction) => {
      const productSnap = await transaction.get(productRef);
      if (!productSnap.exists) throw new Error("Product not found");
      
      const product = productSnap.data()!;
      
      // Check if someone else just bought it
      if (product.stock <= 0 || product.status === "sold_out") {
        throw new Error("Sorry, this item is sold out!");
      }
      if (product.locked) {
        throw new Error("Sorry, someone else just reserved this item!");
      }

      productName = product.title || product.name || "Unknown Item";
      sellerPhone = product.sellerPhone;
      
      // Lock the product and reduce stock
      transaction.update(productRef, {
        stock: FieldValue.increment(-1),
        locked: true,
        updatedAt: Date.now()
      });

      // Create the official Order Document
      orderNumber = `KAB-${Math.floor(1000 + Math.random() * 9000)}`;
      const orderRef = adminDb.collection("orders").doc(orderNumber);
      
      transaction.set(orderRef, {
        id: orderNumber,
        orderId: orderNumber,
        orderNumber: orderNumber,
        productId,
        buyerId: userId || "GUEST",
        buyerName,
        buyerPhone: contactPhone,
        sellerId: product.sellerId || sellerId || "SYSTEM",
        sellerPhone: sellerPhone,
        status: "pending",
        total: Number(total),
        items: [{
          productId,
          title: productName,
          price: Number(total),
          quantity: 1
        }],
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    });

    // ==========================================
    // 3. BACKGROUND TRIGGERS (Fire & Forget)
    // ==========================================
    if (sellerPhone) {
       // 🔥 Trigger Meta WhatsApp Templates (Buyer + Seller)
       NotificationService.orderCreated(
         sellerPhone, 
         contactPhone, 
         productName, 
         buyerName, 
         orderNumber
       ).catch(err => console.error("WhatsApp Notification Error:", err));

       // 🔥 Trigger Admin Ledger Email
       sendAdminAlert(
         orderNumber, 
         productName, 
         Number(total), 
         contactPhone, 
         sellerPhone
       ).catch(err => console.error("Admin Email Error:", err));
    }

    return NextResponse.json({ success: true, orderId: orderNumber });

  } catch (error: any) {
    console.error("❌ Order creation error:", error.message);
    return NextResponse.json({ error: error.message || "Failed to create order" }, { status: 500 });
  }
}

// ==========================================
// PATCH: Admin updates order status
// ==========================================
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

    // 2. Perform the stock, lock, and status updates atomically
    await adminDb.runTransaction(async (transaction) => {
      const orderRef = adminDb.collection("orders").doc(orderId);
      const orderSnap = await transaction.get(orderRef);

      if (!orderSnap.exists) {
        throw new Error("Order not found");
      }

      const orderData = orderSnap.data()!;

      // Ensure items array exists and has at least one product
      if (!orderData.items || orderData.items.length === 0) {
        throw new Error("Order has no items");
      }

      const productId = orderData.items[0].productId; 
      const productRef = adminDb.collection("products").doc(productId);
      const productSnap = await transaction.get(productRef);

      // 3. Status Behavior Rules
      if (newStatus === "cancelled") {
        transaction.update(productRef, {
          stock: FieldValue.increment(1),
          locked: false,
          status: "available",
          updatedAt: Date.now()
        });
      } 
      else if (newStatus === "delivered" && productSnap.exists) {
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

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error("Status update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update status" }, 
      { status: 500 }
    );
  }
}

// ==========================================
// GET: Admin fetches all orders
// ==========================================
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

    const ordersSnap = await adminDb.collection("orders")
      .orderBy("createdAt", "desc")
      .get();

    const orders = await Promise.all(ordersSnap.docs.map(async (doc) => {
      const data = doc.data();
      let totalAmount = Number(data.total) || 0;

      if (totalAmount === 0 && data.productId) {
        try {
          const productDoc = await adminDb.collection("products").doc(data.productId).get();
          if (productDoc.exists) {
            totalAmount = Number(productDoc.data()?.price) || 0;
          }
        } catch (err) {
          console.error(`Could not fetch fallback price for product ${data.productId}`);
        }
      }

      return {
        id: doc.id,
        ...data,
        total: totalAmount 
      };
    }));

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch admin orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
