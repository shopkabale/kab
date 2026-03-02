import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: Request) {
  try {
    const { postId } = await request.json();

    if (!postId) {
      return NextResponse.json({ error: "Missing Post ID" }, { status: 400 });
    }

    // Atomically increment the views using the Admin SDK
    await adminDb.collection("blog_posts").doc(postId).update({
      views: FieldValue.increment(1)
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to increment views:", error);
    return NextResponse.json({ error: "Failed to update views" }, { status: 500 });
  }
}