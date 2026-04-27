import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin"; 
import { FieldValue } from "firebase-admin/firestore";
import { NotificationService } from "@/lib/notifications"; 
import { sendAdminAlert } from "@/lib/brevo"; 

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    
    // LivePay's webhook should send back the reference you originally sent them
    const incomingReference = payload.reference || payload.customer_reference; 

    if (!incomingReference) {
      return NextResponse.json({ error: "Missing transaction reference" }, { status: 400 });
    }

    // 1. VERIFY TRANSACTION WITH LIVEPAY (V2 GET Request)
    const url = `https://livepay.me/api/transaction-status?accountNumber=${process.env.LIVEPAY_ACCOUNT_NUMBER}&currency=UGX&reference=${incomingReference}`;
    
    const livePayResponse = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${process.env.LIVEPAY_API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    const rawResponseText = await livePayResponse.text();
    let statusData;
    try {
      statusData = JSON.parse(rawResponseText);
    } catch (err) {
      console.error("Webhook verification failed (HTML Returned):", rawResponseText);
      return NextResponse.json({ error: "Gateway verification error" }, { status: 502 });
    }

    // 2. FIND THE MASTER ORDER IN FIRESTORE
    const ordersRef = adminDb.collection("orders");
    const querySnapshot = await ordersRef.where("referenceId", "==", incomingReference).limit(1).get();

    if (querySnapshot.empty) {
      return NextResponse.json({ error: "Order not found for this reference" }, { status: 404 });
    }

    const orderDoc = querySnapshot.docs[0];
    const orderData = orderDoc.data();
    const orderRef = orderDoc.ref;

    if (orderData.paymentStatus === "paid") {
      console.log(`⚠️ Order ${orderData.orderId} is already paid. Ignoring duplicate webhook.`);
      return NextResponse.json({ message: "Already processed" }, { status: 200 });
    }

    // 3. PROCESS SUCCESSFUL PAYMENT
    // Checking the V2 documentation format: statusData.status === "Success"
    if (statusData.success === true && statusData.status === "Success") {
      console.log(`✅ Order ${orderData.orderId} fully paid. Funding Escrow and routing...`);

      await adminDb.runTransaction(async (transaction) => {
        transaction.update(orderRef, {
          status: "processing", 
          paymentStatus: "paid", 
          amountPaid: Number(statusData.amount), 
          paymentCompletedAt: statusData.completed_at || Date.now(),
          updatedAt: Date.now()
        });

        if (orderData.sellerOrders && Array.isArray(orderData.sellerOrders)) {
          for (const seller of orderData.sellerOrders) {
            if (!seller.sellerId || seller.sellerId === "SYSTEM") continue;

            const walletRef = adminDb.collection("wallets").doc(seller.sellerId);
            const walletSnap = await transaction.get(walletRef);

            if (!walletSnap.exists) {
              transaction.set(walletRef, {
                availableBalance: 0,
                pendingBalance: seller.subtotal,
                totalWithdrawn: 0,
                updatedAt: Date.now()
              });
            } else {
              transaction.update(walletRef, {
                pendingBalance: FieldValue.increment(seller.subtotal),
                updatedAt: Date.now()
              });
            }
          }
        }
      });

      // ==========================================
      // 🚀 MULTI-SELLER NOTIFICATION ROUTING
      // ==========================================
      const notificationPromises: Promise<any>[] = [];
      const allProductsString = orderData.cartItems.map((item: any) => `${item.quantity}x ${item.name}`).join(", ");

      notificationPromises.push(
        NotificationService.notifyBuyer(orderData.buyerPhone, orderData.orderId, allProductsString, orderData.totalAmount).catch(() => {})
      );
      notificationPromises.push(
        sendAdminAlert(orderData.orderId, allProductsString, orderData.totalAmount, orderData.buyerPhone, "Multi-Seller Paid Order").catch(() => {})
      );

      if (orderData.sellerOrders && Array.isArray(orderData.sellerOrders)) {
        for (const sellerCut of orderData.sellerOrders) {
          const sellerItemsString = sellerCut.items.map((i: any) => `${i.quantity}x ${i.name}`).join(", ");
          notificationPromises.push(
            NotificationService.notifySeller(sellerCut.sellerPhone, "Partner", orderData.orderId, sellerItemsString, sellerCut.subtotal, orderData.buyerName, orderData.buyerLocation || "Kabale Town", orderData.buyerPhone).catch(() => {})
          );
        }
      }

      await Promise.allSettled(notificationPromises);
      return NextResponse.json({ message: "Webhook verified, Escrow funded." }, { status: 200 });

    // 4. PROCESS FAILED PAYMENT
    } else if (statusData.success === true && (statusData.status === "Failed" || statusData.status === "Cancelled")) {
      await orderRef.update({
        status: "cancelled",
        paymentStatus: "payment_failed",
        updatedAt: Date.now()
      });
      return NextResponse.json({ message: "Transaction marked as failed" }, { status: 200 });

    // 5. PENDING
    } else {
      return NextResponse.json({ message: "Transaction still pending" }, { status: 400 });
    }

  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
