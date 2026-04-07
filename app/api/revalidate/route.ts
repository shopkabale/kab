import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

// Forces Vercel to run this dynamically every time you visit the URL
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    revalidatePath("/"); 
    
    return NextResponse.json({ 
      revalidated: true, 
      timestamp: new Date().toISOString(),
      message: "Success! Kabale Online homepage cache has been cleared." 
    });
  } catch (err) {
    return NextResponse.json({ 
      revalidated: false, 
      message: "Failed to clear the cache." 
    }, { status: 500 });
  }
}
