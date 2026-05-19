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

    // ==========================================
    // 🧹 THE "LAZY REVERT" SECURITY SYSTEM (API)
    // ==========================================
    let finalPrice = Number(price) || 0;
    
    try {
      const productRef = adminDb.collection("products").doc(productId);
      const productSnap = await productRef.get();
      
      if (productSnap.exists) {
        const productData = productSnap.data();
        
        // Check if the item is marked as on sale
        if (productData?.isSale && productData?.saleEndDate) {
          const saleEndDate = new Date(productData.saleEndDate).getTime();
          const now = Date.now();
          
          if (saleEndDate <= now) {
            // 🚨 DEAL EXPIRED! Intercept and secure the price.
            const originalPrice = Number(productData.originalPrice) || Number(productData.price);
            finalPrice = originalPrice; // Force the lead to use the real, restored price
            
            // Silently clean up Firebase in the background
            await productRef.update({
              price: originalPrice,
              originalPrice: FieldValue.delete(), // Using FieldValue to completely remove it
              isSale: false,
              campaignType: FieldValue.delete(),
              saleEndDate: FieldValue.delete()
            });
            console.log(`🧹 API Lazy Revert: Cleaned up expired deal for ${productId}`);
          }
        }
      }
    } catch (dbError) {
      console.error("Error checking product for lazy revert:", dbError);
      // We continue with checkout even if the check fails, to not block sales
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
          price: finalPrice, // 🔥 Uses the secured final price
          quantity: 1,
          sellerId: sellerId || "SYSTEM",
          sellerPhone: sellerPhone || ""
        }
      ],
      // NOTE: buyerPhone and buyerName remain empty until the bot 
      // or admin updates them during the WhatsApp conversation.
      buyerPhone: "", 
      buyerName: "",
      totalAmount: finalPrice, // 🔥 Uses the secured final price
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    // We can also return the finalPrice back to the client so ProductActions knows what actually happened
    return NextResponse.json({ success: true, leadId, actualPrice: finalPrice });

  } catch (error: any) {
    console.error("Lead capture error:", error);
    return NextResponse.json({ error: "Failed to generate lead" }, { status: 500 });
  }
}
