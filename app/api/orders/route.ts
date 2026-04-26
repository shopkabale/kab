import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { NotificationService } from "@/lib/notifications"; 
import { sendAdminAlert } from "@/lib/brevo"; 

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

    let referrerId: string | null = null;
    let referrerPhone: string | null = null;
    let referrerCode: string | null = null;
    let rewardAmount = 0; 
    let debugMessage = `Order status updated to ${newStatus}.`; 

    // 🚀 2. PRE-TRANSACTION CHECK: Evaluate Referral Eligibility
    if (newStatus === "delivered") {
      const orderSnap = await adminDb.collection("orders").doc(orderId).get();
      const orderData = orderSnap.data();

      if (!orderData) {
        debugMessage = "Order not found in DB.";
      } else if (!orderData.referralCodeUsed) {
        debugMessage = "Order Delivered. (Skipped payout: No referral code attached).";
      } else if (!orderData.buyerPhone) {
        debugMessage = "Order Delivered. (Skipped payout: No buyer phone to verify first-time status).";
      } else if (orderData.status === "delivered") {
        debugMessage = "Order Delivered. (Skipped payout: Order was already delivered previously).";
      } else {
        const items = orderData.cartItems || orderData.items || [];

        // 🚀 RULE 1 FIXED: Check for Admin ID, Admin Phone, OR isAdminUpload tag!
        const OFFICIAL_SELLER_ID = "HemTITkLkWabkm8pj9CCf5bRlHJ3";
        const OFFICIAL_PHONE = "0759997376";
        
        const hasOfficialProduct = items.some((item: any) => 
          item.sellerId === "SYSTEM" || 
          item.sellerId === OFFICIAL_SELLER_ID || 
          item.sellerPhone === OFFICIAL_PHONE ||
          item.isAdminUpload === true // 🚀 ADDED THE EXPLICIT TAG CHECK
        );

        if (!hasOfficialProduct) {
          debugMessage = "Order Delivered. (Skipped payout: Cart did not contain any Official Kabale products).";
        } else {
          // RULE 2: Buyer phone must have NO previous delivered orders (First-time purchase)
          const prevOrders = await adminDb.collection("orders")
            .where("buyerPhone", "==", orderData.buyerPhone)
            .where("status", "==", "delivered")
            .limit(1)
            .get();

          if (!prevOrders.empty) {
            debugMessage = `Order Delivered. (Skipped payout: Buyer ${orderData.buyerPhone} is not a first-time customer).`;
          } else {
            // 🚀 DYNAMIC TIERED MATH
            const orderTotal = Number(orderData.totalAmount) || Number(orderData.total) || 0;

            if (orderTotal < 5000) {
              rewardAmount = 300; 
            } else {
              rewardAmount = Math.min(Math.floor(orderTotal * 0.10), 3000);
            }

            // Find the referrer who owns this code
            const referrerSnap = await adminDb.collection("users")
              .where("referralCode", "==", orderData.referralCodeUsed)
              .limit(1)
              .get();

            if (referrerSnap.empty) {
              debugMessage = `Order Delivered. (Skipped payout: Nobody owns the code ${orderData.referralCodeUsed}).`;
            } else {
              const referrerData = referrerSnap.docs[0].data();
              referrerId = referrerSnap.docs[0].id;
              referrerPhone = referrerData.phone || referrerData.phoneNumber || null;
              referrerCode = orderData.referralCodeUsed;

              if (referrerPhone) {
                debugMessage = `SUCCESS! Partner earned ${rewardAmount} UGX.\nWhatsApp queued for ${referrerPhone}.`;
              } else {
                debugMessage = `SUCCESS! Partner earned ${rewardAmount} UGX, but has no phone number linked for WhatsApp alerts.`;
              }
            }
          }
        }
      }
    }

    // 3. Perform the stock, lock, and status updates atomically
    await adminDb.runTransaction(async (transaction) => {
      const orderRef = adminDb.collection("orders").doc(orderId);
      const orderSnap = await transaction.get(orderRef);

      if (!orderSnap.exists) throw new Error("Order not found");

      const orderData = orderSnap.data()!;
      const items = orderData.cartItems || orderData.items || [];

      // Ensure items array exists safely
      if (items.length > 0) {
        const productId = items[0].productId || items[0].id; 
        if (productId) {
           const productRef = adminDb.collection("products").doc(productId);
           const productSnap = await transaction.get(productRef);

           // Status Behavior Rules
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
        }
      }

      // Update the order itself (Lock payout to prevent double paying)
      const updatePayload: any = {
        status: newStatus,
        updatedAt: Date.now()
      };
      if (referrerId && rewardAmount > 0) {
         updatePayload.payoutProcessed = true;
         updatePayload.payoutAmount = rewardAmount;
      }
      transaction.update(orderRef, updatePayload);

      // 🚀 4. APPLY REWARD IN TRANSACTION
      if (referrerId && rewardAmount > 0) {
        const referrerRef = adminDb.collection("users").doc(referrerId);
        transaction.update(referrerRef, {
          referralBalance: FieldValue.increment(rewardAmount),
          referralCount: FieldValue.increment(1)
        });
      }
    });

    // 🚀 5. TRIGGER META WHATSAPP NOTIFICATION
    if (referrerId && referrerPhone && rewardAmount > 0) {
      const freshReferrer = await adminDb.collection("users").doc(referrerId).get();
      const newBalance = freshReferrer.data()?.referralBalance || rewardAmount;

      NotificationService.notifyPartnerCredit(referrerPhone, rewardAmount, newBalance).catch(console.error);
    }

    return NextResponse.json({ success: "V5_ACTIVE", message: debugMessage }, { status: 200 });

  } catch (error: any) {
    console.error("Status update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update status" }, 
      { status: 500 }
    );
  }
}

// ==========================================
// POST & GET Methods
// ==========================================

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { source, userId, buyerName, contactPhone, location, cartItems } = body;

    if (!cartItems || cartItems.length === 0 || !contactPhone || !buyerName) {
      return NextResponse.json({ error: "Missing required fields or empty cart" }, { status: 400 });
    }

    const orderNumber = `KAB-${Math.floor(1000 + Math.random() * 9000)}`;
    let actualTotalAmount = 0;
    const validatedItems: any[] = [];
    const sellerOrdersMap: Record<string, any> = {};

    await adminDb.runTransaction(async (transaction) => {
      const productDocs = await Promise.all(
        cartItems.map((item: any) => transaction.get(adminDb.collection("products").doc(item.productId || item.id)))
      );

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

        const finalItem = {
          productId: productSnap.id,
          name: product.title || product.name || "Unknown Item",
          price: actualPrice,
          quantity: requestedQty,
          sellerId: product.sellerId || "SYSTEM",
          sellerPhone: product.sellerPhone || "",
          image: product.images?.[0] || "",
          // 🚀 CRITICAL FIX: Save the isAdminUpload tag onto the order item so the payout engine sees it!
          isAdminUpload: product.isAdminUpload === true 
        };
        validatedItems.push(finalItem);

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

        transaction.update(productSnap.ref, {
          stock: FieldValue.increment(-requestedQty),
          locked: true,
          updatedAt: Date.now()
        });
      });

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
