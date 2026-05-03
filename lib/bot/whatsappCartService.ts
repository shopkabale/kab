// lib/bot/whatsappCartService.ts
import { adminDb } from "@/lib/firebase/admin";
import * as admin from "firebase-admin";

// Define the Cart Item Structure
export interface WhatsAppCartItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  sellerId: string;
  sellerPhone: string;
  image: string;
}

// Define the Cart Structure
export interface WhatsAppCart {
  phone: string;
  items: WhatsAppCartItem[];
  subtotal: number;
  updatedAt: number;
}

// Helper to normalize phone (keep it consistent)
function normalizePhone(phone: string): string {
  let clean = phone.replace(/\D/g, "");
  if (clean.startsWith("0")) clean = `256${clean.substring(1)}`;
  return clean;
}

// ==========================================
// 1. ADD ITEM TO WHATSAPP CART
// ==========================================
export async function addToWhatsAppCart(phone: string, productId: string): Promise<WhatsAppCart> {
  const cleanPhone = normalizePhone(phone);
  const cartRef = adminDb.collection("whatsapp_carts").doc(cleanPhone);
  const productRef = adminDb.collection("products").doc(productId);

  // We use a transaction to safely read the product and update the cart simultaneously
  return await adminDb.runTransaction(async (t) => {
    // 1. Verify the product exists and has stock
    const productSnap = await t.get(productRef);
    if (!productSnap.exists) {
      throw new Error("Sorry, this item is no longer available.");
    }
    
    const productData = productSnap.data();
    if (!productData || productData.stock <= 0) {
      throw new Error(`Sorry, ${productData?.title || 'this item'} is currently out of stock.`);
    }

    // 2. Get the current cart
    const cartSnap = await t.get(cartRef);
    let items: WhatsAppCartItem[] = [];
    
    if (cartSnap.exists) {
      items = cartSnap.data()?.items || [];
    }

    // 3. Check if item is already in cart
    const existingItemIndex = items.findIndex(item => item.productId === productId);
    
    if (existingItemIndex > -1) {
      // Increment quantity if it doesn't exceed stock
      if (items[existingItemIndex].quantity < productData.stock) {
        items[existingItemIndex].quantity += 1;
      } else {
        throw new Error(`We only have ${productData.stock} of these in stock!`);
      }
    } else {
      // Add new item
      items.push({
        productId: productId,
        title: productData.title,
        price: productData.price,
        quantity: 1,
        sellerId: productData.sellerId || "SYSTEM",
        sellerPhone: productData.sellerPhone || "",
        image: productData.images?.[0] || productData.image || ""
      });
    }

    // 4. Calculate new subtotal
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const updatedCart = {
      phone: cleanPhone,
      items,
      subtotal,
      updatedAt: Date.now()
    };

    // 5. Save the cart
    t.set(cartRef, updatedCart, { merge: true });

    return updatedCart;
  });
}

// ==========================================
// 2. GET CURRENT CART
// ==========================================
export async function getWhatsAppCart(phone: string): Promise<WhatsAppCart | null> {
  const cleanPhone = normalizePhone(phone);
  const cartSnap = await adminDb.collection("whatsapp_carts").doc(cleanPhone).get();
  
  if (!cartSnap.exists) return null;
  return cartSnap.data() as WhatsAppCart;
}

// ==========================================
// 3. CLEAR CART (Used after successful checkout)
// ==========================================
export async function clearWhatsAppCart(phone: string): Promise<void> {
  const cleanPhone = normalizePhone(phone);
  await adminDb.collection("whatsapp_carts").doc(cleanPhone).delete();
}
