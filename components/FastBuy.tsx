"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Product } from "@/types";
import { trackBeginCheckout } from "@/lib/analytics"; 
import { calculateDepositAmount } from "@/lib/utils";

export default function FastBuy({ product }: { product: Product }) {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Form States
  const [buyerName, setBuyerName] = useState(""); 
  const [contactPhone, setContactPhone] = useState("");

  // 🧮 DEPOSIT CALCULATIONS
  const price = Number(product.price) || 0;
  // Passing 'false' for admin restricted by default, adjust if your product type supports it
  const depositRequired = calculateDepositAmount(price, false); 
  const balanceOnDelivery = price - depositRequired;

  // ==========================================
  // FAST CHECKOUT LOGIC
  // ==========================================
  const handleBuyNowClick = () => {
    if (user && user.displayName) setBuyerName(user.displayName);

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
      return alert("Please enter a valid phone/WhatsApp number.");
    }

    setLoading(true);  

    try {  
      if (depositRequired > 0) {
        // 🚀 FLOW A: DEPOSIT REQUIRED (LIVEPAY API)
        const res = await fetch("/api/payments/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user ? user.id : "GUEST",
            buyerName: buyerName.trim(),
            productId: product.id,
            contactPhone: cleanPhone,
          }),
        });

        const data = await res.json();

        if (res.ok) {
          // Redirect to the real-time waiting screen with the Firestore Order ID
          router.push(`/checkout/waiting?orderId=${data.orderId}`);
        } else {
          alert(data.error || "Payment initiation failed. Please try again.");
          setLoading(false);
        }

      } else {
        // 🚚 FLOW B: PURE COD (EXISTING LOGIC)
        const res = await fetch("/api/orders", {  
          method: "POST",  
          headers: { "Content-Type": "application/json" },  
          body: JSON.stringify({  
            userId: user ? user.id : "GUEST",  
            buyerName: buyerName.trim(), 
            productId: product.id,  
            sellerId: product.sellerId || "SYSTEM",  
            total: price, 
            contactPhone: cleanPhone
          }),  
        });  

        const data = await res.json();  

        if (res.ok && data.success) {  
          setShowSuccess(true);
          setTimeout(() => {
            router.push(`/success/${data.orderId}`);
          }, 3000); 
        } else {  
          alert(data.error || "Failed to place order.");  
          setShowModal(false);
        }  
      }
    } catch (error) {  
      console.error(error);  
      alert("Something went wrong with the connection.");  
    } finally {
      // Only disable loading if it's COD or it failed. If deposit is required, 
      // we leave loading true to prevent double-clicks while redirecting.
      if (depositRequired === 0) setLoading(false); 
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
          Buy Now (Fast Order)
        </button>
        <p className="text-center text-xs font-bold text-slate-500 tracking-wide mt-1">
          {depositRequired > 0 
            ? "⚡ Small deposit required to secure this item." 
            : "⚡ No account needed. Confirm instantly via WhatsApp."}
        </p>
      </div>

      {/* ========================================== */}
      {/* FAST CHECKOUT MODAL */}
      {/* ========================================== */}
      {showModal && (  
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">  
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative overflow-hidden">  

            {showSuccess ? (
              // 🔥 SUCCESS STATE UI (COD ONLY)
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">✅</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-3">Order Sent!</h2>
                <p className="text-lg text-slate-600 font-medium">
                  We've sent your order to WhatsApp for confirmation.
                </p>
                <p className="text-sm text-slate-400 mt-4 animate-pulse">Redirecting...</p>
              </div>
            ) : (
              // 📝 FORM UI
              <>
                <div className="absolute top-0 left-0 w-full h-2 bg-[#D97706]"></div>  
                <h2 className="text-2xl font-black text-slate-900 mb-2">Fast Order</h2>  

                {/* 🧮 DYNAMIC SUMMARY BOX */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5 mt-4">  
                  <p className="font-bold text-lg text-slate-900 leading-tight line-clamp-2">{product.name}</p>  
                  
                  {depositRequired > 0 ? (
                    // DEPOSIT UI
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-slate-500">Total Price:</span>
                        <span className="font-bold text-slate-700">UGX {price.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm font-bold text-green-700">Pay Now (Deposit):</span>
                        <span className="font-black text-green-600 text-lg">UGX {depositRequired.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
                        <span>Balance on Delivery:</span>
                        <span>UGX {balanceOnDelivery.toLocaleString()}</span>
                      </div>
                    </div>
                  ) : (
                    // PURE COD UI
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200">  
                      <span className="text-sm font-medium text-slate-500">Total (COD):</span>  
                      <span className="font-black text-[#D97706] text-lg">UGX {price.toLocaleString()}</span>  
                    </div>  
                  )}
                </div>  

                <div className="space-y-4 mb-6">
                  {/* Name */}
                  <div>  
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Your Name</label>  
                    <input required type="text" placeholder="e.g. John Doe" className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#D97706]" value={buyerName} onChange={e => setBuyerName(e.target.value)} />  
                  </div>  

                  {/* Phone */}
                  <div>  
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      {depositRequired > 0 ? "MTN/Airtel Mobile Money Number" : "WhatsApp Number"}
                    </label>  
                    <input required type="tel" placeholder="e.g. 077... or 075..." className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#D97706]" value={contactPhone} onChange={e => setContactPhone(e.target.value)} />  
                  </div>
                </div>  

                {/* Actions */}
                <div className="flex gap-3">  
                  <button onClick={() => setShowModal(false)} disabled={loading} className="flex-1 bg-white border-2 border-slate-200 text-slate-700 py-3.5 rounded-xl font-bold hover:bg-slate-50 transition-colors">Cancel</button>  
                  <button onClick={executeFastCheckout} disabled={loading || !contactPhone.trim() || !buyerName.trim()} className="flex-[2] bg-[#D97706] text-white py-3.5 rounded-xl font-bold hover:bg-amber-600 transition-all shadow-md disabled:opacity-50">  
                    {loading ? "Processing..." : depositRequired > 0 ? "Pay Deposit" : "Submit Order"}  
                  </button>  
                </div>  
              </>
            )}

          </div>  
        </div>  
      )}  
    </>
  );
}
