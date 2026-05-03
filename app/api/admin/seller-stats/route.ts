import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

// Force Next.js to always fetch fresh data for this route
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Fetch all active products
    const productsSnap = await adminDb.collection("products").get();

    // 2. Tally up products by their sellerId
    const sellerCounts: Record<string, number> = {};
    let totalProducts = 0;

    productsSnap.docs.forEach((doc) => {
      const data = doc.data();
      const sellerId = data.sellerId;
      if (sellerId) {
        sellerCounts[sellerId] = (sellerCounts[sellerId] || 0) + 1;
        totalProducts++;
      }
    });

    // 3. Fetch all registered sellers
    const usersSnap = await adminDb.collection("users").where("isSeller", "==", true).get();
    
    const sellers = usersSnap.docs.map((doc) => {
      const userData = doc.data();
      const productCount = sellerCounts[doc.id] || 0; // Get tally or default to 0
      
      return {
        id: doc.id,
        name: userData.fullName || userData.displayName || userData.name || "Unknown Seller",
        phone: userData.phone || userData.whatsapp || "No Phone",
        email: userData.email || "No Email",
        productCount: productCount,
      };
    });

    // 4. Sort sellers by who has the most products (Descending)
    sellers.sort((a, b) => b.productCount - a.productCount);

    return NextResponse.json({
      success: true,
      totalSellers: sellers.length,
      totalProducts,
      sellers
    }, { status: 200 });

  } catch (error) {
    console.error("Failed to generate seller stats:", error);
    return NextResponse.json({ error: "Failed to generate statistics" }, { status: 500 });
  }
}
