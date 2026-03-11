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
    // Dynamically grab the website URL and attach the product ID
    const url = `${window.location.origin}/item/${product.publicId || product.id}`;
    const message = encodeURIComponent(
      `Check out this ${product.name} for UGX ${Number(product.price).toLocaleString()} on Kabale Online! \n\nSee it here: ${url}`
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

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

  // ============================================================================
  // 3. ADMIN DELETE FUNCTION
  // ============================================================================
  const handleAdminDelete = async () => {
    if (!user || user.role !== "admin") return;
    
    const confirm = window.confirm("ADMIN ACTION: Are you sure you want to permanently delete this product from the marketplace?");
    if (!confirm) return;

    setLoading(true); // Disable buttons while deleting
    
    try {
      const res = await fetch(`/api/products/${product.id}?isAdmin=true&adminId=${user.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Product permanently removed.");
        router.push("/"); // Redirect to the homepage since this item is gone!
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
      <div className="space-y-3 mt-8">

        {/* BUY NOW (FAST CHECKOUT) */}
        <button 
          onClick={handleBuyNowClick}
          disabled={product.stock <= 0 || loading}
          className="w-full bg-slate-900 text-white py-4 px-8 rounded-xl font-bold text-lg hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
        >
          {loading ? "Processing..." : "Buy Now (Fast Checkout)"}
        </button>

        {/* BUY VIA WHATSAPP (Contact Seller) */}
        <button 
          onClick={handleBuyViaWhatsApp}
          disabled={product.stock <= 0 || !product.sellerPhone || loading}
          className="w-full bg-[#25D366] text-white py-4 px-8 rounded-xl font-bold text-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
        >
          💬 Buy via WhatsApp
        </button>

        {/* SHARE TO WHATSAPP (Contact Friends) */}
        <button 
          onClick={handleShareToWhatsApp}
          disabled={loading}
          className="w-full bg-slate-100 text-slate-700 py-4 px-8 rounded-xl font-bold text-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 shadow-sm border border-slate-200 disabled:opacity-50"
        >
          📤 Share to WhatsApp
        </button>

        {/* ADMIN DELETE */}
        {user?.role === "admin" && (
          <button 
            onClick={handleAdminDelete}
            disabled={loading}
            className="w-full mt-4 bg-red-50 border border-red-200 text-red-600 py-3 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? "Deleting..." : "🗑️ [Admin Action] Delete Product"}
          </button>
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
