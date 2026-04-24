import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { User } from "@/types";
import { cookies } from "next/headers"; // 🚀 Added to read referral cookies

// 🔤 Helper to generate a unique 5-character code
async function generateUniqueReferralCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded 0, O, 1, I for clarity
  let isUnique = false;
  let code = '';

  while (!isUnique) {
    code = Array.from({ length: 5 })
      .map(() => chars.charAt(Math.floor(Math.random() * chars.length)))
      .join('');

    const snapshot = await adminDb.collection("users").where("referralCode", "==", code).get();
    if (snapshot.empty) isUnique = true;
  }
  return code;
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid token" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const { uid, email, name, picture, admin } = decodedToken;

    if (!uid) {
      return NextResponse.json({ error: "Invalid token payload" }, { status: 401 });
    }

    // 🚀 READ REFERRAL COOKIE
    const cookieStore = cookies();
    const refCookie = cookieStore.get("kabale_ref");
    const refCode = refCookie ? refCookie.value : null;

    const userRef = adminDb.collection("users").doc(uid);
    const userDoc = await userRef.get();

    let userData: User;

    if (!userDoc.exists) {
      // ==========================================
      // 1. BRAND NEW USER FLOW
      // ==========================================
      const newReferralCode = await generateUniqueReferralCode();
      let referrerId = null;

      // Check if they came from a valid referral link
      if (refCode) {
        const referrerSnap = await adminDb.collection("users").where("referralCode", "==", refCode).limit(1).get();
        if (!referrerSnap.empty) {
          referrerId = referrerSnap.docs[0].id;
        }
      }

      userData = {
        id: uid,
        email: email || "",
        displayName: name || "Kabale User",
        photoURL: picture || "",
        role: admin === true ? "admin" : "customer", 
        createdAt: Date.now(),
        // 🚀 NEW REFERRAL FIELDS
        referralCode: newReferralCode,
        referrerId: referrerId,
        referralBalance: 0,
        referralCount: 0
      };
      
      await userRef.set(userData);

    } else {
      // ==========================================
      // 2. EXISTING USER FLOW
      // ==========================================
      const data = userDoc.data() || {};

      const parsedName = data.displayName || data.fullName || data.name || name || "Kabale User";
      const parsedPhoto = data.photoURL || data.picture || picture || "";

      let parsedRole = data.role || "customer";
      if (parsedRole === "seller") parsedRole = "vendor";
      if (admin === true) parsedRole = "admin";

      const parsedCreatedAt = (() => {
        if (!data.createdAt) return Date.now();
        if (typeof data.createdAt === 'number') return data.createdAt;
        if (data.createdAt.toDate) return data.createdAt.toDate().getTime();
        if (data.createdAt._seconds) return data.createdAt._seconds * 1000;
        return Date.now();
      })();

      // 🚀 BACKWARD COMPATIBILITY: Give existing users a code if they lack one
      let currentRefCode = data.referralCode;
      if (!currentRefCode) {
        currentRefCode = await generateUniqueReferralCode();
        await userRef.update({ 
          referralCode: currentRefCode,
          referralBalance: data.referralBalance || 0,
          referralCount: data.referralCount || 0
        });
      }

      userData = {
        id: userDoc.id,
        email: data.email || email || "",
        displayName: parsedName,
        photoURL: parsedPhoto,
        role: parsedRole as "customer" | "vendor" | "admin",
        createdAt: parsedCreatedAt,
        // 🚀 ADD REFERRAL FIELDS TO SESSION
        referralCode: currentRefCode,
        referrerId: data.referrerId || null,
        referralBalance: data.referralBalance || 0,
        referralCount: data.referralCount || 0
      };
    }

    return NextResponse.json({ success: true, user: userData }, { status: 200 });

  } catch (error) {
    console.error("Auth Sync Error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
