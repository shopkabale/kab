"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Product } from "@/types";
import { trackBeginCheckout } from "@/lib/analytics"; 

export default function FastBuy({ product }: { product: Product }) {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Form States
  const [buyerName, setBuyerName] = useState(""); 
  const [contactPhone, setContactPhone] = useState("");

  const price = Number(product.price) || 0;

  // Auto-fill name if logged in
  useEffect(() => {
    if (user?.displayName) setBuyerName(user.displayName);
  }, [user]);

  // ==========================================
  // FAST CHECKOUT LOGIC (100% Full Payment)
  // ==========================================
  const handleBuyNowClick = () => {
    trackBeginCheckout({
      id: product.id,
      name: product.name || "Unknown Item",
      price: price,
      category: product.category || "general"
    });
    setShowModal(true);
  };

  const executeFastCheckout = async () => {
    if (!buyerName.trim()) return alert("Please provide your name.");

    const cleanPhone = contactPhone.replace(/\D/g, ""); 
    if (cleanPhone.length < 10) {
      return alert("Please enter a valid MTN/Airtel number.");
    }

    setLoading(true);  

    // 🚀 UNIFIED MASTER ORDER PAYLOAD
    const masterOrderPayload = {
      buyerName: buyerName.trim(),
      contactPhone: cleanPhone,
      userId: user ? user.id : "GUEST",
      cartItems: [
        {
          productId: product.id,
          name: product.name || "Unknown Item",
          price: price,
          quantity: 1,
          sellerId: product.sellerId || "SYSTEM",
          sellerPhone: product.sellerPhone || "", 
          image: product.images?.[0] || ""
        }
      ]
    };

    try {  
      // 🚀 Routing straight to the new 100% Upfront Payment Engine
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(masterOrderPayload),
      });

      const data = await res.json();

      if (res.ok) {
        // Redirect to the real-time LivePay waiting screen
        router.push(`/checkout/waiting?orderId=${data.orderId}`);
      } else {
        alert(data.error || "Payment initiation failed. Please try again.");
        setLoading(false);
      }
    } catch (error) {  
      console.error(error);  
      alert("Something went wrong with the connection.");  
      setLoading(false);
    } 
  };

  return (
    <>
      <div className="flex flex-col gap-1.5 mt-8 mb-4">
        {/* 🟢 PRIMARY BUTTON */}
        <button   
          onClick={handleBuyNowClick}  
          disabled={loading}  
          className="w-full py-4 px-8 rounded-2xl font-black text-xl transition-all shadow-lg flex items-center justify-center gap-2 bg-[#D97706] text-white hover:bg-[#b46305] active:scale-[0.98]"  
        >  
          Buy Now (Mobile Money)
        </button>
        <p className="text-center text-xs font-bold text-slate-500 tracking-wide mt-1">
          ⚡ Secure your item instantly.
        </p>
      </div>

      {/* ========================================== */}
      {/* FAST CHECKOUT MODAL (Cleaned Up) */}
      {/* ========================================== */}
      {showModal && (  
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">  
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative overflow-hidden">  
            
            <div className="absolute top-0 left-0 w-full h-2 bg-[#D97706]"></div>  
            <h2 className="text-2xl font-black text-slate-900 mb-2">Fast Order</h2>  

            {/* 🧮 DYNAMIC SUMMARY BOX */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5 mt-4">  
              <p className="font-bold text-lg text-slate-900 leading-tight line-clamp-2">{product.name}</p>  

              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200">  
                <span className="text-sm font-bold text-slate-500">Total Price:</span>  
                <span className="font-black text-[#D97706] text-xl">UGX {price.toLocaleString()}</span>  
              </div>  
            </div>  

            <div className="space-y-4 mb-6">
              {/* Name */}
              <div>  
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Your Name</label>  
                <input 
                  required 
                  type="text" 
                  placeholder="e.g. John Doe" 
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#D97706]" 
                  value={buyerName} 
                  onChange={e => setBuyerName(e.target.value)} 
                />  
              </div>  

              {/* Phone */}
              <div>  
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  MTN/Airtel Mobile Money Number
                </label>  
                <input 
                  required 
                  type="tel" 
                  placeholder="e.g. 077... or 075..." 
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#D97706]" 
                  value={contactPhone} 
                  onChange={e => setContactPhone(e.target.value)} 
                />  
              </div>
            </div>  

            {/* Actions */}
            <div className="flex gap-3">  
              <button 
                onClick={() => setShowModal(false)} 
                disabled={loading} 
                className="flex-1 bg-white border-2 border-slate-200 text-slate-700 py-3.5 rounded-xl font-bold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>  
              <button 
                onClick={executeFastCheckout} 
                disabled={loading || !contactPhone.trim() || !buyerName.trim()} 
                className="flex-[2] bg-[#D97706] text-white py-3.5 rounded-xl font-bold hover:bg-amber-600 transition-all shadow-md disabled:opacity-50"
              >  
                {loading ? "Processing..." : "Pay Now"}  
              </button>  
            </div>  
            
          </div>  
        </div>  
      )}  
    </>
  );
}
