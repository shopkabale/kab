import { adminDb } from "./admin";
import { Product } from "@/types";

// --- DATA ADAPTER ---
// This safely translates your old legacy database fields into our new strict format
function parseProduct(doc: FirebaseFirestore.DocumentSnapshot): Product {
  const data = doc.data() || {};

  // Safely handle Firestore Timestamps vs JS numbers
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

  // Safely grab images from whichever old field they were saved in
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
    publicId: data.publicId || "", // Empty string if it's an old product
    name: data.name || data.title || "Unnamed Item",
    slug: data.slug || "item",
    category: data.category || "general",
    storeId: data.storeId || data.seller?.uid || "SYSTEM",
    price: Number(data.price) || 0,
    stock: Number(data.stock) || Number(data.quantity) || 1,
    images: parsedImages,
    createdAt: parsedCreatedAt,
  };
}

// --- FETCH FUNCTIONS ---

export async function getProducts(category?: string): Promise<Product[]> {
  try {
    let query: FirebaseFirestore.Query = adminDb.collection("products");
    
    if (category) {
      query = query.where("category", "==", category);
    }
    
    // Order by newest first
    query = query.orderBy("createdAt", "desc").limit(20);

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
    // 1. Try fetching by our custom publicId (e.g., ELC-0001)
    const snapshot = await adminDb
      .collection("products")
      .where("publicId", "==", publicIdOrId)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      return parseProduct(snapshot.docs[0]);
    }

    // 2. BACKWARDS COMPATIBILITY: If not found, try standard Firestore document ID
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