import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin"; // 🔥 Upgraded to Admin SDK for secure transactions
import { FieldValue } from "firebase-admin/firestore";
import { NotificationService } from "@/lib/notifications"; 
import { sendAdminAlert } from "@/lib/brevo"; 

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { transaction_id } = payload; 

    // 1. EXTRACT ID
    if (!transaction_id) {
      return NextResponse.json({ error: "Missing transaction ID" }, { status: 400 });
    }

    // 2. VERIFY TRANSACTION WITH LIVEPAY (Double Protection - Brilliant!)
    const livePayResponse = await fetch("https://livepay.me/api/v1/transaction-status.php", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.LIVEPAY_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        apikey: process.env.LIVEPAY_PUBLIC_KEY,
        transaction_id: transaction_id
      })
    });

    const statusData = await livePayResponse.json();

    // 3. FIND THE MASTER ORDER IN FIRESTORE
    const ordersRef = adminDb.collection("orders");
    const querySnapshot = await ordersRef.where("transactionId", "==", transaction_id).limit(1).get();

    if (querySnapshot.empty) {
      return NextResponse.json({ error: "Order not found for this transaction" }, { status: 404 });
    }

    const orderDoc = querySnapshot.docs[0];
    const orderData = orderDoc.data();
    const orderRef = orderDoc.ref;

    // Idempotency check: If it's already paid, don't fund the wallet again!
    if (orderData.paymentStatus === "paid") {
      console.log(`⚠️ Order ${orderData.orderId} is already paid. Ignoring duplicate webhook.`);
      return NextResponse.json({ message: "Already processed" }, { status: 200 });
    }

    // 4. PROCESS SUCCESSFUL PAYMENT & FUND ESCROW
    if (statusData.status === "success" && statusData.transaction.status === "Success") {
      console.log(`✅ Order ${orderData.orderId} fully paid. Funding Escrow and routing...`);

      // 🔥 ATOMIC TRANSACTION: Update Order & Fund Seller Wallets simultaneously
      await adminDb.runTransaction(async (transaction) => {
        
        // A. Update the Master Order
        transaction.update(orderRef, {
          status: "processing", 
          paymentStatus: "paid", 
          amountPaid: Number(statusData.transaction.amount), 
          paymentCompletedAt: statusData.transaction.completed_at || Date.now(),
          updatedAt: Date.now()
        });

        // B. Deposit funds into Seller Wallets (Pending Escrow)
        if (orderData.sellerOrders && Array.isArray(orderData.sellerOrders)) {
          for (const seller of orderData.sellerOrders) {
            // Safety check: Skip if sellerId is missing or "SYSTEM"
            if (!seller.sellerId || seller.sellerId === "SYSTEM") continue;

            const walletRef = adminDb.collection("wallets").doc(seller.sellerId);
            const walletSnap = await transaction.get(walletRef);

            if (!walletSnap.exists) {
              // Create wallet if it doesn't exist
              transaction.set(walletRef, {
                availableBalance: 0,
                pendingBalance: seller.subtotal,
                totalWithdrawn: 0,
                updatedAt: Date.now()
              });
            } else {
              // Increment pending balance safely
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
        NotificationService.notifyBuyer(
          orderData.buyerPhone, 
          orderData.orderId, 
          allProductsString, 
          orderData.totalAmount
        ).catch(err => console.error("❌ Buyer WhatsApp Error:", err))
      );

      notificationPromises.push(
        sendAdminAlert(
          orderData.orderId, 
          allProductsString, 
          orderData.totalAmount, 
          orderData.buyerPhone, 
          "Multi-Seller Paid Order" 
        ).catch(err => console.error("❌ Admin Email Error:", err))
      );

      if (orderData.sellerOrders && Array.isArray(orderData.sellerOrders)) {
        for (const sellerCut of orderData.sellerOrders) {
          const sellerItemsString = sellerCut.items.map((i: any) => `${i.quantity}x ${i.name}`).join(", ");

          notificationPromises.push(
            NotificationService.notifySeller(
              sellerCut.sellerPhone, 
              "Partner", 
              orderData.orderId, 
              sellerItemsString, 
              sellerCut.subtotal, 
              orderData.buyerName,
              orderData.buyerLocation || "Kabale Town",
              orderData.buyerPhone
            ).catch(err => console.error(`❌ Seller (${sellerCut.sellerPhone}) WhatsApp Error:`, err))
          );
        }
      }

      await Promise.allSettled(notificationPromises);
      console.log("✅ All notifications successfully dispatched.");

      return NextResponse.json({ message: "Webhook verified, order marked Paid, Escrow funded, and routed." }, { status: 200 });

    // 5. PROCESS FAILED PAYMENT
    } else if (statusData.status === "success" && statusData.transaction.status === "Failed") {
      await orderRef.update({
        status: "cancelled",
        paymentStatus: "payment_failed",
        updatedAt: Date.now()
      });

      return NextResponse.json({ message: "Transaction marked as failed" }, { status: 200 });

    // 6. PENDING/INVALID
    } else {
      return NextResponse.json({ message: "Transaction pending or invalid status" }, { status: 400 });
    }

  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
