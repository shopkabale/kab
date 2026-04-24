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

    // Safely update the user's phone number
    await adminDb.collection("users").doc(uid).update({
      phone: phone.trim()
    });

    return NextResponse.json({ success: true, phone });
  } catch (error) {
    console.error("Failed to update phone number:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
