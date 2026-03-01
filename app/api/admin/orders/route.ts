import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

// GET: Fetch all marketplace orders
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get("adminId");

    // 1. Verify Admin
    if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const adminDoc = await adminDb.collection("users").doc(adminId).get();
    if (adminDoc.data()?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // 2. Fetch all orders, newest first
    const snapshot = await adminDb
      .collection("orders")
      .orderBy("createdAt", "desc")
      .get();

    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error("Error fetching admin orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

// PATCH: Update order status
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { adminId, orderId, newStatus } = body;

    if (!adminId || !orderId || !newStatus) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Verify Admin
    const adminDoc = await adminDb.collection("users").doc(adminId).get();
    if (adminDoc.data()?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // 2. Update Status
    await adminDb.collection("orders").doc(orderId).update({
      status: newStatus,
      updatedAt: Date.now()
    });

    return NextResponse.json({ success: true, newStatus }, { status: 200 });
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}