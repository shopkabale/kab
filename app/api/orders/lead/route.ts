import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // 🚀 UPDATED: Destructure referralCodeUsed from the body (sent by ProductActions)
    const { productId, productName, sellerId, sellerPhone, price, referralCodeUsed: bodyRef } = body;

    if (!productId) {
      return NextResponse.json({ error: "Missing product ID" }, { status: 400 });
    }

    // 🚀 SMART REFERRAL CAPTURE
    // 1. Try the code from the body (Direct from ProductActions)
    // 2. Fallback to the cookie (Backup for guest buyers)
    const cookieStore = cookies();
    const refCookie = cookieStore.get("kabale_ref");
    const referralCodeUsed = bodyRef || (refCookie ? refCookie.value : null);

    // Generate a unique Lead Reference
    const leadId = `LEAD-${Math.floor(10000 + Math.random() * 90000)}`;
    const leadRef = adminDb.collection("orders").doc(leadId);

    // Save a skeleton Master Order
    await leadRef.set({
      orderId: leadId,
      source: "whatsapp",
      paymentMode: "COD",
      status: "lead", // Special status for pre-chat clicks
      paymentStatus: "pending",
      referralCodeUsed: referralCodeUsed, // 🚀 CONNECTED
      cartItems: [
        {
          productId,
          name: productName || "Unknown Item",
          price: Number(price) || 0,
          quantity: 1,
          sellerId: sellerId || "SYSTEM",
          sellerPhone: sellerPhone || ""
        }
      ],
      // NOTE: buyerPhone and buyerName remain empty until the bot 
      // or admin updates them during the WhatsApp conversation.
      buyerPhone: "", 
      buyerName: "",
      totalAmount: Number(price) || 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    return NextResponse.json({ success: true, leadId });

  } catch (error: any) {
    console.error("Lead capture error:", error);
    return NextResponse.json({ error: "Failed to generate lead" }, { status: 500 });
  }
}
