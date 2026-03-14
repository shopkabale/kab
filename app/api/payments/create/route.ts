import { NextResponse } from "next/server";
// Assuming your admin file is in lib/firebase/admin.ts based on your snippet
import { adminDb } from "@/lib/firebase/admin"; 

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, userEmail, userName, paymentType, referenceId, amount } = body;

    if (!userId || !paymentType || !referenceId || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Generate a unique transaction reference
    const tx_ref = `kab_${paymentType}_${Date.now()}`;

    // 2. Create a pending payment record in Firestore using your Admin SDK
    const paymentRef = adminDb.collection("payments").doc(tx_ref);
    await paymentRef.set({
      id: tx_ref,
      userId,
      paymentType,
      referenceId,
      amount,
      currency: "UGX",
      status: "pending",
      tx_ref: tx_ref,
      createdAt: Date.now(),
    });

    // 3. Call Flutterwave to generate the checkout link
    const flutterwavePayload = {
      tx_ref: tx_ref,
      amount: amount,
      currency: "UGX",
      redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/verify`, // We will build this page next
      customer: {
        email: userEmail,
        name: userName || "Kabale Online User",
      },
      customizations: {
        title: "Kabale Online Payment",
        description: `Payment for ${paymentType.replace('_', ' ')}`,
        logo: "https://okaynotice.com/logo.png", // Replace with your actual logo URL
      },
    };

    const flwResponse = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`, // Add this to your Vercel envs!
        "Content-Type": "application/json",
      },
      body: JSON.stringify(flutterwavePayload),
    });

    const flwData = await flwResponse.json();

    if (flwData.status === "success") {
      // Return the checkout link to the frontend
      return NextResponse.json({ link: flwData.data.link });
    } else {
      console.error("Flutterwave Error:", flwData);
      return NextResponse.json({ error: "Could not generate payment link" }, { status: 500 });
    }

  } catch (error) {
    console.error("Payment Creation Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
