import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { Product } from "@/types";
import { algoliaIndex } from "@/lib/algolia";

const getCategoryPrefix = (category: string) => {
  switch (category) {
    case "electronics": return "ELC";
    case "agriculture": return "AGR";
    case "student_item": return "STD";
    default: return "GEN";
  }
};

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