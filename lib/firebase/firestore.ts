import { adminDb } from "./admin";
import { Product } from "@/types";

/**
 * Fetch products, optionally filtered by category.
 * Used for the homepage and category pages (Electronics, Agriculture, etc.)
 */
export async function getProducts(category?: string): Promise<Product[]> {
  try {
    let query: FirebaseFirestore.Query = adminDb.collection("products");
    
    if (category) {
      query = query.where("category", "==", category);
    }
    
    // Order by newest first, limit to 20 for performance
    query = query.orderBy("createdAt", "desc").limit(20);

    const snapshot = await query.get();
    
    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Product[];
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

/**
 * Fetch a single product by its unique public ID (e.g., ELC-0001).
 * Used for individual product pages.
 */
export async function getProductByPublicId(publicId: string): Promise<Product | null> {
  try {
    const snapshot = await adminDb
      .collection("products")
      .where("publicId", "==", publicId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as Product;
  } catch (error) {
    console.error(`Error fetching product ${publicId}:`, error);
    return null;
  }
}