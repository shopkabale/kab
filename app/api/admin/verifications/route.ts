import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function PATCH(req: Request) {
  try {
    const { adminId, targetUserId, newStatus } = await req.json();

    if (!adminId || !targetUserId || !newStatus) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // 1. SECURITY: Verify the requester is actually an admin
    const adminRef = adminDb.collection("users").doc(adminId);
    const adminSnap = await adminRef.get();

    if (!adminSnap.exists || adminSnap.data()?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
    }

    // 2. EXECUTE: Update the target user's status with Admin privileges
    const targetUserRef = adminDb.collection("users").doc(targetUserId);
    await targetUserRef.update({
      verificationStatus: newStatus,
      verificationReviewedAt: Date.now() 
    });

    return NextResponse.json({ 
      success: true, 
      message: `User status updated to ${newStatus}` 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Admin Verification Decision Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
