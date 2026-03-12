import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { User } from "@/types";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid token" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];

    // ✨ NEW: The verifyIdToken method actually extracts your custom claims!
    const decodedToken = await adminAuth.verifyIdToken(token);
    const { uid, email, name, picture, admin } = decodedToken; // Extracted 'admin' claim

    if (!uid) {
      return NextResponse.json({ error: "Invalid token payload" }, { status: 401 });
    }

    const userRef = adminDb.collection("users").doc(uid);
    const userDoc = await userRef.get();

    let userData: User;

    if (!userDoc.exists) {
      // 1. BRAND NEW USER
      userData = {
        id: uid,
        email: email || "",
        displayName: name || "Kabale User",
        photoURL: picture || "",
        // If they somehow have the claim (unlikely for a new user, but safe), make them admin
        role: admin === true ? "admin" : "customer", 
        createdAt: Date.now(),
      };
      await userRef.set(userData);
    } else {
      // 2. EXISTING USER (The "Shabby Data" Adapter)
      const data = userDoc.data() || {};

      const parsedName = data.displayName || data.fullName || data.name || name || "Kabale User";
      const parsedPhoto = data.photoURL || data.picture || picture || "";

      // Normalize the Role (Translate old "seller" to our new "vendor" standard)
      let parsedRole = data.role || "customer";
      if (parsedRole === "seller") {
        parsedRole = "vendor";
      }

      // ✨ NEW: The Ultimate Truth Check.
      // If the secure token says they are an admin, override the database!
      if (admin === true) {
        parsedRole = "admin";
      }

      const parsedCreatedAt = (() => {
        if (!data.createdAt) return Date.now();
        if (typeof data.createdAt === 'number') return data.createdAt;
        if (data.createdAt.toDate) return data.createdAt.toDate().getTime();
        if (data.createdAt._seconds) return data.createdAt._seconds * 1000;
        return Date.now();
      })();

      // Build the perfect, strict Next.js object
      userData = {
        id: userDoc.id,
        email: data.email || email || "",
        displayName: parsedName,
        photoURL: parsedPhoto,
        role: parsedRole as "customer" | "vendor" | "admin",
        createdAt: parsedCreatedAt,
      };

      // Optional: Since you have custom claims now, you don't strictly *need* // to sync the role back to the database, but it keeps things tidy!
      // await userRef.update({ displayName: parsedName, role: parsedRole });
    }

    return NextResponse.json({ success: true, user: userData }, { status: 200 });

  } catch (error) {
    console.error("Auth Sync Error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
