"use client";

import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { FaTrash, FaWhatsapp, FaArrowLeft } from "react-icons/fa";

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();
  const botPhoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER || "256740373021";

  const handleCheckout = () => {
    if (cart.length === 0) return;

    // Format the cart into a readable WhatsApp receipt
    const orderDetails = cart.map((item, index) => 
      `${index + 1}. *${item.title}*\n   Qty: ${item.quantity} x UGX ${item.price.toLocaleString()}`
    ).join("\n\n");

    const message = `🛒 *NEW KABALE ONLINE ORDER*\n\nI would like to order the following items:\n\n${orderDetails}\n\n💰 *Grand Total: UGX ${cartTotal.toLocaleString()}*\n\nPlease guide me on the next steps for delivery and payment!`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${botPhoneNumber}?text=${encodedMessage}`, "_blank");
    
    // Optional: Clear cart after sending to WhatsApp
    // clearCart(); 
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
    <div className="max-w-4xl mx-auto p-4 md:p-8 bg-white min-h-screen">
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
            <span className="font-semibold text-green-600">Calculated on WhatsApp</span>
          </div>
          
          <div className="flex justify-between mb-6 text-lg">
            <span className="font-bold text-slate-900">Total</span>
            <span className="font-black text-[#D97706]">UGX {cartTotal.toLocaleString()}</span>
          </div>

          <button 
            onClick={handleCheckout}
            className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-4 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 text-[15px]"
          >
            <FaWhatsapp className="text-xl" /> Checkout via WhatsApp
          </button>
          
          <p className="text-xs text-center text-slate-500 mt-4 leading-relaxed">
            Completing your order will open WhatsApp to finalize delivery details directly with the Kabale Online team.
          </p>
        </div>
      </div>
    </div>
  );
}
