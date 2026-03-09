"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function ProductCard({ product }: { product: any }) {
  const { user, signIn } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [contactPhone, setContactPhone] = useState("");

  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Stops the Link from opening the product page
    if (!user) {
      alert("Please log in to place an official order.");
      signIn();
      return;
    }
    setShowModal(true);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    alert("Wishlist feature coming soon!");
  };

  const executeFastCheckout = async () => {
    if (!user) return; 
    if (!contactPhone.trim()) {
      alert("Please provide your phone number.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          productId: product.id || product.publicId,
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
        alert("Failed to place order.");
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      alert("Connection error.");
      setLoading(false);
    }
  };

  return (
    <>
      <Link 
        href={`/product/${product.publicId || product.id}`}
        className="flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all group"
      >
        <div className="relative aspect-square bg-slate-100 overflow-hidden">
          {product.images && product.images.length > 0 ? (
            <Image
              src={product.images[0]}
              alt={product.name || "Product"}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs font-bold">No Image</div>
          )}
          
          <button onClick={handleFavoriteClick} className="absolute top-2 right-2 w-7 h-7 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors shadow-sm z-10">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          </button>
        </div>

        <div className="flex flex-col flex-grow p-3 relative">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1 truncate">
            {product.sellerName || "Verified Vendor"}
          </p>
          <h3 className="text-xs font-bold text-slate-900 line-clamp-2 mb-2 leading-tight">
            {product.name}
          </h3>
          <div className="mt-auto flex items-center justify-between">
            <span className="text-sm font-black text-[#D97706]">
              UGX {Number(product.price).toLocaleString()}
            </span>
            <button 
              onClick={handleCartClick}
              className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-[#D97706] hover:text-white transition-colors z-10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </button>
          </div>
        </div>
      </Link>

      {/* FAST CHECKOUT MODAL OVERLAY */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-black text-slate-900 mb-2">Fast Checkout</h2>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 mt-2">
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
                placeholder="077... or 075..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#D97706]"
                value={contactPhone} 
                onChange={e => setContactPhone(e.target.value)} 
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 bg-white border-2 border-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={executeFastCheckout} disabled={loading || !contactPhone.trim()} className="flex-1 bg-[#D97706] text-white py-3 rounded-xl font-bold hover:bg-amber-600 transition-colors disabled:opacity-50">
                {loading ? "Sending..." : "Order Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
