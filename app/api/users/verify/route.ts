import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const userRef = adminDb.collection("users").doc(userId);
    const userSnap = await userRef.get();

    const now = Date.now();

    if (!userSnap.exists) {
      // Create user doc if missing
      await userRef.set({
        verificationStatus: "pending",
        verificationRequestedAt: now,
        createdAt: now,
      });
      return NextResponse.json({ success: true, status: "pending" });
    }

    const userData = userSnap.data();

    if (userData?.verificationStatus === "verified") {
      return NextResponse.json({ error: "Already verified" }, { status: 400 });
    }
    
    if (userData?.verificationStatus === "pending") {
      return NextResponse.json({ error: "Review already in progress" }, { status: 429 });
    }

    await userRef.update({
      verificationStatus: "pending",
      verificationRequestedAt: now
    });

    return NextResponse.json({ success: true, status: "pending" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
