import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { NotificationService } from "@/lib/notifications"; // 🚀 Upgraded to Meta Template Service
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
    let debugMessage = `Order status updated to ${newStatus}.`; // 🚀 DEBUG TRACKER

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

        // RULE 1: Must contain an official product
        const hasOfficialProduct = items.some((item: any) => item.sellerId === "SYSTEM");

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
              rewardAmount = 300; // Micro-reward for tiny orders
            } else {
              // 10% of cart total, capped at a maximum of 3,000 UGX
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
        const productId = items[0].productId; 
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

      // Use the newly approved Meta Template API
      NotificationService.notifyPartnerCredit(referrerPhone, rewardAmount, newBalance).catch(console.error);
    }

    // Return the specific debug message for the frontend popup
    return NextResponse.json({ success: "V3_ACTIVE", message: debugMessage }, { status: 200 });

  } catch (error: any) {
    console.error("Status update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update status" }, 
      { status: 500 }
    );
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

    // Fetch all orders ordered by creation date
    const ordersSnap = await adminDb.collection("orders")
      .orderBy("createdAt", "desc")
      .get();

    // 🔥 SMART FALLBACK: If total is 0 (WhatsApp orders), fetch the product price dynamically
    const orders = await Promise.all(ordersSnap.docs.map(async (doc) => {
      const data = doc.data();
      let totalAmount = Number(data.total) || 0;

      // If it's a WhatsApp order lacking a total but has a productId, fetch it!
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
