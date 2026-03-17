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
    
    // Extract buyerName (sent from guest checkout) along with standard fields
    const { 
      userId, 
      productId, 
      sellerId, 
      total, 
      deliveryLocation, 
      contactPhone, 
      items, 
      buyerName: guestName 
    } = body;

    if (!userId || !productId) {
      return NextResponse.json({ error: "Missing user or product ID" }, { status: 400 });
    }

    // 1. Generate a beautiful Kabale Order Number
    const orderNumber = `KAB-${Math.floor(1000 + Math.random() * 9000)}`;

    // 2. Fetch Buyer Details (Guest-Safe Logic)
    let buyerEmail = null;
    let finalBuyerName = guestName || "Valued Customer"; // Fallback to frontend input

    // Only query Firebase if they are NOT a guest
    if (userId !== "GUEST") {
      const buyerSnap = await adminDb.collection("users").doc(userId).get();
      if (buyerSnap.exists) {
        const buyerData = buyerSnap.data();
        buyerEmail = buyerData?.email || null;
        
        // If frontend didn't send a name, use the one from their profile
        if (!guestName) {
          finalBuyerName = buyerData?.displayName || finalBuyerName;
        }
      }
    }

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
        const sData = sellerSnap.data();
        sellerEmail = sData?.email || sellerEmail;
        sellerName = sData?.displayName || sellerName;
        sellerPhone = sData?.phone || sellerPhone; 
      }
    }

    // 4. Save the Order to Firebase
    const orderData = {
      orderNumber,
      userId,
      buyerName: finalBuyerName, // Save guest name directly to the order
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

    // 5. Fire off all Notifications Concurrently
    const notificationPromises = [];

    // --- EMAILS ---
    
    // Only send if the buyer actually has an email (Guests will skip this safely)
    if (buyerEmail) { 
      notificationPromises.push(
        sendOrderConfirmation(buyerEmail, finalBuyerName, orderNumber, Number(total))
          .catch(err => console.error("Buyer Email Error:", err))
      );
    }

    // Sellers always have an email, so this always fires
    if (sellerEmail) {
      notificationPromises.push(
        sendSellerNotification(sellerEmail, sellerName, itemName, finalBuyerName, contactPhone || "No phone", deliveryLocation || "Kabale Town")
          .catch(err => console.error("Seller Email Error:", err))
      );
    }

    // Admin alert
    notificationPromises.push(
      sendAdminAlert(orderNumber, itemName, Number(total), finalBuyerName, contactPhone || "No phone")
        .catch(err => console.error("Admin Email Error:", err))
    );

    // --- WHATSAPP ---
    
    const fallbackAdminPhone = "256759997376"; 
    // Dynamically grab the base URL so it works in both local development and Vercel production
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get("origin") || "http://localhost:3000";
    
    // Call your internal notify route to trigger the Meta API
    notificationPromises.push(
      fetch(`${baseUrl}/api/orders/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: "ORDER_CREATED",
          payload: {
            productName: itemName,
            buyerPhone: contactPhone,
            sellerPhone: sellerPhone || fallbackAdminPhone,
            buyerName: finalBuyerName, // Required for your verified buyer template
            orderNumber: orderNumber   // Required for your verified buyer template
          }
        })
      }).catch(err => console.error("WhatsApp Trigger Error:", err))
    );

    // Await all promises so Vercel doesn't kill the function before they send
    await Promise.allSettled(notificationPromises);

    return NextResponse.json({ success: true, orderId: docRef.id }, { status: 200 });

  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
  }
}
