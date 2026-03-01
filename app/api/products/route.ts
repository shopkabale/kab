import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { Product } from "@/types";
import { algoliaIndex } from "@/lib/algolia";

// Forces Next.js to evaluate this API route dynamically at runtime
export const dynamic = "force-dynamic";

const getCategoryPrefix = (category: string) => {
  switch (category) {
    case "electronics": return "ELC";
    case "agriculture": return "AGR";
    case "student_item": return "STD";
    default: return "GEN";
  }
};

// =========================================================
// GET: Fetch products for the Marketplace and Admin Dashboard
// =========================================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    
    let query: FirebaseFirestore.Query = adminDb.collection("products");
    
    if (category) {
      query = query.where("category", "==", category);
    }
    
    query = query.orderBy("createdAt", "desc").limit(50);
    const snapshot = await query.get();
    
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ products }, { status: 200 });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

// =========================================================
// POST: Create a new product (Your existing code)
// =========================================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      title, // Using title to match your new spec
      category, 
      price, 
      condition,
      description,
      images, 
      sellerId,
      sellerName,
      sellerPhone 
    } = body;

    if (!title || !category || !price) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const prefix = getCategoryPrefix(category);
    const counterRef = adminDb.collection("counters").doc(`product_${prefix}`);
    const newProductRef = adminDb.collection("products").doc();

    const publicId = await adminDb.runTransaction(async (transaction) => {
      const counterDoc = await transaction.get(counterRef);

      let nextSeq = 1;
      if (counterDoc.exists) {
        nextSeq = (counterDoc.data()?.seq || 0) + 1;
      }

      const formattedId = `${prefix}-${nextSeq.toString().padStart(4, "0")}`;

      transaction.set(counterRef, { seq: nextSeq }, { merge: true });

      // Build the product using your exact new MVP schema
      const newProduct = {
        id: newProductRef.id,
        publicId: formattedId,
        name: title, // Keeping 'name' for backwards compatibility, but mapped from 'title'
        title: title,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""),
        category,
        price: Number(price),
        condition: condition || "used",
        description: description || "",
        images: images || [],
        sellerId: sellerId || "SYSTEM",
        sellerName: sellerName || "Anonymous",
        sellerPhone: sellerPhone || "",
        status: "active", // AUTO-PUBLISH: Skips admin verification
        views: 0,
        stock: 1, // Defaulting to 1 for individual items
        createdAt: Date.now(),
      };

      transaction.set(newProductRef, newProduct);
      return formattedId;
    });

    // Sync to Algolia for instant search
    try {
      await algoliaIndex.saveObject({
        objectID: publicId,
        name: title,
        category,
        price: Number(price),
        image: images && images.length > 0 ? images[0] : "",
      });
    } catch (algoliaError) {
      console.error("Failed to sync to Algolia:", algoliaError);
    }

    return NextResponse.json({ success: true, publicId }, { status: 201 });

  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}