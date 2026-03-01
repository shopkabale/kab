import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { folder } = body;

    const timestamp = Math.round(new Date().getTime() / 1000);
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!apiSecret) {
      console.error("CRITICAL: CLOUDINARY_API_SECRET is missing in environment variables.");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Cloudinary requires parameters to be sorted alphabetically before hashing
    const signatureString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    
    const signature = crypto
      .createHash("sha1")
      .update(signatureString)
      .digest("hex");

    return NextResponse.json({ timestamp, signature }, { status: 200 });
  } catch (error) {
    console.error("Cloudinary signature error:", error);
    return NextResponse.json({ error: "Failed to generate signature" }, { status: 500 });
  }
}