"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Product } from "@/types";

export default function ProductActions({ product }: { product: Product }) {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Checkout States
  const [contactPhone, setContactPhone] = useState("");
  const [buyerName, setBuyerName] = useState(""); 
  const [copied, setCopied] = useState(false);

  // Status checks
  const isSoldOut = product.stock <= 0 || product.status === "sold_out";
  const isReserved = product.locked === true;
  const isUnavailable = isSoldOut || isReserved;

  const formatWhatsAppNumber = (phone: string) => {
    if (!phone) return "";
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) {
      return `256${cleanPhone.slice(1)}`;
    }
    return cleanPhone;
  };

  // 1. WhatsApp the SELLER (To Buy)
  const handleBuyViaWhatsApp = () => {
    if (!product.sellerPhone) {
      alert("This seller did not provide a WhatsApp number.");
      return;
    }
    const phone = formatWhatsAppNumber(product.sellerPhone);
    const message = encodeURIComponent(
      `Hello ${product.sellerName || "there"}, I am interested in buying your item on Kabale Online:\n\n*${product.name}*\nPrice: UGX ${Number(product.price).toLocaleString()}\nID: ${product.publicId || product.id}\n\nIs it still available?`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  };

  // 2. WhatsApp a FRIEND (To Share)
  const handleShareToWhatsApp = () => {
    const url = `${window.location.origin}/product/${product.publicId || product.id}`;
    const message = encodeURIComponent(
      `Check out this ${product.name} for UGX ${Number(product.price).toLocaleString()} on Kabale Online! \n\nSee it here: ${url}`
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  // 3. Copy Link to Clipboard
  const handleCopyLink = () => {
    const url = `${window.location.origin}/product/${product.publicId || product.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); 
    });
  };

  // 4. Fast Checkout Modals & Logic
  const handleBuyNowClick = () => {
    if (user && user.displayName) {
      setBuyerName(user.displayName);
    }
    setShowModal(true);
  };

  const executeFastCheckout = async () => {
    if (!buyerName.trim()) {
      alert("Please provide your name so the seller knows who to ask for.");
      return;
    }

    if (!contactPhone.trim()) {  
      alert("Please provide your phone number so the seller can call you for delivery.");  
      return;  
    }  

    setLoading(true);  

    try {  
      const res = await fetch("/api/orders", {  
        method: "POST",  
        headers: { "Content-Type": "application/json" },  
        body: JSON.stringify({  
          userId: user ? user.id : "GUEST",  
          buyerName: buyerName, 
          productId: product.id,  
          sellerId: product.sellerId || "SYSTEM",  
          total: product.price,  
          contactPhone: contactPhone,  
        }),  
      });  

      const data = await res.json();  

      if (res.ok && data.success) {  
        setShowModal(false);  
        router.push(`/success/${data.orderId}`);  
      } else {  
        // Handle specific lock/stock errors gracefully
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

  // 5. ADMIN DELETE FUNCTION
  const handleAdminDelete = async () => {
    if (!user || user.role !== "admin") return;

    const confirm = window.confirm("ADMIN ACTION: Are you sure you want to permanently delete this product from the marketplace?");  
    if (!confirm) return;  

    setLoading(true);  

    try {  
      const res = await fetch(`/api/products/${product.id}?isAdmin=true&adminId=${user.id}`, {  
        method: "DELETE",  
      });  

      if (res.ok) {  
        alert("Product permanently removed.");  
        router.push("/");  
      } else {  
        alert("Failed to delete product.");  
        setLoading(false);  
      }  
    } catch (error) {  
      console.error(error);  
      alert("Something went wrong connecting to the database.");  
      setLoading(false);  
    }
  };

  // Determine Primary Button Label & Styles
  let primaryButtonLabel = "Buy Now (Fast Checkout)";
  let primaryButtonClass = "bg-slate-900 text-white hover:bg-slate-800";

  if (loading) {
    primaryButtonLabel = "Processing...";
  } else if (isSoldOut) {
    primaryButtonLabel = "❌ Sold Out";
    primaryButtonClass = "bg-slate-200 text-slate-500 cursor-not-allowed";
  } else if (isReserved) {
    primaryButtonLabel = "⚡ Reserved (Pending Order)";
    primaryButtonClass = "bg-amber-100 text-amber-700 border border-amber-300 cursor-not-allowed";
  }

  return (
    <>
      <div className="mt-8 flex flex-col gap-6">

        {/* --- PRIMARY ACTION: FAST CHECKOUT --- */}  
        <div>  
          <button   
            onClick={handleBuyNowClick}  
            disabled={isUnavailable || loading}  
            className={`w-full py-4 px-8 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-md ${primaryButtonClass}`}  
          >  
            {primaryButtonLabel}  
          </button>  
        </div>  

        <hr className="border-slate-200" />  

        {/* --- SECONDARY ACTIONS --- */}  
        <div className="flex flex-col gap-6">  

          {/* BUY VIA WHATSAPP (Disabled if unavailable) */}  
          <div className="flex flex-col gap-2">  
            <p className="text-sm font-medium text-slate-500 text-center">  
              Prefer to chat? Message the seller directly to negotiate or ask questions.  
            </p>  
            <button   
              onClick={handleBuyViaWhatsApp}  
              disabled={isUnavailable || !product.sellerPhone || loading}  
              className={`w-full py-3 px-4 rounded-xl font-bold text-md transition-colors shadow-sm flex items-center justify-center gap-2 ${
                isUnavailable 
                  ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed" 
                  : "bg-[#25D366] text-white hover:bg-green-600"
              }`}  
            >  
              💬 Tap to Chat  
            </button>  
          </div>  

          <hr className="border-slate-100" />  

          {/* SHARE TO WHATSAPP (Always available) */}  
          <div className="flex flex-col gap-2">  
            <p className="text-sm font-medium text-slate-500 text-center">  
              Send this item directly to a friend or family member's chat.  
            </p>  
            <button   
              onClick={handleShareToWhatsApp}  
              disabled={loading}  
              className="w-full bg-slate-100 text-[#25D366] border border-slate-200 py-3 px-4 rounded-xl font-bold text-md hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 shadow-sm"  
            >  
              📤 Tap to Share  
            </button>  
          </div>  

          <hr className="border-slate-100" />  

          {/* COPY LINK (Always available) */}  
          <div className="flex flex-col gap-2">  
            <p className="text-sm font-medium text-slate-500 text-center">  
              Grab the link to post this product on Facebook, X, or other platforms.  
            </p>  
            <button   
              onClick={handleCopyLink}  
              disabled={loading}  
              className={`w-full py-3 px-4 rounded-xl font-bold text-md transition-colors flex items-center justify-center gap-2 shadow-sm border ${  
                copied   
                  ? "bg-green-50 text-green-700 border-green-200"   
                  : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"  
              }`}  
            >  
              {copied ? "✅ Link Copied!" : "🔗 Click to Copy"}  
            </button>  
          </div>  

        </div>  

        {/* ADMIN DELETE */}  
        {user?.role === "admin" && (  
          <>  
            <hr className="border-red-200 mt-2" />  
            <button   
              onClick={handleAdminDelete}  
              disabled={loading}  
              className="w-full bg-red-50 border border-red-200 text-red-600 py-3 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"  
            >  
              {loading ? "Deleting..." : "🗑️ [Admin Action] Delete Product"}  
            </button>  
          </>  
        )}  
      </div>  

      {/* FAST CHECKOUT MODAL */}  
      {showModal && (  
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">  
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative overflow-hidden">  
            <div className="absolute top-0 left-0 w-full h-2 bg-[#D97706]"></div>  

            <h2 className="text-2xl font-black text-slate-900 mb-2">Confirm Fast Checkout</h2>  

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 mt-4">  
              <p className="font-bold text-lg text-slate-900 leading-tight line-clamp-2">{product.name}</p>  
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200">  
                <span className="text-sm font-medium text-slate-500">Pay on delivery:</span>  
                <span className="font-black text-[#D97706] text-lg">UGX {Number(product.price).toLocaleString()}</span>  
              </div>  
            </div>  

            <div className="mb-4">  
              <label className="block text-sm font-semibold text-slate-900 mb-2">Your Name *</label>  
              <input   
                required   
                type="text"   
                placeholder="e.g. John Doe"  
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#D97706] transition-shadow"  
                value={buyerName}   
                onChange={e => setBuyerName(e.target.value)}   
              />  
            </div>  

            <div className="mb-6">  
              <label className="block text-sm font-semibold text-slate-900 mb-2">Your Phone / WhatsApp Number *</label>  
              <input   
                required   
                type="tel"   
                placeholder="e.g. 077... or 075..."  
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#D97706] transition-shadow"  
                value={contactPhone}   
                onChange={e => setContactPhone(e.target.value)}   
              />  
              <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">  
                The seller will be immediately notified to reserve this item and will call this number to arrange delivery in Kabale.  
              </p>  
            </div>  

            <div className="flex gap-3">  
              <button   
                onClick={() => { setShowModal(false); setContactPhone(""); setBuyerName(""); }}  
                disabled={loading}  
                className="flex-1 bg-white border-2 border-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors"  
              >  
                Cancel  
              </button>  
              <button   
                onClick={executeFastCheckout}  
                disabled={loading || !contactPhone.trim() || !buyerName.trim()}  
                className="flex-1 bg-[#D97706] text-white py-3 rounded-xl font-bold hover:bg-amber-600 transition-colors shadow-md disabled:opacity-50"  
              >  
                {loading ? "Sending..." : "Proceed & Order"}  
              </button>  
            </div>  
          </div>  
        </div>  
      )}  
    </>
  );
}
