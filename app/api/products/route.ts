import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { algoliaIndex } from "@/lib/algolia";

export const dynamic = "force-dynamic";

// =========================================================
// HYBRID CATEGORY PREFIXES (For SKU/Public ID Generation)
// =========================================================
const getCategoryPrefix = (category: string) => {
  switch (category) {
    // Campus & Tech
    case "bundles": return "BND";
    case "student_essentials": return "HOS"; 
    case "student_item": return "STD"; // Legacy fallback
    case "groceries": return "GRO";
    case "stationery": return "STA";
    case "electronics": return "ELC";
    case "services": return "SRV";
    
    // General Store
    case "official_store": return "OFF";
    case "ladies_picks": return "LAD";
    case "beauty": return "BTY";
    case "watches": return "WAT";
    case "gifts": return "GFT";
    case "agriculture": return "AGR";
    
    default: return "GEN";
  }
};

// =========================================================
// GET: Fetch products with Pagination Support
// =========================================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const cursor = searchParams.get("cursor"); // Catch the pagination cursor
    const limitParam = searchParams.get("limit");

    // Default to 50 if no limit is provided, otherwise use the requested limit
    const limitVal = limitParam ? parseInt(limitParam, 10) : 50;

    let query: FirebaseFirestore.Query = adminDb.collection("products");

    if (category) {
      query = query.where("category", "==", category);
    }

    // Must order by createdAt to paginate properly
    query = query.orderBy("createdAt", "desc");

    // If a cursor is provided, start the query AFTER that specific document
    if (cursor) {
      const cursorDoc = await adminDb.collection("products").doc(cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    query = query.limit(limitVal);
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
// POST: Create a new product (Secure Admin/Seller Upload)
// =========================================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      title, 
      category, 
      price, 
      condition,
      description,
      metaDescription, 
      images, 
      sellerId,
      sellerName,
      sellerPhone,
      stock,          
      isAdminUpload,
      
      // NEW LOGISTICS FIELDS
      isPrepaymentMandatory,
      estimatedDelivery
    } = body;

    if (!title || !category || !price) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const priceNum = Number(price);
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

      const newProduct = {
        id: newProductRef.id,
        publicId: formattedId,
        name: title, 
        title: title,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""),
        category,
        price: priceNum,
        condition: condition || "used",
        description: description || "",
        metaDescription: metaDescription || "", 
        images: images || [],
        sellerId: sellerId || "SYSTEM",
        sellerName: sellerName || "Anonymous",
        sellerPhone: sellerPhone || "",
        status: "active", 
        views: 0,
        stock: stock !== undefined ? Number(stock) : 1, 
        isAdminUpload: isAdminUpload || false,          
        
        // 🔒 SECURE LOGISTICS & PAYMENT LOGIC (Server-Side Enforced)
        isPrepaymentMandatory: priceNum >= 40000 ? true : (isPrepaymentMandatory || false),
        estimatedDelivery: estimatedDelivery || "Same Day (Kabale)",

        createdAt: Date.now(),
      };

      transaction.set(newProductRef, newProduct);
      return formattedId;
    });

    try {
      await algoliaIndex.saveObject({
        objectID: publicId,
        name: title,
        category,
        price: priceNum,
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
