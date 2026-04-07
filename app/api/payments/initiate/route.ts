import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/config"; // Ensure this matches your exact config path
import { collection, addDoc, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { calculateDepositAmount } from "@/lib/utils";

// ==========================================
// HELPER: DETECT NETWORK FROM PHONE PREFIX
// ==========================================
function getNetwork(phone: string): "MTN" | "AIRTEL" | null {
  // Assuming standard Uganda 10-digit format (e.g., 0770000000)
  const prefix = phone.substring(0, 3);
  
  if (["077", "078", "076", "039"].includes(prefix)) return "MTN";
  if (["075", "070", "074"].includes(prefix)) return "AIRTEL";
  
  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, buyerName, productId, contactPhone } = body;

    // 1. VALIDATE INPUTS
    if (!productId || !contactPhone || !buyerName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const network = getNetwork(contactPhone);
    if (!network) {
      return NextResponse.json({ error: "Invalid network. Only MTN and Airtel are supported." }, { status: 400 });
    }

    // 2. FETCH PRODUCT SECURELY FROM DB (Prevent Price Tampering)
    // Adjust 'products' to match your actual collection name if different
    const productRef = doc(db, "products", productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const productData = productSnap.data();
    const actualPrice = Number(productData.price) || 0;
    const isRestricted = productData.isAdminUpload || false;

    // 3. CALCULATE DEPOSIT SERVER-SIDE
    const depositAmount = calculateDepositAmount(actualPrice, isRestricted);

    if (depositAmount === 0) {
      return NextResponse.json({ error: "This item does not require a deposit." }, { status: 400 });
    }

    // 4. GENERATE UNIQUE REFERENCE ID
    const referenceId = crypto.randomUUID();

    // 5. CALL LIVEPAY COLLECTION API
    const livePayResponse = await fetch("https://livepay.me/api/v1/collect-money", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.LIVEPAY_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        apikey: process.env.LIVEPAY_PUBLIC_KEY,
        amount: depositAmount,
        phone_number: contactPhone,
        currency: "UGX",
        network: network,
        reference: referenceId
      })
    });

    const livePayData = await livePayResponse.json();

    if (!livePayResponse.ok || livePayData.status === "error") {
      console.error("LivePay Error:", livePayData);
      return NextResponse.json({ error: livePayData.message || "Payment provider error" }, { status: 400 });
    }

    // Extract LivePay's unique transaction ID from the successful response
    const transactionId = livePayData.data?.transaction_id;

    // 6. SAVE PENDING ORDER TO FIRESTORE
    const orderRef = await addDoc(collection(db, "orders"), {
      userId: userId || "GUEST",
      buyerName,
      productId,
      totalPrice: actualPrice,
      depositRequired: depositAmount,
      contactPhone,
      status: "pending_deposit",
      transactionId: transactionId,
      referenceId: referenceId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // 7. RETURN SUCCESS & ORDER ID TO FRONTEND
    return NextResponse.json({ 
      success: true, 
      orderId: orderRef.id,
      transactionId: transactionId
    }, { status: 201 });

  } catch (error) {
    console.error("Initiate Payment Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
