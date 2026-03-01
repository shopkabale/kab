import { adminDb } from "./admin";
import { Product } from "@/types";

export async function getProducts(category?: string): Promise<Product[]> {
  try {
    let query: FirebaseFirestore.Query = adminDb.collection("products");
    
    if (category) {
      query = query.where("category", "==", category);
    }
    
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

export async function getProductByPublicId(publicIdOrId: string): Promise<Product | null> {
  try {
    // 1. Try fetching by our custom publicId (e.g., ELC-0001)
    const snapshot = await adminDb
      .collection("products")
      .where("publicId", "==", publicIdOrId)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      } as Product;
    }

    // 2. BACKWARDS COMPATIBILITY: If not found, try standard Firestore document ID
    const docRef = await adminDb.collection("products").doc(publicIdOrId).get();
    
    if (docRef.exists) {
      return {
        id: docRef.id,
        ...docRef.data(),
      } as Product;
    }

    return null;
  } catch (error) {
    console.error(`Error fetching product ${publicIdOrId}:`, error);
    return null;
  }
}