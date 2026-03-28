import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    const now = Date.now();

    // If the user document doesn't exist yet, create it with a pending status
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        verificationStatus: "pending",
        verificationRequestedAt: now,
        createdAt: now,
      });
      return NextResponse.json({ success: true, status: "pending" }, { status: 200 });
    }

    const userData = userSnap.data();

    // SECURITY CHECK: Prevent spamming the verification system
    if (userData.verificationStatus === "verified") {
      return NextResponse.json({ error: "You are already verified!" }, { status: 400 });
    }
    if (userData.verificationStatus === "pending") {
      return NextResponse.json({ error: "Your verification is already under review." }, { status: 429 });
    }

    // Update the existing user document
    await updateDoc(userRef, {
      verificationStatus: "pending",
      verificationRequestedAt: now
    });

    return NextResponse.json({ 
      success: true, 
      message: "Verification request submitted successfully!",
      status: "pending"
    }, { status: 200 });

  } catch (error) {
    console.error("Verification Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
