// app/api/orders/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import {
  sendOrderConfirmation,
  sendSellerNotification,
  sendAdminAlert
} from "@/lib/brevo";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      userId, 
      productId, 
      sellerId, 
      total, 
      contactPhone, 
      items, 
      buyerName: guestName 
    } = body;

    if (!userId || !productId) {
      return NextResponse.json({ error: "Missing user or product ID" }, { status: 400 });
    }

    // 1. Generate a clean Kabale Order Number
    const orderNumber = `KAB-${Math.floor(1000 + Math.random() * 9000)}`;

    let buyerEmail = null;
    let finalBuyerName = guestName || "Valued Customer";

    // 2. Fetch Buyer Details (Guest-Safe)
    if (userId !== "GUEST") {
      const buyerSnap = await adminDb.collection("users").doc(userId).get();
      if (buyerSnap.exists) {
        const buyerData = buyerSnap.data();
        buyerEmail = buyerData?.email || null;
        if (!guestName) {
          finalBuyerName = buyerData?.displayName || finalBuyerName;
        }
      }
    }

    let orderId = "";
    let itemName = "an item";
    let sellerEmail = null;
    let sellerName = "Seller";
    let sellerPhone = null;

    // 3. THE CRITICAL ATOMIC TRANSACTION
    // This ensures no two users can buy the item at the exact same time
    await adminDb.runTransaction(async (transaction) => {
      const productRef = adminDb.collection("products").doc(productId);
      const productSnap = await transaction.get(productRef);

      if (!productSnap.exists) {
        throw new Error("Product does not exist");
      }

      const productData = productSnap.data()!;
      itemName = productData?.name || productData?.title || "an item";
      sellerEmail = productData?.sellerEmail;
      sellerName = productData?.sellerName || "Seller";
      sellerPhone = productData?.sellerPhone;

      // VALIDATION: Prevent Double Ordering
      if (productData.stock <= 0 || productData.locked === true) {
        throw new Error("Item already taken or sold out");
      }

      // If seller details are missing on product, fetch from users collection
      if ((!sellerEmail || !sellerPhone) && sellerId && sellerId !== "SYSTEM") {
        const sellerRef = adminDb.collection("users").doc(sellerId);
        const sellerSnap = await transaction.get(sellerRef);
        if (sellerSnap.exists) {
          const sData = sellerSnap.data()!;
          if (!sellerEmail) sellerEmail = sData?.email;
          if (!sellerName || sellerName === "Seller") sellerName = sData?.displayName || sellerName;
          if (!sellerPhone) sellerPhone = sData?.phone;
        }
      }

      // Prepare the new Order Document
      const orderRef = adminDb.collection("orders").doc();
      orderId = orderRef.id;

      const orderData = {
        orderNumber,
        userId,
        buyerName: finalBuyerName,
        buyerEmail: buyerEmail, // Saved so the cron job can use it later
        sellerId: sellerId || "SYSTEM",
        items: items || [{ productId, quantity: 1, price: total }],
        total: Number(total),
        paymentMethod: "cash_on_delivery",
        status: "pending",
        contactPhone: contactPhone || "",
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // EXECUTE WRITES (Happens all at once)
      transaction.set(orderRef, orderData);
      transaction.update(productRef, {
        stock: FieldValue.increment(-1),
        locked: true,
        updatedAt: Date.now()
      });
    });

    // 4. FIRE NOTIFICATIONS (Outside the transaction to keep the lock fast)
    const notificationPromises = [];

    // Notify Buyer
    if (buyerEmail) {
      notificationPromises.push(
        sendOrderConfirmation(buyerEmail, finalBuyerName, orderNumber, Number(total))
          .catch(err => console.error("Buyer Email Error:", err))
      );
    }

    // Notify Seller
    if (sellerEmail) {
      notificationPromises.push(
        sendSellerNotification(
          sellerEmail, 
          sellerName, 
          itemName, 
          finalBuyerName, 
          contactPhone || "No phone"
        ).catch(err => console.error("Seller Email Error:", err))
      );
    }

    // Notify Admin
    notificationPromises.push(
      sendAdminAlert(
        orderNumber, 
        itemName, 
        Number(total), 
        finalBuyerName, 
        contactPhone || "No phone",
        sellerName,
        sellerPhone || "No phone"
      ).catch(err => console.error("Admin Email Error:", err))
    );

    // Run all emails concurrently without making the user wait
    await Promise.allSettled(notificationPromises);

    // 5. RETURN SUCCESS
    return NextResponse.json({ success: true, orderId }, { status: 200 });

  } catch (error: any) {
    console.error("Order creation error:", error);
    
    // Catch the specific locking error and send a 409 Conflict status back to the UI
    if (error.message === "Item already taken or sold out") {
       return NextResponse.json({ error: error.message }, { status: 409 }); 
    }
    
    return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
  }
}
