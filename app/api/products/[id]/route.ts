import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { algoliaIndex } from "@/lib/algolia";

// =========================================================
// GET: Fetch a single product (Crucial for pre-filling the Edit form)
// =========================================================
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Check if the ID passed is a publicId (e.g., ELC-0001)
    let docRef;
    const querySnapshot = await adminDb.collection("products").where("publicId", "==", params.id).limit(1).get();

    if (!querySnapshot.empty) {
      docRef = querySnapshot.docs[0];
    } else {
      // Fallback: Try fetching by the standard Firebase document ID
      const standardDoc = await adminDb.collection("products").doc(params.id).get();
      if (standardDoc.exists) docRef = standardDoc;
    }

    if (!docRef) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    return NextResponse.json({ id: docRef.id, ...docRef.data() }, { status: 200 });
  } catch (error) {
    console.error("Error fetching single product:", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

// =========================================================
// PUT: Update an existing product (Full Edit Form)
// =========================================================
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { 
      userId, 
      title, 
      category, 
      price, 
      stock, 
      condition, 
      description, 
      images, 
      sellerPhone,
      isAdminUpload 
    } = body;

    const docRef = adminDb.collection("products").doc(params.id);
    const doc = await docRef.get();

    if (!doc.exists) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    // Security check: Only the original seller OR an Admin can edit
    if (!isAdminUpload && doc.data()?.sellerId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update Firestore
    await docRef.update({
      title,
      name: title, // Backwards compatibility
      category,
      price: Number(price),
      stock: Number(stock), 
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

// =========================================================
// PATCH: Quick Update (Inline Category Editing from Admin Table)
// =========================================================
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { category, adminId } = body;

    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized admin action" }, { status: 401 });
    }
    if (!category) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }

    const docRef = adminDb.collection("products").doc(id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    // Update Firestore
    await docRef.update({ category });

    // Update Algolia Search so the category change reflects in the search bar immediately
    const publicId = docSnap.data()?.publicId || id;
    try {
      await algoliaIndex.partialUpdateObject({
        objectID: publicId,
        category: category
      });
    } catch (algoliaError) {
      console.error("Algolia sync failed during category update:", algoliaError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating product category:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

// =========================================================
// DELETE: Remove a product
// =========================================================
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const isAdmin = searchParams.get("isAdmin") === "true"; 
    const adminId = searchParams.get("adminId"); // NEW: Catching the adminId from the quick-delete table

    const docRef = adminDb.collection("products").doc(params.id);
    const doc = await docRef.get();

    if (!doc.exists) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    // Security check: Only the original seller OR an Admin can delete
    if (!isAdmin && !adminId && doc.data()?.sellerId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

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
