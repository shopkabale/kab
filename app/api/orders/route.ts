import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { NotificationService } from "@/lib/notifications"; 
import { sendAdminAlert } from "@/lib/brevo"; 

// ==========================================
// 1. POST: CREATE ORDER (Checkout Logic)
// ==========================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { source, userId, buyerName, contactPhone, location, cartItems } = body;

    // 1. BASIC VALIDATION
    if (!cartItems || cartItems.length === 0 || !contactPhone || !buyerName) {
      return NextResponse.json({ error: "Missing required fields or empty cart" }, { status: 400 });
    }

    const orderNumber = `KAB-${Math.floor(1000 + Math.random() * 9000)}`;
    let actualTotalAmount = 0;
    const validatedItems: any[] = [];
    const sellerOrdersMap: Record<string, any> = {};

    // 2. MULTI-ITEM ATOMIC TRANSACTION
    await adminDb.runTransaction(async (transaction) => {
      // Step A: Read all products first
      const productDocs = await Promise.all(
        cartItems.map((item: any) => transaction.get(adminDb.collection("products").doc(item.productId || item.id)))
      );

      // Step B: Validate Stock & Price
      productDocs.forEach((productSnap, index) => {
        if (!productSnap.exists) throw new Error(`Item ${cartItems[index].name} is not found.`);

        const product = productSnap.data()!;
        const requestedQty = Number(cartItems[index].quantity) || 1;

        if (product.stock < requestedQty || product.status === "sold_out") {
          throw new Error(`Sorry, ${product.title || product.name} is out of stock!`);
        }
        if (product.locked) {
          throw new Error(`Sorry, someone else is currently checking out with ${product.title || product.name}.`);
        }

        const actualPrice = Number(product.price) || 0;
        actualTotalAmount += (actualPrice * requestedQty);

        // Build validated item
        const finalItem = {
          productId: productSnap.id,
          name: product.title || product.name || "Unknown Item",
          price: actualPrice,
          quantity: requestedQty,
          sellerId: product.sellerId || "SYSTEM",
          sellerPhone: product.sellerPhone || "",
          image: product.images?.[0] || ""
        };
        validatedItems.push(finalItem);

        // Group by Seller
        if (!sellerOrdersMap[finalItem.sellerPhone]) {
          sellerOrdersMap[finalItem.sellerPhone] = {
            sellerId: finalItem.sellerId,
            sellerPhone: finalItem.sellerPhone,
            items: [],
            subtotal: 0
          };
        }
        sellerOrdersMap[finalItem.sellerPhone].items.push(finalItem);
        sellerOrdersMap[finalItem.sellerPhone].subtotal += (actualPrice * requestedQty);

        // Deduct Stock
        transaction.update(productSnap.ref, {
          stock: FieldValue.increment(-requestedQty),
          locked: true,
          updatedAt: Date.now()
        });
      });

      // Step C: Save Master Order
      const sellerOrders = Object.values(sellerOrdersMap);
      const uniqueSellerIds = Array.from(new Set(validatedItems.map(item => item.sellerId).filter(Boolean)));

      const orderRef = adminDb.collection("orders").doc(orderNumber);

      transaction.set(orderRef, {
        orderId: orderNumber,
        userId: userId || "GUEST",
        buyerName,
        buyerPhone: contactPhone,
        buyerLocation: location || "Kabale",
        source: source || "whatsapp", 
        paymentMode: "COD",           
        paymentStatus: "pending",     
        status: "processing",         
        cartItems: validatedItems,
        sellerOrders: sellerOrders,
        sellerIds: uniqueSellerIds,   
        totalAmount: actualTotalAmount,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    });

    // ==========================================
    // 3. BACKGROUND NOTIFICATION ROUTING
    // ==========================================
    console.log("-> Executing Notification Promises for COD Order...");

    const notificationPromises: Promise<any>[] = [];
    const allProductsString = validatedItems.map(i => `${i.quantity}x ${i.name}`).join(", ");

    notificationPromises.push(
      NotificationService.notifyBuyer(contactPhone, orderNumber, allProductsString, actualTotalAmount)
    );

    notificationPromises.push(
      sendAdminAlert(orderNumber, allProductsString, actualTotalAmount, contactPhone, "Multi-Seller COD Order")
    );

    const sellerOrdersList = Object.values(sellerOrdersMap);
    for (const sellerCut of sellerOrdersList) {
      const sellerItemsString = sellerCut.items.map((i: any) => `${i.quantity}x ${i.name}`).join(", ");

      notificationPromises.push(
        NotificationService.notifySeller(
          sellerCut.sellerPhone, 
          "Partner", 
          orderNumber, 
          sellerItemsString, 
          sellerCut.subtotal, 
          buyerName,
          location || "Kabale",
          contactPhone
        )
      );
    }

    await Promise.allSettled(notificationPromises);
    console.log("✅ All COD notifications dispatched successfully.");

    return NextResponse.json({ success: true, orderId: orderNumber });

  } catch (error: any) {
    console.error("❌ Order creation error:", error.message);
    return NextResponse.json({ error: error.message || "Failed to create order" }, { status: 500 });
  }
}

// ==========================================
// 2. GET: FETCH ORDERS FOR ADMIN DASHBOARD
// ==========================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get("adminId");

    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ordersSnap = await adminDb.collection("orders").orderBy("createdAt", "desc").limit(100).get();
    const orders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Admin Orders GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ==========================================
// 3. PATCH: UPDATE STATUS & TRIGGER PAYOUTS
// ==========================================
export async function PATCH(request: Request) {
  try {
    const { adminId, orderId, newStatus } = await request.json();

    if (!adminId || !orderId || !newStatus) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const orderRef = adminDb.collection("orders").doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderData = orderDoc.data()!;
    let debugMessage = `Order successfully updated to ${newStatus}.`;

    // A. Update the order status
    await orderRef.update({ 
      status: newStatus,
      updatedAt: Date.now() 
    });

    // ==========================================
    // 🚀 REFERRAL PAYOUT ENGINE
    // ==========================================
    if (newStatus === "delivered") {
      if (!orderData.referralCodeUsed) {
        debugMessage = `Order Delivered. Note: No referral code was attached to this order.`;
      } else if (orderData.payoutProcessed) {
        debugMessage = `Order Delivered. Note: Partner was ALREADY paid for this order previously.`;
      } else {
        const usersRef = adminDb.collection("users");
        const partnerSnap = await usersRef.where("referralCode", "==", orderData.referralCodeUsed).limit(1).get();

        if (partnerSnap.empty) {
          debugMessage = `Order delivered, BUT no user account was found in the database with the code: ${orderData.referralCodeUsed}.`;
        } else {
          const partnerDoc = partnerSnap.docs[0];
          const partnerRef = partnerDoc.ref;
          const partnerData = partnerDoc.data();

          let rewardAmount = 0;
          const cartTotal = Number(orderData.totalAmount) || 0;

          if (cartTotal < 5000) {
            rewardAmount = 300; 
          } else {
            rewardAmount = Math.min(Math.floor(cartTotal * 0.10), 3000); 
          }

          // 🔒 Atomic Wallet Update
          await partnerRef.update({
            referralBalance: FieldValue.increment(rewardAmount),
            referralCount: FieldValue.increment(1)
          });

          // 🔒 Lock the order
          await orderRef.update({
            payoutProcessed: true,
            payoutAmount: rewardAmount
          });

          // 📱 Send Meta WhatsApp Alert
          if (partnerData.phone) {
            const simulatedNewBalance = (Number(partnerData.referralBalance) || 0) + rewardAmount;
            
            await NotificationService.notifyPartnerCredit(
              partnerData.phone, 
              rewardAmount, 
              simulatedNewBalance
            );
            
            debugMessage = `SUCCESS! Order Delivered.\n\nPaid Partner: ${rewardAmount} UGX\nWhatsApp sent to: ${partnerData.phone}`;
          } else {
            debugMessage = `Order Delivered. Partner was paid ${rewardAmount} UGX, but they have NO PHONE NUMBER saved in their profile to receive the WhatsApp alert!`;
          }
        }
      }
    }

    return NextResponse.json({ success: true, message: debugMessage });

  } catch (error) {
    console.error("Admin Orders PATCH Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
