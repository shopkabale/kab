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
    const { name, category, price, stock, images, storeId } = body;

    if (!name || !category || !price) {
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

      const newProduct: Product = {
        id: newProductRef.id,
        publicId: formattedId,
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""),
        category,
        storeId: storeId || "SYSTEM",
        price: Number(price),
        stock: Number(stock),
        images: images || [],
        createdAt: Date.now(),
      };

      transaction.set(newProductRef, newProduct);
      return formattedId;
    });

    // === NEW: Sync to Algolia ===
    // We only send the data necessary for search to keep Algolia costs low
    try {
      await algoliaIndex.saveObject({
        objectID: publicId, // Algolia requires an objectID
        name,
        category,
        price: Number(price),
        image: images && images.length > 0 ? images[0] : "",
      });
    } catch (algoliaError) {
      console.error("Failed to sync to Algolia:", algoliaError);
      // We don't fail the whole request if Algolia fails, the product is already in the database
    }

    return NextResponse.json({ success: true, publicId }, { status: 201 });

  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}