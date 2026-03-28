import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export async function PATCH(req: Request) {
  try {
    const { adminId, targetUserId, newStatus } = await req.json();

    if (!adminId || !targetUserId || !newStatus) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // 1. Verify the requester is actually an admin
    const adminRef = doc(db, "users", adminId);
    const adminSnap = await getDoc(adminRef);

    if (!adminSnap.exists() || adminSnap.data().role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
    }

    // 2. Update the target user's verification status
    const targetUserRef = doc(db, "users", targetUserId);
    await updateDoc(targetUserRef, {
      verificationStatus: newStatus,
      // Optional: keep track of when they were approved/rejected
      verificationReviewedAt: Date.now() 
    });

    return NextResponse.json({ success: true, newStatus }, { status: 200 });

  } catch (error: any) {
    console.error("Admin Verification Update Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
