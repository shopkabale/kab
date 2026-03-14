import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin"; 

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { transaction_id, tx_ref } = body;

    if (!transaction_id || !tx_ref) {
      return NextResponse.json({ error: "Missing transaction parameters" }, { status: 400 });
    }

    // 1. Ask Flutterwave to verify the transaction ID
    const flwResponse = await fetch(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`, 
        "Content-Type": "application/json",
      },
    });

    const flwData = await flwResponse.json();

    // Check if the API call succeeded AND the payment was successful
    if (flwData.status !== "success" || flwData.data.status !== "successful") {
      return NextResponse.json({ error: "Payment verification failed at Flutterwave" }, { status: 400 });
    }

    const transaction = flwData.data;

    // 2. Fetch the pending payment record from our database using tx_ref
    const paymentDocRef = adminDb.collection("payments").doc(tx_ref);
    const paymentDoc = await paymentDocRef.get();

    if (!paymentDoc.exists) {
      return NextResponse.json({ error: "Payment record not found in database" }, { status: 404 });
    }

    const paymentData = paymentDoc.data();

    // Prevent double-processing if the user refreshes the page
    if (paymentData?.status === "successful") {
      return NextResponse.json({ success: true, message: "Payment was already processed" });
    }

    // 3. Validate Amount & Currency to prevent fraud
    if (transaction.amount < paymentData?.amount || transaction.currency !== paymentData?.currency) {
      return NextResponse.json({ error: "Amount or currency mismatch detected" }, { status: 400 });
    }

    // 4. Perform atomic Firestore updates using Batch Writes
    const batch = adminDb.batch();

    // Mark the payment as successful and save the Flutterwave transaction ID
    batch.update(paymentDocRef, {
      status: "successful",
      transactionId: transaction.id.toString(),
    });

    const now = Date.now();

    // ---------------------------------------------------------
    // 5. Handle the Different Payment Logic Paths
    // ---------------------------------------------------------

    // A. STORE SUBSCRIPTION
    if (paymentData?.paymentType === "store_subscription") {
      const storeId = paymentData.referenceId;
      const storeRef = adminDb.collection("stores").doc(storeId);
      
      const thirtyDaysInMillis = 30 * 24 * 60 * 60 * 1000; 
      
      batch.update(storeRef, {
        isApproved: true,
        expiresAt: now + thirtyDaysInMillis,
      });

      const userRef = adminDb.collection("users").doc(paymentData.userId);
      batch.update(userRef, {
        role: "vendor",
      });
    }
    
    // B. FEATURED LISTING
    else if (paymentData?.paymentType === "featured_listing") {
      const productId = paymentData.referenceId;
      const productRef = adminDb.collection("products").doc(productId);
      
      const sevenDaysInMillis = 7 * 24 * 60 * 60 * 1000;

      batch.update(productRef, {
        featured: true,
        featuredUntil: now + sevenDaysInMillis,
      });
    }

    // C. URGENT LISTING
    else if (paymentData?.paymentType === "urgent_listing") {
      const productId = paymentData.referenceId;
      const productRef = adminDb.collection("products").doc(productId);
      
      const threeDaysInMillis = 3 * 24 * 60 * 60 * 1000;

      batch.update(productRef, {
        urgent: true,
        urgentUntil: now + threeDaysInMillis,
      });
    }

    // ---------------------------------------------------------
    // 6. Commit all changes to Firestore at once
    // ---------------------------------------------------------
    await batch.commit();

    let successMessage = "Payment verified successfully.";
    if (paymentData?.paymentType === "store_subscription") successMessage = "Store activated successfully!";
    if (paymentData?.paymentType === "featured_listing") successMessage = "Your item is now Featured!";
    if (paymentData?.paymentType === "urgent_listing") successMessage = "Your item is now marked Urgent!";

    return NextResponse.json({ success: true, message: successMessage });

  } catch (error) {
    console.error("Payment Verification Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
