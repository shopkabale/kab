import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get("adminId");

    if (!adminId) {
      return NextResponse.json({ error: "Missing admin ID" }, { status: 400 });
    }

    // Verify Admin
    const adminSnap = await adminDb.collection("users").doc(adminId).get();
    if (!adminSnap.exists || adminSnap.data()?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch all users (We will filter out non-partners)
    const usersSnap = await adminDb.collection("users").get();
    
    const partners = usersSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((user: any) => user.referralCode) // Only keep users who generated a code
      .sort((a: any, b: any) => (b.referralCount || 0) - (a.referralCount || 0)); // Sort by top performers

    return NextResponse.json({ partners }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch partners:", error);
    return NextResponse.json({ error: "Failed to fetch partners" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { adminId, partnerId, action } = await request.json();

    if (!adminId || !partnerId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify Admin
    const adminSnap = await adminDb.collection("users").doc(adminId).get();
    if (!adminSnap.exists || adminSnap.data()?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (action === "CLEAR_BALANCE") {
      await adminDb.collection("users").doc(partnerId).update({
        referralBalance: 0,
        lastPayoutDate: Date.now()
      });

      return NextResponse.json({ success: true, message: "Partner balance has been reset to 0." }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error: any) {
    console.error("Partner update error:", error);
    return NextResponse.json({ error: error.message || "Failed to update partner" }, { status: 500 });
  }
}
