"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { Product } from "@/types";

export default function CheckoutForm({ product }: { product: Product }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    contactPhone: "",
    deliveryLocation: "",
  });

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Please log in to place an order.");
    
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          productId: product.id,
          sellerId: product.sellerId,
          total: product.price,
          contactPhone: formData.contactPhone,
          deliveryLocation: formData.deliveryLocation,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Redirect to the success page!
        router.push(`/success/${data.orderId}`);
      } else {
        alert(data.error || "Failed to place order.");
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
      setLoading(false);
    }
  };

  if (authLoading) return <div className="py-20 text-center">Loading...</div>;

  if (!user) {
    return (
      <div className="py-20 text-center px-4 max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Log in to Order</h2>
        <p className="text-slate-600 mb-8">You must be logged in to securely place a Cash on Delivery order.</p>
        <Link href={`/item/${product.publicId || product.id}`} className="text-primary font-bold hover:underline">
          Go back to product
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-8">Secure Checkout</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column: The Form */}
        <form onSubmit={handlePlaceOrder} className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4">Delivery Details</h2>
          
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Phone / WhatsApp Number *</label>
            <input 
              required 
              type="tel" 
              placeholder="e.g. 077... or 075..."
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
              value={formData.contactPhone} 
              onChange={e => setFormData({...formData, contactPhone: e.target.value})} 
            />
            <p className="text-xs text-slate-500 mt-1">The seller will use this to call you for delivery.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Delivery Location in Kabale *</label>
            <textarea 
              required 
              rows={3}
              placeholder="e.g. Kabale University Main Gate, Hostel Name, or specific street..."
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-primary resize-none"
              value={formData.deliveryLocation} 
              onChange={e => setFormData({...formData, deliveryLocation: e.target.value})} 
            />
          </div>

          <button 
            disabled={loading} 
            type="submit" 
            className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-sky-500 transition-colors disabled:opacity-70 shadow-md"
          >
            {loading ? "Processing..." : "Confirm & Place Order"}
          </button>
          <p className="text-xs text-center text-slate-500 font-medium">🛡️ You only pay when the item is in your hands.</p>
        </form>

        {/* Right Column: Order Summary */}
        <div className="bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-200 h-fit">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Order Summary</h2>
          
          <div className="flex gap-4 mb-6 border-b border-slate-200 pb-6">
            <div className="w-20 h-20 bg-white rounded-lg border border-slate-200 overflow-hidden relative flex-shrink-0">
              {product.images && product.images.length > 0 ? (
                <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
              ) : (
                <span className="text-[10px] text-slate-400 absolute inset-0 flex items-center justify-center">No Img</span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 line-clamp-2">{product.name}</h3>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{product.condition || "Used"}</p>
            </div>
          </div>

          <div className="space-y-3 text-sm mb-6">
            <div className="flex justify-between text-slate-600">
              <span>Item Price</span>
              <span>UGX {product.price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Delivery Fee</span>
              <span className="text-green-600 font-medium">Negotiated with Seller</span>
            </div>
          </div>

          <div className="flex justify-between items-center border-t border-slate-200 pt-4">
            <span className="font-bold text-slate-900">Total to Pay</span>
            <span className="text-xl font-black text-primary">UGX {product.price.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}