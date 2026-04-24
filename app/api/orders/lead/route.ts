import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { cookies } from "next/headers"; // 🚀 Added to read the referral cookie

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, productName, sellerId, sellerPhone, price } = body;

    if (!productId) {
      return NextResponse.json({ error: "Missing product ID" }, { status: 400 });
    }

    // 🚀 READ REFERRAL COOKIE
    // We grab the kabale_ref cookie to track guest buyers
    const cookieStore = cookies();
    const refCookie = cookieStore.get("kabale_ref");
    const referralCodeUsed = refCookie ? refCookie.value : null;

    // Generate a unique Lead Reference
    const leadId = `LEAD-${Math.floor(10000 + Math.random() * 90000)}`;
    const leadRef = adminDb.collection("orders").doc(leadId);

    // Save a skeleton Master Order
    await leadRef.set({
      orderId: leadId,
      source: "whatsapp",
      paymentMode: "COD",
      status: "lead", // 🔥 Special status for pre-chat clicks
      paymentStatus: "pending",
      referralCodeUsed: referralCodeUsed, // 🚀 INJECTED: Connects guest buyer to referrer
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
      // We don't know the buyer's name or phone yet! 
      // The bot will update these fields when they send the message.
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
