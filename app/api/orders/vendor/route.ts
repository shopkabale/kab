import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get("sellerId");

    if (!sellerId) {
      return NextResponse.json({ error: "Missing sellerId parameter" }, { status: 400 });
    }

    // Query the orders collection for orders belonging to this specific seller
    const ordersSnapshot = await adminDb
      .collection("orders")
      .where("sellerId", "==", sellerId)
      .orderBy("createdAt", "desc") // Shows newest orders first
      .get();

    const orders = ordersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ orders });
    
  } catch (error) {
    console.error("Error fetching vendor orders:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
