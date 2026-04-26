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

    // 🚀 THE CLEAN CHECK: Search the DB for this exact phone number
    const phoneCheckSnap = await adminDb.collection("users").where("phone", "==", cleanPhone).get();
    
    if (!phoneCheckSnap.empty) {
      // If results are found, make sure it isn't just the current user updating their own profile
      const isCurrentUser = phoneCheckSnap.docs.every(doc => doc.id === uid);
      
      if (!isCurrentUser) {
        return NextResponse.json({ 
          error: "This phone number is already registered to another account." 
        }, { status: 409 });
      }
    }

    // If the check passes, update the user
    await adminDb.collection("users").doc(uid).update({
      phone: cleanPhone,
      phoneUpdatedAt: Date.now()
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Phone update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
