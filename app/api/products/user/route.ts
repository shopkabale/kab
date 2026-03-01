import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic"; // Required for reading request.url

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const snapshot = await adminDb
      .collection("products")
      .where("sellerId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    const products = snapshot.docs.map((doc) => {
      const data = doc.data();
      
      // Safely handle images from older database formats
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
        price: Number(data.price) || 0,
        images: parsedImages,
        status: data.status || "active",
        views: data.views || 0,
        createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
      };
    });

    return NextResponse.json({ products }, { status: 200 });
  } catch (error) {
    console.error("Error fetching user products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}