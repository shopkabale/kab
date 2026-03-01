import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { Product } from "@/types";

// Helper to map categories to their short codes
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
    const newProductRef = adminDb.collection("products").doc(); // Standard Firebase ID

    // We use a transaction to safely increment the counter and save the product
    const publicId = await adminDb.runTransaction(async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      
      let nextSeq = 1;
      if (counterDoc.exists) {
        nextSeq = (counterDoc.data()?.seq || 0) + 1;
      }

      // Format to 4 digits: ELC-0001
      const formattedId = `${prefix}-${nextSeq.toString().padStart(4, "0")}`;

      // Set the new counter
      transaction.set(counterRef, { seq: nextSeq }, { merge: true });

      // Create the product
      const newProduct: Product = {
        id: newProductRef.id,
        publicId: formattedId,
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""),
        category,
        storeId: storeId || "SYSTEM", // Placeholder until we link full vendor stores
        price: Number(price),
        stock: Number(stock),
        images: images || [],
        createdAt: Date.now(),
      };

      transaction.set(newProductRef, newProduct);
      return formattedId;
    });

    return NextResponse.json({ success: true, publicId }, { status: 201 });

  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}