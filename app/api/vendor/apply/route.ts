import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { Store } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, storeName, description, phone } = body;

    if (!userId || !storeName || !phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Check if the user already has a store application
    const existingStore = await adminDb
      .collection("stores")
      .where("vendorId", "==", userId)
      .limit(1)
      .get();

    if (!existingStore.empty) {
      return NextResponse.json(
        { error: "You already have a store or a pending application." },
        { status: 400 }
      );
    }

    // 2. Create the new Store document securely
    const newStoreRef = adminDb.collection("stores").doc();
    const slug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

    const newStore = {
      id: newStoreRef.id,
      vendorId: userId,
      name: storeName,
      slug: slug,
      description: description || "",
      phone: phone, // Crucial for Kabale local communication
      isApproved: false, // Must be approved by an Admin
      createdAt: Date.now(),
    };

    await newStoreRef.set(newStore);

    return NextResponse.json({ success: true, storeId: newStoreRef.id }, { status: 201 });

  } catch (error) {
    console.error("Error submitting vendor application:", error);
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
  }
}