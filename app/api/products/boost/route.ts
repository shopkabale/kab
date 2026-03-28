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

    // SECURITY CHECK 1: Make sure the user actually owns this product
    if (productData.sellerId !== userId) {
      return NextResponse.json({ error: "Unauthorized. You do not own this listing." }, { status: 403 });
    }

    const now = Date.now();

    // SECURITY CHECK 2: Prevent spamming. Is it already actively boosted?
    if (productData.isBoosted && productData.boostExpiresAt && productData.boostExpiresAt > now) {
      return NextResponse.json({ error: "This listing is already boosted!" }, { status: 429 });
    }

    // Set boost expiration for 24 hours from now
    const BOOST_DURATION_MS = 24 * 60 * 60 * 1000; 
    const expiresAt = now + BOOST_DURATION_MS;

    // Update Firestore
    await updateDoc(productRef, {
      isBoosted: true,
      boostedAt: now,          // We will use this to sort the homepage feed
      boostExpiresAt: expiresAt
    });

    return NextResponse.json({ 
      success: true, 
      message: "Listing boosted successfully!",
      boostExpiresAt: expiresAt
    }, { status: 200 });

  } catch (error) {
    console.error("Boost Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
