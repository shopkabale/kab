// app/api/payments/webhook/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/config"; 
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from "firebase/firestore";
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

    // 2. VERIFY TRANSACTION WITH LIVEPAY (Double Protection)
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
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, where("transactionId", "==", transaction_id));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ error: "Order not found for this transaction" }, { status: 404 });
    }

    const orderDoc = querySnapshot.docs[0];
    const orderData = orderDoc.data();
    const orderRef = doc(db, "orders", orderDoc.id);

    // 4. PROCESS SUCCESSFUL PAYMENT
    if (statusData.status === "success" && statusData.transaction.status === "Success") {

      // Update the Master Order schema for 100% Full Payment
      await updateDoc(orderRef, {
        status: "processing", 
        paymentStatus: "paid", 
        amountPaid: Number(statusData.transaction.amount), 
        paymentCompletedAt: statusData.transaction.completed_at || serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log(`✅ Order ${orderData.orderId} fully paid. Triggering multi-seller routing...`);

      // ==========================================
      // 🚀 MULTI-SELLER NOTIFICATION ROUTING
      // ==========================================
      const notificationPromises: Promise<any>[] = [];

      // A. Build a consolidated product string for the Buyer & Admin summaries
      const allProductsString = orderData.cartItems.map((item: any) => `${item.quantity}x ${item.name}`).join(", ");

      // B. Notify the Buyer (One clean summary message matching notify_buyer_02)
      notificationPromises.push(
        NotificationService.notifyBuyer(
          orderData.buyerPhone, 
          orderData.orderId, 
          allProductsString, 
          orderData.totalAmount
        ).catch(err => console.error("❌ Buyer WhatsApp Error:", err))
      );

      // C. Notify the Admin via Brevo
      notificationPromises.push(
        sendAdminAlert(
          orderData.orderId, 
          allProductsString, 
          orderData.totalAmount, 
          orderData.buyerPhone, 
          "Multi-Seller Paid Order" 
        ).catch(err => console.error("❌ Admin Email Error:", err))
      );

      // D. Notify EACH Seller with strictly their own items
      if (orderData.sellerOrders && Array.isArray(orderData.sellerOrders)) {
        for (const sellerCut of orderData.sellerOrders) {
          // Format just the items this specific seller is responsible for
          const sellerItemsString = sellerCut.items.map((i: any) => `${i.quantity}x ${i.name}`).join(", ");
          
          notificationPromises.push(
            NotificationService.notifySeller(
              sellerCut.sellerPhone, 
              "Partner", // Or sellerCut.sellerName if you store it
              orderData.orderId, 
              sellerItemsString, 
              sellerCut.subtotal, 
              orderData.buyerName,
              orderData.buyerLocation || "Kabale Town", // Fallback if location isn't provided
              orderData.buyerPhone
            ).catch(err => console.error(`❌ Seller (${sellerCut.sellerPhone}) WhatsApp Error:`, err))
          );
        }
      }

      // E. Execute all notifications concurrently
      await Promise.allSettled(notificationPromises);
      console.log("✅ All notifications successfully dispatched.");

      return NextResponse.json({ message: "Webhook verified, order marked Paid, and routed." }, { status: 200 });

    // 5. PROCESS FAILED PAYMENT
    } else if (statusData.status === "success" && statusData.transaction.status === "Failed") {
      await updateDoc(orderRef, {
        status: "cancelled",
        paymentStatus: "payment_failed",
        updatedAt: serverTimestamp()
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
