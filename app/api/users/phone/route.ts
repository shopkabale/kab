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

    const { phone } = await request.json();

    if (!phone || phone.length < 9) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    const now = Date.now();

    // 🚀 FIXED: Using .set() with { merge: true }
    // This ensures that even if the user is brand new and has no Firestore document yet,
    // it will CREATE the document and save the phone number permanently.
    await adminDb.collection("users").doc(uid).set({
      phone: phone.trim(),
      phoneUpdatedAt: now
    }, { merge: true });

    return NextResponse.json({ success: true, phone, phoneUpdatedAt: now });
  } catch (error) {
    console.error("Failed to update phone number:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
