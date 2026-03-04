import { NextResponse } from "next/server";
import crypto from "crypto";

// Forces Vercel to run this dynamically on every request so signatures don't expire
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    
    // Pulling exact variable names matching your Vercel dashboard
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY; 
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;

    if (!apiSecret || !apiKey || !cloudName) {
      console.error("CRITICAL: Cloudinary environment variables are missing.");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Hardcoded folder exclusively for the Kabale Online blog
    const folder = "kabale_blog";
    
    // Cloudinary requires parameters to be sorted alphabetically before hashing
    const signatureString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;

    const signature = crypto
      .createHash("sha1")
      .update(signatureString)
      .digest("hex");

    return NextResponse.json({ 
      timestamp, 
      signature,
      apiKey,
      cloudName
    }, { status: 200 });
    
  } catch (error) {
    console.error("Cloudinary blog signature error:", error);
    return NextResponse.json({ error: "Failed to generate signature" }, { status: 500 });
  }
}