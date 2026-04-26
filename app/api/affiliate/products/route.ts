import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 10;
    const offset = (page - 1) * limit;

    // 🚀 Only fetch official products (isAdminUpload == true)
    const productsSnap = await adminDb.collection("products")
      .where("isAdminUpload", "==", true)
      .where("status", "==", "active")
      .orderBy("createdAt", "desc")
      .offset(offset)
      .limit(limit)
      .get();

    const products = productsSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        publicId: data.publicId || doc.id,
        name: data.title || data.name || "Unknown Product",
        price: Number(data.price) || 0,
        image: data.images?.[0] || "https://via.placeholder.com/150",
      };
    });

    return NextResponse.json({ products, page, hasMore: products.length === limit }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch promotable products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
