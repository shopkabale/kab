import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export async function PATCH(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    const { referralName } = await request.json();

    if (!referralName || referralName.length > 20) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }

    // Update only the referralName field
    await adminDb.collection("users").doc(uid).update({
      referralName: referralName.trim()
    });

    return NextResponse.json({ success: true, referralName });
  } catch (error) {
    console.error("Failed to update referral name:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
