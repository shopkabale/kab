"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Product } from "@/types";
import { doc, getDoc } from "firebase/firestore"; 
import { db } from "@/lib/firebase/config";

export default function FastBuy({ product }: { product: Product }) {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Form States
  const [buyerName, setBuyerName] = useState(""); 
  const [contactPhone, setContactPhone] = useState("");
  const [location, setLocation] = useState("");
  const [quantity, setQuantity] = useState(1);

  // Live Stock States
  const [currentStock, setCurrentStock] = useState(Number(product.stock) || 0);
  const [isLocked, setIsLocked] = useState((product as any).locked === true);
  const [productStatus, setProductStatus] = useState(product.status);

  // Your Official Bot Number for the Secondary Button
  const botPhoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER || "256740373021";

  useEffect(() => {
    const fetchLiveStock = async () => {
      try {
        const docRef = doc(db, "products", product.id);
        const snap = await getDoc(docRef);
        
        if (snap.exists()) {
          const liveData = snap.data();
          setCurrentStock(Number(liveData.stock) || 0);
          setIsLocked(liveData.locked === true);
          setProductStatus(liveData.status);
        }
      } catch (error) {
        console.error("Failed to fetch live stock from database:", error);
      }
    };
    fetchLiveStock();
  }, [product.id]); 

  const isSoldOut = currentStock <= 0 || productStatus === "sold_out";
  const isReserved = isLocked;
  const isUnavailable = isSoldOut || isReserved;

  // ==========================================
  // ACTION 1: SECONDARY BUTTON (Low Intent)
  // ==========================================
  const handleBotInquiry = () => {
    const rawMessage = `Hi! I am interested in this item on Kabale Online: *${product.name}*\n\nProduct ID: [${product.id}]`;
    const encodedMessage = encodeURIComponent(rawMessage);
    window.open(`https://wa.me/${botPhoneNumber}?text=${encodedMessage}`, "_blank");
  };

  // ==========================================
  // ACTION 2: PRIMARY BUTTON (High Intent)
  // ==========================================
  const handleBuyNowClick = () => {
    if (user && user.displayName) setBuyerName(user.displayName);
    setShowModal(true);
  };

  const executeFastCheckout = async () => {
    if (!buyerName.trim()) return alert("Please provide your name.");
    if (!location.trim()) return alert("Please provide your delivery location (e.g., Kabale Town).");
    
    const cleanPhone = contactPhone.replace(/\D/g, ""); 
    if (cleanPhone.length < 10) {
      return alert("Please enter a valid phone/WhatsApp number.");
    }

    setLoading(true);  

    try {  
      const res = await fetch("/api/orders", {  
        method: "POST",  
        headers: { "Content-Type": "application/json" },  
        body: JSON.stringify({  
          userId: user ? user.id : "GUEST",  
          buyerName: buyerName.trim(), 
          productId: product.id,  
          sellerId: product.sellerId || "SYSTEM",  
          total: product.price * quantity,  // Calculate total based on quantity
          contactPhone: cleanPhone,
          location: location.trim(),
          quantity: quantity
        }),  
      });  

      const data = await res.json();  

      if (res.ok && data.success) {  
        // 🔥 Trigger the success UI state
        setShowSuccess(true);
        setTimeout(() => {
          router.push(`/success/${data.orderId}`);
        }, 3000); // Redirect after showing the WhatsApp confirmation message
      } else {  
        alert(data.error || "Failed to place order. The item might have just been taken.");  
        setShowModal(false);
      }  
    } catch (error) {  
      console.error(error);  
      alert("Something went wrong with the connection.");  
    } finally {
      setLoading(false);  
    }
  };

  return (
    <>
      <div className="mt-8 flex flex-col gap-4">
        
        {/* 🟢 PRIMARY BUTTON (High Intent) */}
        <div className="flex flex-col gap-1.5">
          <button   
            onClick={handleBuyNowClick}  
            disabled={isUnavailable || loading}  
            className={`w-full py-4 px-8 rounded-2xl font-black text-xl transition-all shadow-lg flex items-center justify-center gap-2 ${
              isUnavailable 
                ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none" 
                : "bg-[#D97706] text-white hover:bg-[#b46305] active:scale-[0.98]"
            }`}  
          >  
            {isUnavailable ? (isSoldOut ? "❌ Sold Out" : "⚡ Reserved") : "Buy Now (Fast Order)"}
          </button>
          {!isUnavailable && (
            <p className="text-center text-xs font-bold text-slate-500 tracking-wide">
              ⚡ No account needed. Confirm instantly via WhatsApp.
            </p>
          )}
        </div>

        {/* 🟡 SECONDARY BUTTON (Low Intent / Questions) */}
        <button   
          onClick={handleBotInquiry}  
          disabled={isUnavailable || loading}  
          className={`w-full py-3.5 px-8 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 border-2 ${
            isUnavailable 
              ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed" 
              : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
          }`}  
        >  
          💬 Ask Seller on WhatsApp
        </button>

      </div>  

      {/* ========================================== */}
      {/* FAST CHECKOUT MODAL */}
      {/* ========================================== */}
      {showModal && (  
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">  
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative overflow-hidden">  
            
            {showSuccess ? (
              // 🔥 SUCCESS STATE UI
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

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5 mt-4">  
                  <p className="font-bold text-lg text-slate-900 leading-tight line-clamp-2">{product.name}</p>  
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200">  
                    <span className="text-sm font-medium text-slate-500">Total (COD):</span>  
                    <span className="font-black text-[#D97706] text-lg">UGX {(Number(product.price) * quantity).toLocaleString()}</span>  
                  </div>  
                </div>  

                <div className="space-y-4 mb-6">
                  {/* Name */}
                  <div>  
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Your Name</label>  
                    <input required type="text" placeholder="e.g. John Doe" className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#D97706]" value={buyerName} onChange={e => setBuyerName(e.target.value)} />  
                  </div>  

                  {/* Phone */}
                  <div>  
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">WhatsApp Number</label>  
                    <input required type="tel" placeholder="e.g. 077... or 075..." className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#D97706]" value={contactPhone} onChange={e => setContactPhone(e.target.value)} />  
                  </div>

                  {/* Location */}
                  <div>  
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Delivery Location</label>  
                    <input required type="text" placeholder="e.g. Kabale University Gate" className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#D97706]" value={location} onChange={e => setLocation(e.target.value)} />  
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Quantity</label>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200">-</button>
                      <span className="font-bold text-lg w-8 text-center">{quantity}</span>
                      <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200">+</button>
                    </div>
                  </div>
                </div>  

                {/* Actions */}
                <div className="flex gap-3">  
                  <button onClick={() => setShowModal(false)} disabled={loading} className="flex-1 bg-white border-2 border-slate-200 text-slate-700 py-3.5 rounded-xl font-bold hover:bg-slate-50 transition-colors">Cancel</button>  
                  <button onClick={executeFastCheckout} disabled={loading || !contactPhone.trim() || !buyerName.trim() || !location.trim()} className="flex-[2] bg-[#D97706] text-white py-3.5 rounded-xl font-bold hover:bg-amber-600 transition-all shadow-md disabled:opacity-50">  
                    {loading ? "Processing..." : "Submit Order"}  
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
