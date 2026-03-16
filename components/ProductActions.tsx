"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Product } from "@/types";

export default function ProductActions({ product }: { product: Product }) {
  const { user, signIn } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [contactPhone, setContactPhone] = useState("");
  const [copied, setCopied] = useState(false);

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
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    });
  };

  // 4. Fast Checkout Modals & Logic
  const handleBuyNowClick = () => {
    if (!user) {
      alert("Please log in to place an official order.");
      signIn();
      return;
    }
    setShowModal(true);
  };

  const executeFastCheckout = async () => {
    if (!user) return; 

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
          userId: user.id,
          productId: product.id,
          sellerId: product.sellerId || "SYSTEM",
          total: product.price,
          deliveryLocation: "Kabale Town (Fast Checkout)",
          contactPhone: contactPhone,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setShowModal(false);
        router.push(`/success/${data.orderId}`);
      } else {
        alert("Failed to place order: " + (data.error || "Unknown error"));
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong with the connection.");
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

  return (
    <>
      <div className="mt-8 flex flex-col gap-6">

        {/* --- PRIMARY ACTION: FAST CHECKOUT --- */}
        <div>
          <button 
            onClick={handleBuyNowClick}
            disabled={product.stock <= 0 || loading}
            className="w-full bg-slate-900 text-white py-4 px-8 rounded-xl font-bold text-lg hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
          >
            {loading ? "Processing..." : "Buy Now (Fast Checkout)"}
          </button>
        </div>

        <hr className="border-slate-200" />

        {/* --- SECONDARY ACTIONS --- */}
        <div className="flex flex-col gap-5">
          
          {/* BUY VIA WHATSAPP */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900">Buy via WhatsApp</h3>
              <p className="text-sm text-slate-500 mt-1 leading-snug">
                Prefer to chat? Message the seller directly to negotiate or ask questions.
              </p>
            </div>
            <button 
              onClick={handleBuyViaWhatsApp}
              disabled={product.stock <= 0 || !product.sellerPhone || loading}
              className="flex-shrink-0 bg-[#25D366] text-white p-3 md:px-5 md:py-3 rounded-xl font-bold text-sm hover:bg-green-600 transition-colors disabled:opacity-50 shadow-sm flex items-center gap-2"
            >
              <span className="hidden md:inline">Message</span> 💬
            </button>
          </div>

          <hr className="border-slate-100" />

          {/* SHARE TO WHATSAPP */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900">Share to WhatsApp</h3>
              <p className="text-sm text-slate-500 mt-1 leading-snug">
                Send this item directly to a friend or family member's chat.
              </p>
            </div>
            <button 
              onClick={handleShareToWhatsApp}
              disabled={loading}
              title="Share to WhatsApp"
              className="flex-shrink-0 flex items-center justify-center w-12 h-12 bg-[#25D366]/10 text-[#25D366] rounded-full hover:bg-[#25D366]/20 transition-colors border border-[#25D366]/20"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
            </button>
          </div>

          <hr className="border-slate-100" />

          {/* COPY LINK */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900">Copy Link</h3>
              <p className="text-sm text-slate-500 mt-1 leading-snug">
                Grab the link to post this product on Facebook, X, or other platforms.
              </p>
            </div>
            <button 
              onClick={handleCopyLink}
              disabled={loading}
              title="Copy Link"
              className="flex-shrink-0 flex items-center justify-center w-12 h-12 bg-slate-100 text-slate-700 rounded-full hover:bg-slate-200 transition-colors border border-slate-200 relative"
            >
              {copied ? "✓" : "🔗"}
            </button>
          </div>

        </div>

        {/* ADMIN DELETE */}
        {user?.role === "admin" && (
          <>
            <hr className="border-red-200 mt-4" />
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

      {/* FAST CHECKOUT MODAL (Unchanged logic, just keeping it here for completeness) */}
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
                onClick={() => { setShowModal(false); setContactPhone(""); }}
                disabled={loading}
                className="flex-1 bg-white border-2 border-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={executeFastCheckout}
                disabled={loading || !contactPhone.trim()}
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
