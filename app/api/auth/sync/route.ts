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
    
    const decodedToken = await adminAuth.verifyIdToken(token);
    const { uid, email, name, picture } = decodedToken;

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
        role: "customer", 
        createdAt: Date.now(),
      };
      await userRef.set(userData);
    } else {
      // 2. EXISTING USER (The "Shabby Data" Adapter)
      const data = userDoc.data() || {};

      // A. Safely parse the exact Name field they have
      const parsedName = data.displayName || data.fullName || data.name || name || "Kabale User";

      // B. Safely parse the Photo
      const parsedPhoto = data.photoURL || data.picture || picture || "";

      // C. Normalize the Role (Translate old "seller" to our new "vendor" standard)
      let parsedRole = data.role || "customer";
      if (parsedRole === "seller") {
        parsedRole = "vendor";
      }

      // D. Safely parse Firestore Timestamps vs JS Numbers
      let parsedCreatedAt = Date.now();
      if (data.createdAt) {
        if (typeof data.createdAt === 'number') {
          parsedCreatedAt = data.createdAt;
        } else if (data.createdAt.toDate) {
          parsedCreatedAt = data.createdAt.toDate().getTime();
        } else if (data.createdAt._seconds) {
          parsedCreatedAt = data.createdAt._seconds * 1000;
        }
      }

      // E. Build the perfect, strict Next.js object
      userData = {
        id: userDoc.id,
        email: data.email || email || "",
        displayName: parsedName,
        photoURL: parsedPhoto,
        role: parsedRole as "customer" | "vendor" | "admin",
        createdAt: parsedCreatedAt,
      };

      // OPTIONAL: You can silently update their messy database record to the new clean format in the background!
      // Uncomment the line below if you want the database to slowly fix itself as people log in.
      // await userRef.update({ displayName: parsedName, role: parsedRole });
    }

    return NextResponse.json({ success: true, user: userData }, { status: 200 });

  } catch (error) {
    console.error("Auth Sync Error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}