import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { NotificationService } from "@/lib/notifications"; 
import { sendAdminAlert, sendBuyerReceipt, sendSellerNotification } from "@/lib/brevo"; 

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { source, userId, buyerName, contactPhone, location, cartItems, buyerEmail } = body;

    if (!cartItems || cartItems.length === 0 || !contactPhone || !buyerName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Changed prefix to MBA (Mbarara)
    const orderNumber = `MBA-${Math.floor(1000 + Math.random() * 9000)}`;
    let actualTotalAmount = 0;
    const validatedItems: any[] = [];
    const sellerOrdersMap: Record<string, any> = {};

    await adminDb.runTransaction(async (transaction) => {
      const productDocs = await Promise.all(
        cartItems.map((item: any) => transaction.get(adminDb.collection("products").doc(item.productId || item.id)))
      );

      productDocs.forEach((productSnap, index) => {
        if (!productSnap.exists) throw new Error(`Item ${cartItems[index].name} not found.`);
        const product = productSnap.data()!;
        const requestedQty = Number(cartItems[index].quantity) || 1;
        const actualPrice = Number(product.price) || 0;

        actualTotalAmount += (actualPrice * requestedQty);

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

        if (!sellerOrdersMap[finalItem.sellerId]) {
          sellerOrdersMap[finalItem.sellerId] = {
            sellerId: finalItem.sellerId,
            items: [],
            subtotal: 0
          };
        }
        sellerOrdersMap[finalItem.sellerId].items.push(finalItem);
        sellerOrdersMap[finalItem.sellerId].subtotal += (actualPrice * requestedQty);

        transaction.update(productSnap.ref, { stock: FieldValue.increment(-requestedQty) });
      });

      const orderRef = adminDb.collection("orders").doc(orderNumber);
      transaction.set(orderRef, {
        orderId: orderNumber,
        userId: userId || "GUEST",
        buyerName,
        buyerPhone: contactPhone,
        buyerEmail: buyerEmail || "",
        totalAmount: actualTotalAmount,
        createdAt: Date.now(),
        status: "processing",
        location: location || "Mbarara" // Save location to DB
      });
    });

    // ==========================================
    // NOTIFICATION & EMAIL ROUTING
    // ==========================================
    const allProductsString = validatedItems.map(i => `${i.quantity}x ${i.name}`).join(", ");
    const notificationPromises: Promise<any>[] = [];

    // 1. Send Buyer Receipt
    if (buyerEmail) {
      notificationPromises.push(sendBuyerReceipt(buyerEmail, buyerName, orderNumber, allProductsString, actualTotalAmount));
    }

    // 2. Notify Each Seller
    const sellerIds = Object.keys(sellerOrdersMap);
    for (const sellerId of sellerIds) {
      const sellerData = await adminDb.collection("users").doc(sellerId).get();
      const sData = sellerData.data();
      const sEmail = sData?.email;
      const sPhone = sData?.phone || "N/A";
      const sName = sData?.displayName || "Partner";

      if (sEmail) {
        notificationPromises.push(sendSellerNotification(sEmail, sName, orderNumber, allProductsString, sellerOrdersMap[sellerId].subtotal, contactPhone));
      }

      // Notify via WhatsApp
      notificationPromises.push(NotificationService.notifySeller(sPhone, sName, orderNumber, allProductsString, sellerOrdersMap[sellerId].subtotal, buyerName, location, contactPhone));
    }

    // 3. Send Admin Alert (UPDATED FOR ARRAY AND LOCATION)
    notificationPromises.push(
      sendAdminAlert(
        orderNumber, 
        validatedItems, // Pass the array of items for mapping links
        actualTotalAmount, 
        contactPhone, 
        location // Pass delivery location
      )
    );

    await Promise.allSettled(notificationPromises);

    return NextResponse.json({ success: true, orderId: orderNumber });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
