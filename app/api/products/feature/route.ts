import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, userId } = body;

    if (!productId || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const productRef = doc(db, "products", productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const productData = productSnap.data();

    // SECURITY CHECK 1: Ownership
    if (productData.sellerId !== userId) {
      return NextResponse.json({ error: "Unauthorized. You do not own this listing." }, { status: 403 });
    }

    const now = Date.now();

    // SECURITY CHECK 2: Prevent overlapping features
    if (productData.isFeatured && productData.featureExpiresAt && productData.featureExpiresAt > now) {
      return NextResponse.json({ error: "This listing is already featured!" }, { status: 429 });
    }

    // Set feature expiration for 7 days from now
    const FEATURE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; 
    const expiresAt = now + FEATURE_DURATION_MS;

    // Update Firestore
    await updateDoc(productRef, {
      isFeatured: true,
      featuredAt: now,
      featureExpiresAt: expiresAt
    });

    return NextResponse.json({ 
      success: true, 
      message: "Listing featured successfully for 7 days!",
      featureExpiresAt: expiresAt
    }, { status: 200 });

  } catch (error) {
    console.error("Feature Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
