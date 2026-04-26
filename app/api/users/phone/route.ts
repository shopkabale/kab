import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getAuth } from "firebase-admin/auth";

export async function PATCH(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const uid = decodedToken.uid;

    const { phone } = await request.json();
    
    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    const cleanPhone = phone.trim();

    // 🚀 Check if the number is already taken by someone else
    const phoneCheckSnap = await adminDb.collection("users").where("phone", "==", cleanPhone).get();
    
    if (!phoneCheckSnap.empty) {
      const isCurrentUser = phoneCheckSnap.docs.every(doc => doc.id === uid);
      if (!isCurrentUser) {
        return NextResponse.json({ 
          error: "This phone number is already registered to another account." 
        }, { status: 409 });
      }
    }

    // 🚀 THE FIX: Use .set() with { merge: true } instead of .update()
    // This forces the database to save the number even if the user document is partially incomplete.
    await adminDb.collection("users").doc(uid).set({
      phone: cleanPhone,
      phoneUpdatedAt: Date.now()
    }, { merge: true });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Phone update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
