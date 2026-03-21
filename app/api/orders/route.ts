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
    
    // Extract everything, handling both Fast Checkout and standard Cart structures
    const { 
      userId, 
      productId, 
      sellerId, 
      total, 
      contactPhone, 
      items, 
      buyerName: guestName 
    } = body;

    // Safety fallback: if productId is missing at the root, grab it from items array
    const actualProductId = productId || (items && items.length > 0 ? items[0].productId : null);
    const quantityToDeduct = items && items.length > 0 ? items[0].quantity : 1;

    if (!userId || !actualProductId) {
      return NextResponse.json({ error: "Missing user or product ID" }, { status: 400 });
    }

    // 1. Generate Order Number
    const orderNumber = `KAB-${Math.floor(1000 + Math.random() * 9000)}`;

    let buyerEmail = null;
    let finalBuyerName = guestName || "Valued Customer";

    // 2. Fetch Buyer Details
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

    // 3. ATOMIC TRANSACTION (With BULLETPROOF math for stock)
    await adminDb.runTransaction(async (transaction) => {
      const productRef = adminDb.collection("products").doc(actualProductId);
      const productSnap = await transaction.get(productRef);

      if (!productSnap.exists) {
        throw new Error("Product does not exist");
      }

      const productData = productSnap.data()!;
      itemName = productData?.name || productData?.title || "an item";
      sellerEmail = productData?.sellerEmail;
      sellerName = productData?.sellerName || "Seller";
      sellerPhone = productData?.sellerPhone;

      // 🔥 BULLETPROOF MATH: Safely handle strings and force numbers
      const currentStock = Number(productData.stock) || 0;
      const deductAmount = Number(quantityToDeduct) || 1;

      // VALIDATION: Check exact stock
      if (currentStock < deductAmount || productData.locked === true) {
        throw new Error("Item already taken or sold out");
      }

      // Fetch fallback seller info if missing
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

      // Create Order Doc
      const orderRef = adminDb.collection("orders").doc();
      orderId = orderRef.id;

      const orderData = {
        orderNumber,
        userId,
        buyerName: finalBuyerName,
        buyerEmail: buyerEmail,
        sellerId: sellerId || "SYSTEM",
        items: items || [{ productId: actualProductId, quantity: deductAmount, price: total }],
        total: Number(total),
        paymentMethod: "cash_on_delivery",
        status: "pending",
        contactPhone: contactPhone || "",
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // Write Order
      transaction.set(orderRef, orderData);

      // 🔥 FIX: Calculate new stock safely (Ensures it never goes below 0)
      const newStock = Math.max(0, currentStock - deductAmount);

      // Write Product Update
      transaction.update(productRef, {
        stock: newStock,
        locked: true,
        updatedAt: Date.now()
      });
    });

    // 4. FIRE ALL NOTIFICATIONS
    const notificationPromises = [];

    // --- EMAIL: Buyer Confirmation ---
    if (buyerEmail) {
      notificationPromises.push(
        sendOrderConfirmation(buyerEmail, finalBuyerName, orderNumber, Number(total))
          .catch(err => console.error("Buyer Email Error:", err))
      );
    }

    // --- EMAIL: Seller Alert ---
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

    // --- EMAIL: Admin Alert ---
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

    // --- WHATSAPP RESTORED ---
    const fallbackAdminPhone = "256759997376";   
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get("origin") || "http://localhost:3000";  

    // We only need ONE fetch call! Your /api/orders/notify route will pass this payload 
    // to NotificationService.orderCreated, which will text BOTH the Seller and the Buyer.
    notificationPromises.push(  
      fetch(`${baseUrl}/api/orders/notify`, {  
        method: 'POST',  
        headers: { 'Content-Type': 'application/json' },  
        body: JSON.stringify({  
          eventType: "ORDER_CREATED",  
          payload: {  
            sellerPhone: sellerPhone || fallbackAdminPhone, // Used for Template 1 (Seller)
            buyerPhone: contactPhone,                       // Used for Template 2 (Buyer)
            productName: itemName,                          // Variable {{1}} for Seller
            buyerName: finalBuyerName,                      // Variable {{1}} for Buyer
            orderNumber: orderNumber,                       // Variable {{2}} for Buyer
            
            // 🚀 PREPPED FOR YOUR NEW ADMIN WHATSAPP TEMPLATE (Once approved)
            adminPhone: fallbackAdminPhone,
            sellerName: sellerName,
            price: `UGX ${Number(total).toLocaleString()}`
          }  
        })  
      }).catch(err => console.error("WhatsApp Trigger Error:", err))  
    );  

    // Run all concurrently
    await Promise.allSettled(notificationPromises);

    return NextResponse.json({ success: true, orderId }, { status: 200 });

  } catch (error: any) {
    console.error("Order creation error:", error);
    if (error.message === "Item already taken or sold out") {
       return NextResponse.json({ error: error.message }, { status: 409 }); 
    }
    return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
  }
}
