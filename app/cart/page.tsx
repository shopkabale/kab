"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaTrash, FaArrowLeft, FaShieldAlt } from "react-icons/fa";

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Form States
  const [buyerName, setBuyerName] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // Auto-fill name if logged in
  useEffect(() => {
    if (user?.displayName) setBuyerName(user.displayName);
  }, [user]);

  // ==========================================
  // UNIFIED CART CHECKOUT (100% Full Payment)
  // ==========================================
  const handleCheckoutClick = () => {
    if (cart.length === 0) return;
    setShowModal(true);
  };

  const executeCartCheckout = async () => {
    if (!buyerName.trim()) return alert("Please provide your name.");

    const cleanPhone = contactPhone.replace(/\D/g, ""); 
    if (cleanPhone.length < 10) {
      return alert("Please enter a valid MTN/Airtel number.");
    }

    setLoading(true);

    // 🚀 UNIFIED MASTER PAYLOAD (Mapping the cart array)
    const masterOrderPayload = {
      buyerName: buyerName.trim(),
      contactPhone: cleanPhone,
      userId: user ? user.id : "GUEST",
      cartItems: cart.map(item => ({
        productId: item.id,
        name: item.title,
        price: item.price,
        quantity: item.quantity,
        sellerId: (item as any).sellerId || "SYSTEM", 
        sellerPhone: item.sellerPhone || "", 
        image: item.image || ""
      }))
    };

    try {  
      // 🚀 Send the whole cart straight to the LivePay engine
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(masterOrderPayload),
      });

      const data = await res.json();

      if (res.ok) {
        // Clear local cart since the order is now safely in the DB
        clearCart(); 
        setShowModal(false);
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

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <div className="text-6xl mb-4">🛒</div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Your cart is empty</h1>
        <p className="text-slate-500 mb-6">Looks like you haven't added anything yet.</p>
        <Link href="/" className="bg-[#D97706] hover:bg-amber-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 bg-white min-h-screen relative">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Shopping Cart</h1>
        <Link href="/" className="text-sm font-bold text-slate-500 hover:text-[#D97706] flex items-center gap-2">
          <FaArrowLeft /> Continue Shopping
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items List */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {cart.map((item) => (
            <div key={item.id} className="flex gap-4 p-4 border border-slate-200 rounded-xl bg-slate-50 relative">
              <div className="w-24 h-24 bg-white rounded-lg border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {item.image ? (
                  <img src={item.image} alt={item.title} className="max-h-full object-contain p-2" />
                ) : (
                  <span className="text-xs text-slate-400">No img</span>
                )}
              </div>

              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 leading-tight pr-8">{item.title}</h3>
                  <p className="text-[#D97706] font-extrabold mt-1">UGX {item.price.toLocaleString()}</p>
                </div>

                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center border border-slate-300 rounded overflow-hidden bg-white h-8">
                    <button onClick={() => updateQuantity(item.id, -1)} className="px-3 hover:bg-slate-100 font-bold text-slate-600">-</button>
                    <span className="px-3 font-semibold text-sm border-x border-slate-300 h-full flex items-center justify-center min-w-[30px]">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="px-3 hover:bg-slate-100 font-bold text-slate-600">+</button>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => removeFromCart(item.id)}
                className="absolute top-4 right-4 text-slate-400 hover:text-red-500 p-2 transition-colors"
                title="Remove item"
              >
                <FaTrash />
              </button>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 h-max sticky top-24">
          <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-4">Order Summary</h2>

          <div className="flex justify-between mb-3 text-sm text-slate-600">
            <span>Subtotal ({cart.reduce((a, b) => a + b.quantity, 0)} items)</span>
            <span className="font-semibold text-slate-800">UGX {cartTotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between mb-4 text-sm text-slate-600 border-b border-slate-200 pb-4">
            <span>Delivery</span>
            <span className="font-semibold text-slate-800">Standard Local</span>
          </div>

          <div className="flex justify-between mb-6 text-lg">
            <span className="font-bold text-slate-900">Total</span>
            <span className="font-black text-[#D97706]">UGX {cartTotal.toLocaleString()}</span>
          </div>

          <button 
            onClick={handleCheckoutClick}
            className="w-full bg-[#D97706] hover:bg-amber-600 text-white font-bold py-4 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 text-[15px]"
          >
            Checkout (Mobile Money)
          </button>

          {/* 🔒 SECURE PAYMENT BADGE */}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 py-2.5 rounded-md border border-slate-200">
            <FaShieldAlt className="text-green-600 text-sm" />
            Secure payment powered by Kabale Online
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* CHECKOUT MODAL */}
      {/* ========================================== */}
      {showModal && (  
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">  
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative overflow-hidden">  
            
            <div className="absolute top-0 left-0 w-full h-2 bg-[#D97706]"></div>  
            <h2 className="text-2xl font-black text-slate-900 mb-2">Complete Order</h2>  

            {/* 🧮 SUMMARY BOX */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5 mt-4">  
              <p className="font-bold text-sm text-slate-600 leading-tight mb-2">
                Paying for {cart.length} item{cart.length > 1 ? "s" : ""}
              </p>  
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">  
                <span className="text-sm font-bold text-slate-500">Amount to Pay:</span>  
                <span className="font-black text-[#D97706] text-xl">UGX {cartTotal.toLocaleString()}</span>  
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
                onClick={executeCartCheckout} 
                disabled={loading || !contactPhone.trim() || !buyerName.trim()} 
                className="flex-[2] bg-[#D97706] text-white py-3.5 rounded-xl font-bold hover:bg-amber-600 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >  
                {loading ? "Processing..." : "Pay Now"}  
              </button>  
            </div>  
            
          </div>  
        </div>  
      )}  

    </div>
  );
}
