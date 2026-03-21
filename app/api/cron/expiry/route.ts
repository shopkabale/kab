// app/api/cron/expiry/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { sendExpiryNotification } from "@/lib/brevo";

export const dynamic = 'force-dynamic'; // Ensures Vercel doesn't cache this route

export async function GET(request: Request) {
  // 1. Secure the route using the Vercel CRON_SECRET environment variable
  const authHeader = request.headers.get('authorization');
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. Calculate the cutoff time (36 hours ago)
    const THIRTY_SIX_HOURS = 36 * 60 * 60 * 1000;
    const cutoffTime = Date.now() - THIRTY_SIX_HOURS;

    // 3. Query pending orders older than 36 hours
    const expiredOrdersSnap = await adminDb.collection("orders")
      .where("status", "==", "pending")
      .where("createdAt", "<", cutoffTime)
      .get();

    if (expiredOrdersSnap.empty) {
      return NextResponse.json({ message: "No expired orders found" }, { status: 200 });
    }

    const batch = adminDb.batch();
    const emailsToSend: Array<{ email: string; name: string; orderNumber: string }> = [];

    // 4. Process each expired order
    expiredOrdersSnap.docs.forEach(doc => {
      const orderData = doc.data();
      const orderRef = doc.ref;
      
      // Safety check in case items array is malformed
      if (!orderData.items || !orderData.items[0]) return;
      
      const productId = orderData.items[0].productId;
      const productRef = adminDb.collection("products").doc(productId);

      // Cancel Order
      batch.update(orderRef, { 
        status: "cancelled", 
        updatedAt: Date.now(),
        cancelReason: "auto_expired"
      });

      // Restore Product Stock & Unlock
      batch.update(productRef, {
        stock: FieldValue.increment(1),
        locked: false,
        status: "available",
        updatedAt: Date.now()
      });

      // Queue Email if buyer provided one
      if (orderData.buyerEmail) {
        emailsToSend.push({
          email: orderData.buyerEmail,
          name: orderData.buyerName || "Valued Customer",
          orderNumber: orderData.orderNumber
        });
      }
    });

    // 5. Commit all database updates atomically
    await batch.commit();

    // 6. Send notification emails concurrently
    if (emailsToSend.length > 0) {
      await Promise.allSettled(
        emailsToSend.map(user => 
          sendExpiryNotification(user.email, user.name, user.orderNumber)
        )
      );
    }

    return NextResponse.json({ 
      success: true, 
      processed: expiredOrdersSnap.size 
    }, { status: 200 });

  } catch (error) {
    console.error("Cron expiry error:", error);
    return NextResponse.json({ error: "Failed to process expiries" }, { status: 500 });
  }
}
