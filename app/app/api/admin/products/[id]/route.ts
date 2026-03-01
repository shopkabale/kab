import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { algoliaIndex } from "@/lib/algolia";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get("adminId");

    // 1. Verify Admin Status
    if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const adminDoc = await adminDb.collection("users").doc(adminId).get();
    if (adminDoc.data()?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // 2. Find Product
    const docRef = adminDb.collection("products").doc(params.id);
    const doc = await docRef.get();
    if (!doc.exists) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const publicId = doc.data()?.publicId || params.id;

    // 3. Delete from Firestore & Algolia
    await docRef.delete();
    try {
      await algoliaIndex.deleteObject(publicId);
    } catch (err) {
      console.error("Failed to remove from Algolia", err);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error force-deleting product:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}