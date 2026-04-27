import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin"; 
import { FieldValue } from "firebase-admin/firestore";
import { NotificationService } from "@/lib/notifications"; 
import { sendAdminAlert } from "@/lib/brevo"; 

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    
    // LivePay's V2 webhook sends back the reference you originally provided
    const incomingReference = payload.reference || payload.customer_reference; 

    if (!incomingReference) {
      return NextResponse.json({ error: "Missing transaction reference" }, { status: 400 });
    }

    // 1. VERIFY TRANSACTION WITH LIVEPAY (V2 GET Request with Cloudflare Bypass Headers)
    const url = `https://livepay.me/api/transaction-status?accountNumber=${process.env.LIVEPAY_ACCOUNT_NUMBER}&currency=UGX&reference=${incomingReference}`;
    
    const livePayResponse = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${process.env.LIVEPAY_API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "application/json", // 🔥 Tells Cloudflare we expect API data
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36" // 🔥 Bypasses Cloudflare bot detection
      }
    });

    // 🔥 SAFE JSON PARSING: Catch HTML errors if LivePay's gateway crashes
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

    // Idempotency check: If it's already paid, don't fund the wallet again!
    if (orderData.paymentStatus === "paid") {
      console.log(`⚠️ Order ${orderData.orderId} is already paid. Ignoring duplicate webhook.`);
      return NextResponse.json({ message: "Already processed" }, { status: 200 });
    }

    // 3. PROCESS SUCCESSFUL PAYMENT
    // Checking the V2 documentation format: statusData.success === true && statusData.status === "Success"
    if (statusData.success === true && statusData.status === "Success") {
      console.log(`✅ Order ${orderData.orderId} fully paid. Funding Escrow and routing...`);

      // 🔥 ATOMIC TRANSACTION: Update Order & Fund Seller Wallets simultaneously
      await adminDb.runTransaction(async (transaction) => {
        
        // A. Update the Master Order
        transaction.update(orderRef, {
          status: "processing", 
          paymentStatus: "paid", 
          amountPaid: Number(statusData.amount), 
          paymentCompletedAt: statusData.completed_at || Date.now(),
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

    // 5. PENDING / UNKNOWN
    } else {
      return NextResponse.json({ message: "Transaction still pending or unknown status" }, { status: 400 });
    }

  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
