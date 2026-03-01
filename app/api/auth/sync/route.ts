import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { User } from "@/types";

export async function POST(request: Request) {
  try {
    // 1. Grab the secure token sent by the frontend
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid token" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    
    // 2. Verify the token using Firebase Admin
    const decodedToken = await adminAuth.verifyIdToken(token);
    const { uid, email, name, picture } = decodedToken;

    if (!uid) {
      return NextResponse.json({ error: "Invalid token payload" }, { status: 401 });
    }

    // 3. Check if this user already exists in your Firestore database
    const userRef = adminDb.collection("users").doc(uid);
    const userDoc = await userRef.get();

    let userData: User;

    if (!userDoc.exists) {
      // 4. If they are brand new, create their profile!
      userData = {
        id: uid,
        email: email || "",
        displayName: name || "Kabale User",
        photoURL: picture || "",
        role: "customer", // Everyone starts as a customer
        createdAt: Date.now(),
      };
      await userRef.set(userData);
    } else {
      // 5. If they exist, just grab their existing data (like if they are an "admin" or "vendor")
      userData = {
        id: userDoc.id,
        ...userDoc.data(),
      } as User;
    }

    // 6. Send the verified user back to the Navbar so it can update the UI
    return NextResponse.json({ success: true, user: userData }, { status: 200 });

  } catch (error) {
    console.error("Auth Sync Error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}