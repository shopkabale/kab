import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { 
  sendOrderConfirmation, 
  sendSellerNotification, 
  sendAdminAlert 
} from "@/lib/brevo";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, productId, sellerId, total, deliveryLocation, contactPhone, items } = body;

    if (!userId || !productId) {
      return NextResponse.json({ error: "Missing user or product ID" }, { status: 400 });
    }

    // 1. Generate a beautiful Kabale Order Number
    const orderNumber = `KAB-${Math.floor(1000 + Math.random() * 9000)}`;

    // 2. Fetch Buyer Details (to send them the confirmation email)
    const buyerSnap = await adminDb.collection("users").doc(userId).get();
    const buyerData = buyerSnap.exists ? buyerSnap.data() : null;
    const buyerEmail = buyerData?.email;
    const buyerName = buyerData?.displayName || "Valued Customer";

    // 3. Fetch Product & Seller Details (to send the seller an alert)
    const productSnap = await adminDb.collection("products").doc(productId).get();
    const productData = productSnap.exists ? productSnap.data() : null;
    const itemName = productData?.name || "an item";
    
    // We need the seller's email. It might be on the product, or we might need to look up the seller in the users collection.
    let sellerEmail = productData?.sellerEmail;
    let sellerName = productData?.sellerName || "Seller";
    
    if (!sellerEmail && sellerId && sellerId !== "SYSTEM") {
      const sellerSnap = await adminDb.collection("users").doc(sellerId).get();
      if (sellerSnap.exists) {
        sellerEmail = sellerSnap.data()?.email;
        sellerName = sellerSnap.data()?.displayName || sellerName;
      }
    }

    // 4. Save the Order to Firebase
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

    // 5. Fire off all Brevo Emails concurrently (Non-blocking)
    const emailPromises = [];

    // A. Email the Buyer
    if (buyerEmail) {
      emailPromises.push(
        sendOrderConfirmation(buyerEmail, buyerName, orderNumber, Number(total))
      );
    }

    // B. Email the Seller
    if (sellerEmail) {
      emailPromises.push(
        sendSellerNotification(
          sellerEmail, 
          sellerName, 
          itemName, 
          buyerName, 
          contactPhone || "No phone provided", 
          deliveryLocation || "Kabale Town"
        )
      );
    }

    // C. Email the Admin
    emailPromises.push(
      sendAdminAlert(
        orderNumber, 
        itemName, 
        Number(total), 
        buyerName, 
        contactPhone || "No phone provided"
      )
    );

    // Run all email tasks in the background so the user isn't waiting
    await Promise.allSettled(emailPromises);

    return NextResponse.json({ success: true, orderId: docRef.id }, { status: 200 });

  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
  }
}