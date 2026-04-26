import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { NotificationService } from "@/lib/notifications"; 
import { sendAdminAlert } from "@/lib/brevo"; 

// ==========================================
// 1. POST: CREATE ORDER (Checkout Logic)
// ==========================================
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
      // Step A: Read all products first
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
          locked: true,
          updatedAt: Date.now()
        });
      });

      // Step C: Save Master Order
      const sellerOrders = Object.values(sellerOrdersMap);
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
        sellerIds: uniqueSellerIds,   
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

    notificationPromises.push(
      NotificationService.notifyBuyer(contactPhone, orderNumber, allProductsString, actualTotalAmount)
    );

    notificationPromises.push(
      sendAdminAlert(orderNumber, allProductsString, actualTotalAmount, contactPhone, "Multi-Seller COD Order")
    );

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

    await Promise.allSettled(notificationPromises);
    console.log("✅ All COD notifications dispatched successfully.");

    return NextResponse.json({ success: true, orderId: orderNumber });

  } catch (error: any) {
    console.error("❌ Order creation error:", error.message);
    return NextResponse.json({ error: error.message || "Failed to create order" }, { status: 500 });
  }
}

// ==========================================
// 2. GET: FETCH ORDERS FOR ADMIN DASHBOARD
// ==========================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get("adminId");

    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ordersSnap = await adminDb.collection("orders").orderBy("createdAt", "desc").limit(100).get();
    const orders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Admin Orders GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ==========================================
// 3. PATCH: UPDATE STATUS & TRIGGER PAYOUTS
// ==========================================
export async function PATCH(request: Request) {
  try {
    const { adminId, orderId, newStatus } = await request.json();

    if (!adminId || !orderId || !newStatus) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const orderRef = adminDb.collection("orders").doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderData = orderDoc.data()!;

    // A. Update the order status
    await orderRef.update({ 
      status: newStatus,
      updatedAt: Date.now() 
    });

    // ==========================================
    // 🚀 REFERRAL PAYOUT ENGINE
    // Triggered ONLY when marked "delivered"
    // ==========================================
    if (newStatus === "delivered" && orderData.referralCodeUsed && !orderData.payoutProcessed) {
      console.log(`[Referral Engine] Processing payout for order ${orderId} (Ref: ${orderData.referralCodeUsed})`);

      const usersRef = adminDb.collection("users");
      const partnerSnap = await usersRef.where("referralCode", "==", orderData.referralCodeUsed).limit(1).get();

      if (!partnerSnap.empty) {
        const partnerDoc = partnerSnap.docs[0];
        const partnerRef = partnerDoc.ref;
        const partnerData = partnerDoc.data();

        // 💰 Execute the Math: 10% (Max 3k) or Flat 300 UGX
        let rewardAmount = 0;
        const cartTotal = Number(orderData.totalAmount) || 0;

        if (cartTotal < 5000) {
          rewardAmount = 300; 
        } else {
          rewardAmount = Math.min(Math.floor(cartTotal * 0.10), 3000); 
        }

        // 🔒 Atomic Wallet Update
        await partnerRef.update({
          referralBalance: FieldValue.increment(rewardAmount),
          referralCount: FieldValue.increment(1)
        });

        // 🔒 Lock the order to prevent double-payouts
        await orderRef.update({
          payoutProcessed: true,
          payoutAmount: rewardAmount
        });

        // 📱 Send Meta WhatsApp Alert
        if (partnerData.phone) {
          const simulatedNewBalance = (Number(partnerData.referralBalance) || 0) + rewardAmount;
          await NotificationService.notifyPartnerCredit(
            partnerData.phone, 
            rewardAmount, 
            simulatedNewBalance
          );
        } else {
          console.log(`⚠️ Partner ${partnerData.email} got paid, but has no phone linked for WhatsApp alert.`);
        }
      }
    }

    return NextResponse.json({ success: true, message: `Order updated to ${newStatus}` });

  } catch (error) {
    console.error("Admin Orders PATCH Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
