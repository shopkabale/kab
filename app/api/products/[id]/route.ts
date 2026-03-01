import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { algoliaIndex } from "@/lib/algolia";

// HANDLE DELETING A PRODUCT
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const docRef = adminDb.collection("products").doc(params.id);
    const doc = await docRef.get();

    if (!doc.exists) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    if (doc.data()?.sellerId !== userId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const publicId = doc.data()?.publicId || params.id;

    // Delete from Firestore
    await docRef.delete();

    // Delete from Algolia Search
    try {
      await algoliaIndex.deleteObject(publicId);
    } catch (err) {
      console.error("Failed to remove from Algolia", err);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

// HANDLE EDITING A PRODUCT
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { userId, title, category, price, condition, description, images, sellerPhone } = body;

    const docRef = adminDb.collection("products").doc(params.id);
    const doc = await docRef.get();

    if (!doc.exists) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    if (doc.data()?.sellerId !== userId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    // Update Firestore
    await docRef.update({
      title,
      name: title, // Backwards compatibility
      category,
      price: Number(price),
      condition,
      description,
      images,
      sellerPhone
    });

    const publicId = doc.data()?.publicId || params.id;

    // Update Algolia Search
    try {
      await algoliaIndex.partialUpdateObject({
        objectID: publicId,
        name: title,
        category,
        price: Number(price),
        image: images && images.length > 0 ? images[0] : "",
      });
    } catch (err) {
      console.error("Failed to update Algolia", err);
    }

    return NextResponse.json({ success: true, publicId });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}