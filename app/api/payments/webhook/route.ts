import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/config"; 
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from "firebase/firestore";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { transaction_id } = payload; 

    // 1. EXTRACT ID (Ignore everything else in the payload)
    if (!transaction_id) {
      return NextResponse.json({ error: "Missing transaction ID" }, { status: 400 });
    }

    // 2. THE DOUBLE PROTECTION: Call LivePay's Transaction Status API
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

    // 3. VERIFY SUCCESS STATUS
    if (statusData.status === "success" && statusData.transaction.status === "Success") {
      
      // Find the pending order in Firestore using the transaction_id
      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, where("transactionId", "==", transaction_id));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // We found the order, now update it!
        const orderDoc = querySnapshot.docs[0];
        const orderRef = doc(db, "orders", orderDoc.id);

        await updateDoc(orderRef, {
          status: "confirmed_processing",
          depositPaid: true,
          amountPaid: Number(statusData.transaction.amount), 
          paymentCompletedAt: statusData.transaction.completed_at || serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // Return a 200 OK so LivePay knows we received it
        return NextResponse.json({ message: "Webhook verified and order updated" }, { status: 200 });
      } else {
        // Order not found in DB
        return NextResponse.json({ error: "Order not found for this transaction" }, { status: 404 });
      }
      
    } else if (statusData.status === "success" && statusData.transaction.status === "Failed") {
      
      // Optional: Handle explicitly failed transactions
      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, where("transactionId", "==", transaction_id));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const orderDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, "orders", orderDoc.id), {
          status: "payment_failed",
          updatedAt: serverTimestamp()
        });
      }

      return NextResponse.json({ message: "Transaction marked as failed" }, { status: 200 });

    } else {
      // Transaction is pending or invalid
      return NextResponse.json({ message: "Transaction pending or invalid status" }, { status: 400 });
    }

  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
