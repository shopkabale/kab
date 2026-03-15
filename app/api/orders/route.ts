import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { 
  sendOrderConfirmation, 
  sendSellerNotification, 
  sendAdminAlert 
} from "@/lib/brevo";
import { NotificationService } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, productId, sellerId, total, deliveryLocation, contactPhone, items } = body;

    if (!userId || !productId) {
      return NextResponse.json({ error: "Missing user or product ID" }, { status: 400 });
    }

    // 1. Generate a beautiful Kabale Order Number
    const orderNumber = `KAB-${Math.floor(1000 + Math.random() * 9000)}`;

    // 2. Fetch Buyer Details
    const buyerSnap = await adminDb.collection("users").doc(userId).get();
    const buyerData = buyerSnap.exists ? buyerSnap.data() : null;
    const buyerEmail = buyerData?.email;
    const buyerName = buyerData?.displayName || "Valued Customer";

    // 3. Fetch Product & Seller Details
    const productSnap = await adminDb.collection("products").doc(productId).get();
    const productData = productSnap.exists ? productSnap.data() : null;
    const itemName = productData?.name || "an item";

    let sellerEmail = productData?.sellerEmail;
    let sellerName = productData?.sellerName || "Seller";
    let sellerPhone = productData?.sellerPhone; 

    // If details are missing on the product, try fetching from the users collection
    if ((!sellerEmail || !sellerPhone) && sellerId && sellerId !== "SYSTEM") {
      const sellerSnap = await adminDb.collection("users").doc(sellerId).get();
      if (sellerSnap.exists) {
        sellerEmail = sellerSnap.data()?.email || sellerEmail;
        sellerName = sellerSnap.data()?.displayName || sellerName;
        sellerPhone = sellerSnap.data()?.phone || sellerPhone; 
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

    // 5. Fire off all Notifications (Email + WhatsApp) concurrently
    const notificationPromises = [];

    // --- EMAIL PROMISES ---
    if (buyerEmail) {
      notificationPromises.push(
        sendOrderConfirmation(buyerEmail, buyerName, orderNumber, Number(total))
      );
    }

    if (sellerEmail) {
      notificationPromises.push(
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

    notificationPromises.push(
      sendAdminAlert(
        orderNumber, 
        itemName, 
        Number(total), 
        buyerName, 
        contactPhone || "No phone provided"
      )
    );

    // --- WHATSAPP PROMISES ---
    if (contactPhone) {
      // Set your admin fallback number, formatted for Meta API (256 instead of 0)
      const fallbackPhone = "256759997376";
      
      // Check if seller provided a phone, and format it for Meta if it starts with '0'
      let activeSellerPhone = sellerPhone;
      if (activeSellerPhone && activeSellerPhone.startsWith('0')) {
        activeSellerPhone = `256${activeSellerPhone.slice(1)}`;
      }

      // Use the formatted seller phone, OR fallback to your number if it's completely missing
      const finalSellerPhone = activeSellerPhone || fallbackPhone;

      // Format the buyer's phone number for Meta API as well
      let finalBuyerPhone = contactPhone;
      if (finalBuyerPhone.startsWith('0')) {
        finalBuyerPhone = `256${finalBuyerPhone.slice(1)}`;
      }

      notificationPromises.push(
        NotificationService.orderCreated(
          finalSellerPhone, 
          finalBuyerPhone, 
          itemName
        ).catch(err => console.error("WhatsApp OrderCreated Error:", err))
      );
    }

    // Run all tasks in the background so the user isn't waiting
    await Promise.allSettled(notificationPromises);

    return NextResponse.json({ success: true, orderId: docRef.id }, { status: 200 });

  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
  }
}
