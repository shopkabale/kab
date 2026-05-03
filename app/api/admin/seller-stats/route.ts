import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Source of Truth: Fetch ALL products first
    const productsSnap = await adminDb.collection("products").get();

    const sellerCounts: Record<string, number> = {};
    let totalProducts = 0;

    // 2. Count products strictly by the ID attached to the product document
    productsSnap.docs.forEach((doc) => {
      const data = doc.data();
      const sellerId = data.sellerId;
      if (sellerId) {
        sellerCounts[sellerId] = (sellerCounts[sellerId] || 0) + 1;
        totalProducts++;
      }
    });

    const sellerIds = Object.keys(sellerCounts);
    
    // 3. Fetch the exact profiles for these specific IDs (ignoring the isSeller flag)
    const userPromises = sellerIds.map(id => adminDb.collection("users").doc(id).get());
    const userDocs = await Promise.all(userPromises);

    const sellers = userDocs.map(doc => {
      const productCount = sellerCounts[doc.id] || 0;
      
      if (doc.exists) {
        const userData = doc.data();
        return {
          id: doc.id,
          name: userData?.fullName || userData?.displayName || userData?.name || "Unnamed User",
          phone: userData?.phone || userData?.whatsapp || "No Phone",
          email: userData?.email || "No Email",
          productCount: productCount,
          isOrphan: false
        };
      } else {
        // 🚨 Catches products tied to a deleted or ghost account
        return {
          id: doc.id,
          name: "Deleted/Ghost Account",
          phone: "N/A",
          email: "N/A",
          productCount: productCount,
          isOrphan: true
        };
      }
    });

    // 4. Sort by highest product count
    sellers.sort((a, b) => b.productCount - a.productCount);

    return NextResponse.json({
      success: true,
      totalOwners: sellers.length,
      totalProducts,
      sellers
    }, { status: 200 });

  } catch (error) {
    console.error("Failed to generate inventory audit:", error);
    return NextResponse.json({ error: "Failed to run audit" }, { status: 500 });
  }
}
