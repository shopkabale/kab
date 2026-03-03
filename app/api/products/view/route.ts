import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: Request) {
  try {
    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json({ error: "Missing Product ID" }, { status: 400 });
    }

    // Increment the view count safely using the Admin SDK
    await adminDb.collection("products").doc(productId).update({
      views: FieldValue.increment(1)
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to increment product views:", error);
    return NextResponse.json({ error: "Failed to update views" }, { status: 500 });
  }
}