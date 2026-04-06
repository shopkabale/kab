// app/api/products/inquiry/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: Request) {
  try {
    const { productId } = await request.json();

    if (!productId) {  
      return NextResponse.json({ error: "Missing Product ID" }, { status: 400 });  
    }  

    // Increment the inquiry count safely using the Admin SDK
    // If the 'inquiries' field doesn't exist yet, Firebase will create it and set it to 1
    await adminDb.collection("products").doc(productId).update({  
      inquiries: FieldValue.increment(1)  
    });  

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Failed to increment product inquiries:", error);
    return NextResponse.json({ error: "Failed to update inquiries" }, { status: 500 });
  }
}
