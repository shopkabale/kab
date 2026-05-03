"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config"; // Your existing client config
import { FaShieldAlt, FaWhatsapp, FaLock } from "react-icons/fa";

export default function WhatsAppCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const rawPhone = params?.phone as string;
  
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Form States
  const [buyerName, setBuyerName] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // 1. Fetch the WhatsApp Cart
  useEffect(() => {
    async function fetchCart() {
      if (!rawPhone) return;
      
      try {
        const cartRef = doc(db, "whatsapp_carts", rawPhone);
        const cartSnap = await getDoc(cartRef);
        
        if (cartSnap.exists()) {
          setCart(cartSnap.data());
          // Auto-fill the phone number from their WhatsApp
          setContactPhone(cartSnap.data().phone || rawPhone);
        }
      } catch (error) {
        console.error("Error fetching cart:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchCart();
  }, [rawPhone]);

  // 2. Execute Payment (Matches your existing CartPage logic exactly)
  const handlePayment = async () => {
    if (!buyerName.trim()) return alert("Please enter your name for delivery.");
    
    const cleanPhone = contactPhone.replace(/\D/g, ""); 
    if (cleanPhone.length < 10) {
      return alert("Please enter a valid MTN/Airtel number.");
    }

    setProcessing(true);

    // Format the payload exactly how your LivePay API expects it
    const masterOrderPayload = {
      buyerName: buyerName.trim(),
      contactPhone: cleanPhone,
      userId: "WHATSAPP_GUEST", // Tagging them as a WhatsApp user
      referralCodeUsed: null,
      cartItems: cart.items.map((item: any) => ({
        productId: item.productId,
        name: item.title,
        price: item.price,
        quantity: item.quantity,
        sellerId: item.sellerId || "SYSTEM", 
        sellerPhone: item.sellerPhone || "", 
        image: item.image || ""
      }))
    };

    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(masterOrderPayload),
      });

      const data = await res.json();

      if (res.ok) {
        // 🧹 Clear the ghost cart so they don't double-pay later
        await deleteDoc(doc(db, "whatsapp_carts", rawPhone));
        
        // 🚀 Push to the LivePay waiting screen
        router.push(`/checkout/waiting?orderId=${data.orderId}`);
      } else {
        alert(data.error || "Payment initiation failed. Please try again.");
        setProcessing(false);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong with the connection.");
      setProcessing(false);
    }
  };

  // ==========================================
  // UI RENDERING
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[#FF6A00] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-medium">Loading secure checkout...</p>
        </div>
      </div>
    );
  }

  // If the cart is empty or they already paid
  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-6">
          <FaWhatsapp className="text-4xl text-slate-400" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">Cart Empty or Expired</h1>
        <p className="text-slate-600 mb-8 max-w-sm">
          It looks like you've already paid for this order, or your cart is empty. 
        </p>
        <a 
          href="https://wa.me/256740373021" 
          className="bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3.5 px-8 rounded-xl shadow-md transition-all flex items-center gap-2"
        >
          <FaWhatsapp className="text-xl" /> Return to WhatsApp
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col sm:justify-center items-center p-0 sm:p-6">
      <div className="w-full max-w-md bg-white sm:rounded-3xl shadow-xl overflow-hidden min-h-screen sm:min-h-0 relative">
        
        {/* Brand Header */}
        <div className="bg-[#111111] p-6 text-center relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#FF6A00]"></div>
          <h1 className="text-white text-xl font-black tracking-tight flex items-center justify-center gap-2">
            Kabale Online <FaLock className="text-[#FF6A00] text-sm" />
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-medium">Secure WhatsApp Checkout</p>
        </div>

        <div className="p-6 sm:p-8">
          {/* Order Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 border-b border-slate-200 pb-3">
              Order Summary
            </h2>
            
            <div className="space-y-3 mb-4">
              {cart.items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-500">{item.quantity}x</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[180px]">
                      {item.title}
                    </span>
                  </div>
                  <span className="font-bold text-slate-600">
                    {(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <span className="text-slate-500 font-bold">Total to Pay</span>
              <span className="text-2xl font-black text-[#FF6A00]">
                UGX {cart.subtotal.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="space-y-4 mb-8">
            <div>  
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Delivery Name</label>  
              <input 
                required 
                type="text" 
                placeholder="e.g. Samuel Ampeire" 
                className="w-full rounded-xl border border-slate-300 px-4 py-3.5 outline-none focus:ring-2 focus:ring-[#FF6A00] bg-white transition-all font-medium" 
                value={buyerName} 
                onChange={e => setBuyerName(e.target.value)} 
              />  
            </div>  

            <div>  
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                MTN/Airtel Money Number
              </label>  
              <input 
                required 
                type="tel" 
                placeholder="077... or 075..." 
                className="w-full rounded-xl border border-slate-300 px-4 py-3.5 outline-none focus:ring-2 focus:ring-[#FF6A00] bg-white transition-all font-medium text-lg tracking-wide" 
                value={contactPhone} 
                onChange={e => setContactPhone(e.target.value)} 
              />  
            </div>
          </div>

          {/* Action Button */}
          <button 
            onClick={handlePayment} 
            disabled={processing || !contactPhone.trim() || !buyerName.trim()} 
            className="w-full bg-[#FF6A00] hover:bg-[#e65c00] text-white py-4 rounded-xl font-black text-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >  
            {processing ? "Processing..." : "Pay Now"}  
          </button>

          {/* Trust Badge */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs font-bold text-slate-400">
            <FaShieldAlt className="text-green-500" />
            Protected by Kabale Online Security
          </div>
        </div>
      </div>
    </div>
  );
}
