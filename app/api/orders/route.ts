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
    
    // Extracted exactly what we need, NO delivery location
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

    // 1. Generate a beautiful Kabale Order Number
    const orderNumber = `KAB-${Math.floor(1000 + Math.random() * 9000)}`;

    // 2. Fetch Buyer Details (Guest-Safe Logic)
    let buyerEmail = null;
    let finalBuyerName = guestName || "Valued Customer";

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
      buyerName: finalBuyerName, 
      sellerId: sellerId || "SYSTEM",
      items: items || [{ productId, quantity: 1, price: total }],
      total: Number(total),
      paymentMethod: "cash_on_delivery",
      status: "pending",
      contactPhone: contactPhone || "",
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const docRef = await adminDb.collection("orders").add(orderData);

    // 5. Fire off all Notifications Concurrently
    const notificationPromises = [];

    // --- EMAILS ---
    
    if (buyerEmail) { 
      notificationPromises.push(
        sendOrderConfirmation(buyerEmail, finalBuyerName, orderNumber, Number(total))
          .catch(err => console.error("Buyer Email Error:", err))
      );
    }

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

    // Admin alert (with all the detailed cards)
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

    // --- WHATSAPP ---
    
    const fallbackAdminPhone = "256759997376"; 
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get("origin") || "http://localhost:3000";
    
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
            buyerName: finalBuyerName, 
            orderNumber: orderNumber   
          }
        })
      }).catch(err => console.error("WhatsApp Trigger Error:", err))
    );

    await Promise.allSettled(notificationPromises);

    return NextResponse.json({ success: true, orderId: docRef.id }, { status: 200 });

  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
  }
}
