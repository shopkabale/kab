import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

// GET: Fetch all marketplace users
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get("adminId");

    // 1. Verify Admin
    if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const adminDoc = await adminDb.collection("users").doc(adminId).get();
    if (adminDoc.data()?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // 2. Fetch all users
    const snapshot = await adminDb
      .collection("users")
      .orderBy("createdAt", "desc")
      .get();

    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error("Error fetching admin users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// PATCH: Update user role
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { adminId, targetUserId, newRole } = body;

    if (!adminId || !targetUserId || !newRole) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Verify Admin
    const adminDoc = await adminDb.collection("users").doc(adminId).get();
    if (adminDoc.data()?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // 2. Prevent Self-Lockout (Admin cannot demote themselves here)
    if (adminId === targetUserId) {
      return NextResponse.json({ error: "You cannot change your own admin role." }, { status: 400 });
    }

    // 3. Update Role
    await adminDb.collection("users").doc(targetUserId).update({
      role: newRole
    });

    return NextResponse.json({ success: true, newRole }, { status: 200 });
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}