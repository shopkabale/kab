"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Product } from "@/types";

export default function QuickCartButton({ product }: { product: Product }) {
  const { user, signIn } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [contactPhone, setContactPhone] = useState("");

  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    
    if (!user) {
      alert("Please log in to place an order.");
      signIn();
      return;
    }
    setShowModal(true);
  };

  const executeFastCheckout = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return; 

    if (!contactPhone.trim()) {
      alert("Please provide your phone number for delivery.");
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

  return (
    <>
      {/* 🛒 RED CART BUTTON */}
      <button 
        onClick={handleCartClick}
        disabled={product.stock <= 0}
        className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center shadow-sm disabled:opacity-50 group relative z-10"
      >
        <svg className="w-4 h-4 text-red-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
        </svg>
      </button>

      {/* FAST CHECKOUT MODAL */}
      {showModal && (
        <div 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 cursor-default"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-[#D97706]"></div>
            
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Confirm Fast Checkout</h2>
            
            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-4 mt-4">
              <p className="font-bold text-lg text-slate-900 dark:text-white leading-tight line-clamp-2">{product.name}</p>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Pay on delivery:</span>
                <span className="font-black text-[#D97706] text-lg">UGX {Number(product.price).toLocaleString()}</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">WhatsApp / Phone Number</label>
              <input 
                required 
                type="tel" 
                placeholder="e.g. 077... or 075..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white px-4 py-3 outline-none focus:ring-2 focus:ring-[#D97706]"
                value={contactPhone} 
                onChange={e => setContactPhone(e.target.value)} 
              />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={(e) => { e.preventDefault(); setShowModal(false); }}
                className="flex-1 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-3 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={executeFastCheckout}
                disabled={loading || !contactPhone.trim()}
                className="flex-1 bg-[#D97706] text-white py-3 rounded-xl font-bold hover:bg-amber-600 disabled:opacity-50 transition-colors shadow-md"
              >
                {loading ? "Sending..." : "Order Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
