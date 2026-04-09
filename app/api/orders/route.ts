import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { NotificationService } from "@/lib/notifications"; 
import { sendAdminAlert } from "@/lib/brevo"; 

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { source, userId, buyerName, contactPhone, location, cartItems } = body;

    // 1. BASIC VALIDATION
    if (!cartItems || cartItems.length === 0 || !contactPhone || !buyerName) {
      return NextResponse.json({ error: "Missing required fields or empty cart" }, { status: 400 });
    }

    const orderNumber = `KAB-${Math.floor(1000 + Math.random() * 9000)}`;
    let actualTotalAmount = 0;
    const validatedItems: any[] = [];
    const sellerOrdersMap: Record<string, any> = {};

    // 2. MULTI-ITEM ATOMIC TRANSACTION
    await adminDb.runTransaction(async (transaction) => {
      // Step A: Read all products first (Firestore rule: all reads must come before writes)
      const productDocs = await Promise.all(
        cartItems.map((item: any) => transaction.get(adminDb.collection("products").doc(item.productId || item.id)))
      );

      // Step B: Validate Stock & Price
      productDocs.forEach((productSnap, index) => {
        if (!productSnap.exists) throw new Error(`Item ${cartItems[index].name} is not found.`);

        const product = productSnap.data()!;
        const requestedQty = Number(cartItems[index].quantity) || 1;

        if (product.stock < requestedQty || product.status === "sold_out") {
          throw new Error(`Sorry, ${product.title || product.name} is out of stock!`);
        }
        if (product.locked) {
          throw new Error(`Sorry, someone else is currently checking out with ${product.title || product.name}.`);
        }

        const actualPrice = Number(product.price) || 0;
        actualTotalAmount += (actualPrice * requestedQty);

        // Build validated item
        const finalItem = {
          productId: productSnap.id,
          name: product.title || product.name || "Unknown Item",
          price: actualPrice,
          quantity: requestedQty,
          sellerId: product.sellerId || "SYSTEM",
          sellerPhone: product.sellerPhone || "",
          image: product.images?.[0] || ""
        };
        validatedItems.push(finalItem);

        // Group by Seller
        if (!sellerOrdersMap[finalItem.sellerPhone]) {
          sellerOrdersMap[finalItem.sellerPhone] = {
            sellerId: finalItem.sellerId,
            sellerPhone: finalItem.sellerPhone,
            items: [],
            subtotal: 0
          };
        }
        sellerOrdersMap[finalItem.sellerPhone].items.push(finalItem);
        sellerOrdersMap[finalItem.sellerPhone].subtotal += (actualPrice * requestedQty);

        // Deduct Stock
        transaction.update(productSnap.ref, {
          stock: FieldValue.increment(-requestedQty),
          locked: true, // Optional: You might want to remove 'locked' if you rely purely on stock
          updatedAt: Date.now()
        });
      });

      // Step C: Save Master Order
      const sellerOrders = Object.values(sellerOrdersMap);
      
      // 🔥 NEW: Extract flat array of seller IDs for Firestore Rules Security!
      const uniqueSellerIds = Array.from(new Set(validatedItems.map(item => item.sellerId).filter(Boolean)));

      const orderRef = adminDb.collection("orders").doc(orderNumber);

      transaction.set(orderRef, {
        orderId: orderNumber,
        userId: userId || "GUEST",
        buyerName,
        buyerPhone: contactPhone,
        buyerLocation: location || "Kabale",
        source: source || "whatsapp", 
        paymentMode: "COD",           
        paymentStatus: "pending",     
        status: "processing",         
        cartItems: validatedItems,
        sellerOrders: sellerOrders,
        sellerIds: uniqueSellerIds,   // 🔥 Added flat array here
        totalAmount: actualTotalAmount,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    });

    // ==========================================
    // 3. BACKGROUND NOTIFICATION ROUTING
    // ==========================================
    console.log("-> Executing Notification Promises for COD Order...");

    const notificationPromises: Promise<any>[] = [];
    const allProductsString = validatedItems.map(i => `${i.quantity}x ${i.name}`).join(", ");

    // A. Notify Buyer
    notificationPromises.push(
      NotificationService.notifyBuyer(contactPhone, orderNumber, allProductsString, actualTotalAmount)
    );

    // B. Notify Admin
    notificationPromises.push(
      sendAdminAlert(orderNumber, allProductsString, actualTotalAmount, contactPhone, "Multi-Seller COD Order")
    );

    // C. Notify Each Seller
    const sellerOrdersList = Object.values(sellerOrdersMap);
    for (const sellerCut of sellerOrdersList) {
      const sellerItemsString = sellerCut.items.map((i: any) => `${i.quantity}x ${i.name}`).join(", ");

      notificationPromises.push(
        NotificationService.notifySeller(
          sellerCut.sellerPhone, 
          "Partner", 
          orderNumber, 
          sellerItemsString, 
          sellerCut.subtotal, 
          buyerName,
          location || "Kabale",
          contactPhone
        )
      );
    }

    // Freeze container until notifications fire
    await Promise.allSettled(notificationPromises);
    console.log("✅ All COD notifications dispatched successfully.");

    return NextResponse.json({ success: true, orderId: orderNumber });

  } catch (error: any) {
    console.error("❌ Order creation error:", error.message);
    return NextResponse.json({ error: error.message || "Failed to create order" }, { status: 500 });
  }
}
