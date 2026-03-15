import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { vendorId } = body;

    // 1. Basic validation
    if (!vendorId) {
      return NextResponse.json({ error: "Missing vendorId parameter" }, { status: 400 });
    }

    // 2. Query the stores collection to find the store owned by this vendor
    const storeSnapshot = await adminDb
      .collection("stores")
      .where("vendorId", "==", vendorId)
      .limit(1)
      .get();

    // 3. If no store is found, they might be a vendor who hasn't completed the upgrade setup
    if (storeSnapshot.empty) {
      return NextResponse.json({ error: "Store not found for this vendor" }, { status: 404 });
    }

    // 4. Update the lastActiveAt timestamp
    const storeDocRef = storeSnapshot.docs[0].ref;
    
    await storeDocRef.update({
      lastActiveAt: Date.now() // This powers the "🟢 Active today" feature!
    });

    return NextResponse.json({ success: true, message: "Vendor activity timestamp updated successfully" });

  } catch (error) {
    console.error("Failed to log vendor activity:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
