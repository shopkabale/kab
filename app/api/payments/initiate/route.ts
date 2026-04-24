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
    // 📦 🚀 INJECTED: Destructure referralCodeUsed from the Master Payload
    const { buyerName, contactPhone, userId, cartItems, referralCodeUsed } = body;

    if (!cartItems || cartItems.length === 0 || !contactPhone || !buyerName) {
      return NextResponse.json({ error: "Missing required fields or empty cart" }, { status: 400 });
    }

    const network = getNetwork(contactPhone);
    if (!network) {
      return NextResponse.json({ error: "Invalid network. Only MTN and Airtel are supported." }, { status: 400 });
    }

    // 1. SECURE CART VERIFICATION (100% FULL PAYMENT CALCULATION)
    let actualTotalAmount = 0;
    const validatedItems = [];

    for (const item of cartItems) {
      // Use productId (FastBuy) or id (CartContext)
      const targetId = item.productId || item.id; 
      const productRef = doc(db, "products", targetId);
      const productSnap = await getDoc(productRef);

      if (!productSnap.exists()) {
        return NextResponse.json({ error: `Item ${item.title || item.name} is unavailable.` }, { status: 404 });
      }

      const productData = productSnap.data();
      const actualPrice = Number(productData.price) || 0;
      const itemQuantity = Number(item.quantity) || 1;

      actualTotalAmount += (actualPrice * itemQuantity);

      validatedItems.push({
        productId: targetId,
        name: item.title || item.name || productData.title || "Unknown Item",
        price: actualPrice, // Strict DB Price
        quantity: itemQuantity,
        sellerId: item.sellerId || productData.sellerId || "SYSTEM",
        sellerPhone: item.sellerPhone || productData.sellerPhone || "",
        image: item.image || productData.images?.[0] || ""
      });
    }

    // 2. MULTI-SELLER ROUTING LOGIC (Group by sellerPhone)
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

    // 3. GENERATE IDs
    const referenceId = crypto.randomUUID();
    const orderNumber = `KAB-${Math.floor(1000 + Math.random() * 9000)}`;

    // 4. CALL LIVEPAY API (Charging 100% actualTotalAmount)
    const livePayResponse = await fetch("https://livepay.me/api/v1/collect-money", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.LIVEPAY_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        apikey: process.env.LIVEPAY_PUBLIC_KEY,
        amount: actualTotalAmount, 
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

    const transactionId = livePayData.data?.transaction_id;

    // 5. SAVE THE MASTER ORDER
    // Extract flat array of seller IDs for Firestore Rules Security!
    const uniqueSellerIds = Array.from(new Set(validatedItems.map(item => item.sellerId).filter(Boolean)));

    const orderRef = doc(db, "orders", orderNumber);
    await setDoc(orderRef, {
      orderId: orderNumber,
      userId: userId || "GUEST",
      buyerName,
      buyerPhone: contactPhone,
      source: "cart",            // Hardcoded for web orders
      paymentMode: "FULL",       // Hardcoded business rule
      paymentStatus: "pending",  // Waiting for webhook
      status: "new",
      cartItems: validatedItems,
      sellerOrders: sellerOrders,
      sellerIds: uniqueSellerIds, // Added flat array here
      totalAmount: actualTotalAmount,
      transactionId: transactionId,
      referenceId: referenceId,
      referralCodeUsed: referralCodeUsed || null, // 🚀 INJECTED: Saves the cookie code into the vault!
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return NextResponse.json({ 
      success: true, 
      orderId: orderNumber,
      transactionId: transactionId
    }, { status: 201 });

  } catch (error) {
    console.error("Initiate Payment Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
