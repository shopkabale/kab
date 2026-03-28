import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(req: Request) {
  try {
    const { productId, userId } = await req.json();

    if (!productId || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const productRef = adminDb.collection("products").doc(productId);
    const docSnap = await productRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const data = docSnap.data();

    if (data?.sellerId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const now = Date.now();
    
    if (data?.isFeatured && data.featureExpiresAt > now) {
      return NextResponse.json({ error: "Listing is already featured" }, { status: 429 });
    }

    const expiresAt = now + (7 * 24 * 60 * 60 * 1000);

    await productRef.update({
      isFeatured: true,
      featuredAt: now,
      featureExpiresAt: expiresAt
    });

    return NextResponse.json({ success: true, featureExpiresAt: expiresAt }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
