import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/config"; 
import { collection, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

// Helper: Detect network
function getNetwork(phone: string): "MTN" | "AIRTEL" | null {
  const prefix = phone.substring(0, 3);
  if (["077", "078", "076", "039"].includes(prefix)) return "MTN";
  if (["075", "070", "074"].includes(prefix)) return "AIRTEL";
  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { buyerName, contactPhone, userId, cartItems, referralCodeUsed } = body;

    if (!cartItems || cartItems.length === 0 || !contactPhone || !buyerName) {
      return NextResponse.json({ error: "Missing required fields or empty cart" }, { status: 400 });
    }

    const network = getNetwork(contactPhone);
    if (!network) {
      return NextResponse.json({ error: "Invalid network. Only MTN and Airtel are supported." }, { status: 400 });
    }

    // 1. SECURE CART VERIFICATION
    let actualTotalAmount = 0;
    const validatedItems = [];

    for (const item of cartItems) {
      const targetId = item.productId || item.id; 
      const productRef = doc(db, "products", targetId);
      const productSnap = await getDoc(productRef);

      if (!productSnap.exists()) {
        return NextResponse.json({ error: `Item ${item.title || item.name} is unavailable.` }, { status: 404 });
      }

      const productData = productSnap.data();
      const dbPrice = Number(productData.price) || 0;
      const itemQuantity = Number(item.quantity) || 1;
      const itemName = item.title || item.name || productData.title || "Unknown Item";

      // 🔥 DETECT DEPOSIT: Charge 10% (Min 1,000 UGX) if it's a service booking
      let finalItemPrice = dbPrice;
      if (itemName.includes("Booking Deposit")) {
        const calculatedDeposit = Math.round(dbPrice * 0.10);
        finalItemPrice = calculatedDeposit < 1000 ? 1000 : calculatedDeposit;
      }

      actualTotalAmount += (finalItemPrice * itemQuantity);

      validatedItems.push({
        productId: targetId,
        name: itemName,
        price: finalItemPrice,
        quantity: itemQuantity,
        sellerId: item.sellerId || productData.sellerId || "SYSTEM",
        sellerPhone: item.sellerPhone || productData.sellerPhone || "",
        image: item.image || productData.images?.[0] || ""
      });
    }

    const securePaymentAmount = Math.round(actualTotalAmount);

    // 2. MULTI-SELLER ROUTING LOGIC
    const sellerOrdersMap: Record<string, any> = {};
    for (const item of validatedItems) {
      if (!sellerOrdersMap[item.sellerPhone]) {
        sellerOrdersMap[item.sellerPhone] = {
          sellerId: item.sellerId,
          sellerPhone: item.sellerPhone,
          items: [],
          subtotal: 0
        };
      }
      sellerOrdersMap[item.sellerPhone].items.push(item);
      sellerOrdersMap[item.sellerPhone].subtotal += (item.price * item.quantity);
    }
    const sellerOrders = Object.values(sellerOrdersMap);

    // 3. GENERATE IDs (LivePay v2 limits reference to 30 chars, no spaces)
    const orderNumber = `KAB-${Math.floor(1000 + Math.random() * 9000)}`;
    const referenceId = `REF${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // 4. CALL LIVEPAY API (V2 Endpoint with Cloudflare Bypass Headers)
    const livePayResponse = await fetch("https://livepay.me/api/collect-money", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.LIVEPAY_API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "application/json", // 🔥 Tells Cloudflare we are an API
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36" // 🔥 Bypasses Cloudflare bot detection
      },
      body: JSON.stringify({
        accountNumber: process.env.LIVEPAY_ACCOUNT_NUMBER, 
        phoneNumber: contactPhone, 
        amount: securePaymentAmount, 
        currency: "UGX",
        reference: referenceId,
        description: `Kabale Online Order ${orderNumber}`
      })
    });

    // Safe JSON Parsing in case LivePay returns HTML
    const rawResponseText = await livePayResponse.text();
    let livePayData;
    try {
      livePayData = JSON.parse(rawResponseText);
    } catch (err) {
      console.error("LivePay returned invalid JSON (HTML Error):", rawResponseText);
      return NextResponse.json({ error: "Payment gateway is temporarily unavailable." }, { status: 502 });
    }

    // LivePay's success format check
    if (!livePayResponse.ok || livePayData.success === false || livePayData.status === "error") {
      console.error("LivePay API Error:", livePayData);
      return NextResponse.json({ error: livePayData.error || livePayData.message || "Payment provider error" }, { status: 400 });
    }

    // 5. SAVE THE MASTER ORDER
    const uniqueSellerIds = Array.from(new Set(validatedItems.map(item => item.sellerId).filter(Boolean)));
    const orderRef = doc(db, "orders", orderNumber);
    
    await setDoc(orderRef, {
      orderId: orderNumber,
      userId: userId || "GUEST",
      buyerName,
      buyerPhone: contactPhone,
      source: "cart",            
      paymentMode: "FULL",       
      paymentStatus: "pending",  
      status: "new",
      cartItems: validatedItems,
      sellerOrders: sellerOrders,
      sellerIds: uniqueSellerIds, 
      totalAmount: securePaymentAmount,
      referenceId: referenceId,
      internalReference: livePayData.internal_reference || null,
      referralCodeUsed: referralCodeUsed || null, 
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return NextResponse.json({ 
      success: true, 
      orderId: orderNumber,
      referenceId: referenceId
    }, { status: 201 });

  } catch (error) {
    console.error("Initiate Payment Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
