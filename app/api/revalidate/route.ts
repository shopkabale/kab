import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

// Forces Vercel to run this dynamically every time you hit the URL
// so the API route itself never gets stuck in the cache.
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // 🔥 Instantly deletes the cache for ALL queries tagged with "products"
    revalidateTag("products"); 
    
    return NextResponse.json({ 
      revalidated: true, 
      timestamp: new Date().toISOString(),
      message: "Success! The 'products' cache for Kabale Online has been wiped." 
    });
  } catch (err) {
    console.error("Cache wipe failed:", err);
    return NextResponse.json({ 
      revalidated: false, 
      message: "Failed to clear the cache." 
    }, { status: 500 });
  }
}
