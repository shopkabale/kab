import { adminDb } from "./admin";
import { Product } from "@/types";

// --- DATA ADAPTER ---
function parseProduct(doc: FirebaseFirestore.DocumentSnapshot): Product {
  const data = doc.data() || {};

  let parsedCreatedAt = Date.now();
  if (data.createdAt) {
    if (typeof data.createdAt === 'number') {
      parsedCreatedAt = data.createdAt;
    } else if (data.createdAt.toDate) {
      parsedCreatedAt = data.createdAt.toDate().getTime();
    } else if (data.createdAt._seconds) {
      parsedCreatedAt = data.createdAt._seconds * 1000;
    }
  }

  let parsedImages: string[] = [];
  if (Array.isArray(data.images) && data.images.length > 0) {
    parsedImages = data.images;
  } else if (Array.isArray(data.imageUrls) && data.imageUrls.length > 0) {
    parsedImages = data.imageUrls;
  } else if (typeof data.image === 'string' && data.image) {
    parsedImages = [data.image];
  }

  return {
    id: doc.id,
    publicId: data.publicId || "",
    name: data.name || data.title || "Unnamed Item",
    slug: data.slug || "item",
    category: data.category || "general",
    price: Number(data.price) || 0,
    stock: Number(data.stock) || Number(data.quantity) || 1,
    images: parsedImages,
    createdAt: parsedCreatedAt,

    // --- NEW MAPPED FIELDS ---
    condition: data.condition || "used",
    description: data.description || "",
    // Fallback to older nested 'seller' object if it exists
    sellerId: data.sellerId || data.seller?.uid || data.storeId || "SYSTEM",
    sellerName: data.sellerName || data.seller?.name || "Verified Seller",
    sellerPhone: data.sellerPhone || data.whatsapp || "", 
    status: data.status || "active",
    views: data.views || 0,
  };
}

// --- FETCH FUNCTIONS ---

// FIXED: Added limitCount so we aren't hardcoded to 20 anymore!
export async function getProducts(category?: string, limitCount?: number): Promise<Product[]> {
  try {
    let query: FirebaseFirestore.Query = adminDb.collection("products");

    if (category) {
      query = query.where("category", "==", category);
    }

    query = query.orderBy("createdAt", "desc");

    // Only apply a limit if the frontend specifically asks for one
    if (limitCount) {
      query = query.limit(limitCount);
    }

    const snapshot = await query.get();

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map((doc) => parseProduct(doc));
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export async function getProductByPublicId(publicIdOrId: string): Promise<Product | null> {
  try {
    const snapshot = await adminDb
      .collection("products")
      .where("publicId", "==", publicIdOrId)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      return parseProduct(snapshot.docs[0]);
    }

    const docRef = await adminDb.collection("products").doc(publicIdOrId).get();

    if (docRef.exists) {
      return parseProduct(docRef);
    }

    return null;
  } catch (error) {
    console.error(`Error fetching product ${publicIdOrId}:`, error);
    return null;
  }
}
