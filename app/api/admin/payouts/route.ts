import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { sendAdminPayoutAlert } from "@/lib/brevo";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const adminId = searchParams.get("adminId");

  if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const adminDoc = await adminDb.collection("users").doc(adminId).get();
    if (!adminDoc.exists || adminDoc.data()?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch all payout requests
    const requestsSnap = await adminDb.collection("payout_requests").orderBy("requestedAt", "desc").get();
    const requests = requestsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ requests }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch payouts:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { adminId, requestId, newStatus } = await req.json();

    if (!adminId || !requestId || !newStatus) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const adminDoc = await adminDb.collection("users").doc(adminId).get();
    if (!adminDoc.exists || adminDoc.data()?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const requestRef = adminDb.collection("payout_requests").doc(requestId);
    
    // 🔥 ATOMIC WALLET DEDUCTION
    await adminDb.runTransaction(async (transaction) => {
      const requestDoc = await transaction.get(requestRef);
      if (!requestDoc.exists) throw new Error("Request not found");
      
      const data = requestDoc.data() as any;
      const sellerId = data.sellerId;
      const amount = Number(data.amount);

      // Idempotency: Prevent double-deducting if already paid
      if (data.status === "paid" && newStatus === "paid") {
        throw new Error("Already paid");
      }

      // If we are changing to "paid", we MUST deduct the wallet safely
      if (newStatus === "paid" && data.status !== "paid") {
        const walletRef = adminDb.collection("wallets").doc(sellerId);
        const walletDoc = await transaction.get(walletRef);
        
        if (walletDoc.exists) {
          const currentAvailable = walletDoc.data()?.availableBalance || 0;
          if (currentAvailable < amount) {
            throw new Error("Insufficient seller funds to process this payout.");
          }
          
          transaction.update(walletRef, {
            availableBalance: FieldValue.increment(-amount),
            totalWithdrawn: FieldValue.increment(amount),
            updatedAt: Date.now()
          });
        }
      }

      // Update the request status
      transaction.update(requestRef, { 
        status: newStatus,
        processedAt: Date.now()
      });

      // Fire off the Ledger Email
      await sendAdminPayoutAlert(requestId, sellerId, amount, newStatus).catch(console.error);
    });

    return NextResponse.json({ message: "Payout updated successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Payout Update Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update" }, { status: 500 });
  }
}
