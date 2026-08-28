"use client";

import { useState, useMemo, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaTrash, FaArrowLeft, FaPlus, FaShieldAlt, FaCheckCircle } from "react-icons/fa";
import { useAuth } from "@/components/AuthProvider"; // Imported Auth

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, cartTotal, addToCart, clearCart } = useCart();
  const router = useRouter();
  const { user } = useAuth(); // Extracted user

  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState(""); 
  const [contactPhone, setContactPhone] = useState("");
  const [location, setLocation] = useState("");

  const [upsellItems, setUpsellItems] = useState<any[]>([]);
  const [loadingUpsells, setLoadingUpsells] = useState(true);

  // Automatically pre-fill user details if they are logged in
  useEffect(() => {
    if (user) {
      if (!buyerName) setBuyerName(user.displayName || "");
      if (!buyerEmail) setBuyerEmail(user.email || "");
    }
  }, [user, buyerName, buyerEmail]);

  useEffect(() => {
    async function fetchUpsells() {
      try {
        const res = await fetch("/api/products/upsells");
        if (res.ok) {
          const data = await res.json();
          const cartIds = new Set(cart.map(item => item.id));
          const filteredUpsells = data.items.filter((item: any) => !cartIds.has(item.id));
          setUpsellItems(filteredUpsells);
        }
      } catch (error) {
        console.error("Failed to load upsells", error);
      } finally {
        setLoadingUpsells(false);
      }
    }
    fetchUpsells();
  }, [cart]);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const { deliveryFee, progress, message, isFreeDelivery } = useMemo(() => {
    if (cartTotal >= 100000) {
      return { deliveryFee: 0, progress: 100, message: "Your order qualifies for FREE delivery!", isFreeDelivery: true };
    }
    if (totalItems >= 4) {
      return { deliveryFee: 0, progress: 100, message: "🎉 FREE DELIVERY UNLOCKED!", isFreeDelivery: true };
    }
    if (totalItems === 3) {
      return { deliveryFee: 1000, progress: 75, message: "Add 1 more item to unlock FREE delivery.", isFreeDelivery: false };
    }
    if (totalItems === 2) {
      return { deliveryFee: 1500, progress: 50, message: "Add 1 more item and save UGX 500 on delivery.", isFreeDelivery: false };
    }
    return { deliveryFee: 2000, progress: 25, message: "Add 1 more item and save UGX 500 on delivery.", isFreeDelivery: false };
  }, [cartTotal, totalItems]);

  const finalTotal = cartTotal + deliveryFee;

  const handleQuickAdd = (item: any) => {
    addToCart({
      id: item.id,
      title: item.title,
      price: item.price,
      quantity: 1,
      image: item.image, 
      sellerId: item.sellerId, 
      sellerPhone: item.sellerPhone 
    });
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setIsCheckingOut(true);

    try {
      const payload = {
        source: "web",
        userId: user?.id || "GUEST",
        buyerName,
        buyerEmail,
        contactPhone,
        location: location || "Mbarara",
        cartItems: cart.map(item => ({
          productId: item.id,
          publicId: (item as any).publicId || "",
          name: item.title,
          price: item.price,
          quantity: item.quantity,
          sellerId: (item as any).sellerId || "SYSTEM",
          sellerPhone: (item as any).sellerPhone || "",
          image: item.image || ""
        }))
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (clearCart) clearCart();
        setShowCheckoutModal(false);
        router.push(`/order-success?id=${data.orderId}`);
      } else {
        alert(data.error || "Failed to place order. Please check stock levels and try again.");
      }
    } catch (error) {
      console.error("Checkout submission error:", error);
      alert("An unexpected error occurred during checkout.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <div className="text-6xl mb-4">🛒</div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Your cart is empty</h1>
        <p className="text-slate-500 mb-6 text-center">Looks like you haven't added anything yet.</p>
        <Link href="/" className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-lg transition-colors">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-3 sm:p-4 md:p-8 bg-white min-h-screen relative overflow-x-hidden box-border">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Shopping Cart</h1>
        <Link href="/" className="text-sm font-bold text-slate-500 hover:text-slate-800 flex items-center gap-2">
          <FaArrowLeft className="hidden sm:block" /> Continue Shopping
        </Link>
      </div>

      <div className={`mb-6 md:mb-8 p-4 rounded-2xl border transition-all w-full max-w-full overflow-hidden box-border ${isFreeDelivery ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-end mb-3 w-full">
          <p className={`font-bold text-[13px] md:text-base leading-snug w-full sm:w-auto ${isFreeDelivery ? 'text-green-700' : 'text-slate-700'}`}>
            {isFreeDelivery ? "✨ " : "🚚 "}{message}
          </p>
          <span className={`inline-block shrink-0 text-[10px] md:text-xs font-black px-2 py-1 bg-white/60 rounded-md whitespace-nowrap ${isFreeDelivery ? 'text-green-600' : 'text-slate-500'}`}>
            {totalItems >= 4 || cartTotal >= 20000 ? "UNLOCKED" : `${totalItems}/4 ITEMS`}
          </span>
        </div>

        <div className="relative h-2 md:h-2.5 w-full max-w-full bg-slate-200 rounded-full overflow-hidden mb-4 isolate">
          <div 
            className={`absolute top-0 left-0 h-full transition-all duration-500 ease-out rounded-full ${isFreeDelivery ? 'bg-[#25D366]' : 'bg-[#D97706]'}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>

        {!isFreeDelivery && (
          <div className="pt-3 md:pt-4 border-t border-slate-200/60 w-full max-w-full overflow-hidden">
            <p className="text-[10px] md:text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">
              Quick add to save on delivery:
            </p>

            {loadingUpsells ? (
              <div className="flex flex-nowrap gap-3 overflow-x-auto pb-2 w-full">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex-shrink-0 w-[180px] h-[55px] bg-slate-100 animate-pulse rounded-lg border border-slate-200"></div>
                ))}
              </div>
            ) : upsellItems.length > 0 ? (
              <div className="flex flex-nowrap gap-3 overflow-x-auto pb-2 w-full max-w-full snap-x snap-mandatory scroll-smooth hide-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
                {upsellItems.map((item) => (
                  <div key={item.id} className="flex-shrink-0 bg-white border border-slate-200 rounded-lg p-2 flex items-center gap-2.5 w-[190px] md:w-[220px] snap-start shadow-sm hover:border-[#D97706] transition-colors box-border">
                    <div className="w-10 h-10 bg-slate-50 rounded-md overflow-hidden flex items-center justify-center shrink-0 border border-slate-100">
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[9px] text-slate-400">No img</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] md:text-xs font-bold text-slate-800 truncate" title={item.title}>{item.title}</p>
                      <p className="text-[#D97706] font-black text-[10px] md:text-[11px] mt-0.5">UGX {item.price.toLocaleString()}</p>
                    </div>
                    <button onClick={() => handleQuickAdd(item)} className="w-7 h-7 rounded-full bg-slate-100 hover:bg-[#D97706] hover:text-white flex items-center justify-center transition-colors text-slate-600 shrink-0">
                      <FaPlus className="text-[10px]" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400">Add items from the store to save on delivery!</p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 w-full max-w-full">
        <div className="lg:col-span-2 flex flex-col gap-3 md:gap-4 w-full">
          {cart.map((item) => (
            <div key={item.id} className="flex gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50 relative w-full box-border">
              <div className="w-20 h-20 bg-white rounded-lg border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {item.image ? (
                  <img src={item.image} alt={item.title} className="max-h-full object-contain p-2" />
                ) : (
                  <span className="text-[9px] text-slate-400">No img</span>
                )}
              </div>
              <div className="flex-1 flex flex-col justify-between min-w-0 pr-6">
                <div className="w-full">
                  <h3 className="font-bold text-sm md:text-base text-slate-800 leading-tight truncate md:whitespace-normal md:line-clamp-2">{item.title}</h3>
                  <p className="text-slate-800 font-extrabold mt-1 text-sm md:text-base">UGX {item.price.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center border border-slate-300 rounded overflow-hidden bg-white h-7 md:h-8">
                    <button onClick={() => updateQuantity(item.id, -1)} className="px-2.5 hover:bg-slate-100 font-bold text-slate-600">-</button>
                    <span className="px-2 font-semibold text-xs md:text-sm border-x border-slate-300 h-full flex items-center justify-center min-w-[28px]">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="px-2.5 hover:bg-slate-100 font-bold text-slate-600">+</button>
                  </div>
                </div>
              </div>
              <button onClick={() => removeFromCart(item.id)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 p-2 transition-colors">
                <FaTrash className="text-[13px]" />
              </button>
            </div>
          ))}
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 w-full h-max sticky top-24 box-border">
          <h2 className="text-base md:text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-3">Order Summary</h2>
          <div className="flex justify-between mb-3 text-[13px] md:text-sm text-slate-600">
            <span>Subtotal ({totalItems} items)</span>
            <span className="font-semibold text-slate-800">UGX {cartTotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between mb-4 text-[13px] md:text-sm border-b border-slate-200 pb-3">
            <span className="text-slate-600">Delivery Fee</span>
            {isFreeDelivery ? (
              <span className="font-black text-green-600">FREE</span>
            ) : (
              <span className="font-semibold text-slate-800">UGX {deliveryFee.toLocaleString()}</span>
            )}
          </div>
          <div className="flex justify-between mb-6 text-base md:text-lg">
            <span className="font-bold text-slate-900">Total</span>
            <span className="font-black text-slate-900">UGX {finalTotal.toLocaleString()}</span>
          </div>
          <button onClick={() => setShowCheckoutModal(true)} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 text-[15px]">
            Proceed to Checkout
          </button>
          <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium">
            <FaShieldAlt className="text-slate-400" /> Secure purchase powered by Mbarara Online
          </div>
        </div>
      </div>

      {showCheckoutModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-black text-slate-900">Delivery Details</h3>
              <button onClick={() => setShowCheckoutModal(false)} className="text-slate-400 hover:text-slate-700 font-bold text-xl">×</button>
            </div>

            <div className="overflow-y-auto p-5 md:p-6">
              <form id="checkout-form" onSubmit={handlePlaceOrder} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    required 
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    placeholder="e.g. name@example.com (For your receipt)"
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50 text-slate-500"
                    readOnly={!!user?.email}
                    title={user?.email ? "Email is linked to your account" : ""}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone Number</label>
                  <input 
                    type="tel" 
                    required 
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="e.g. 0779094664"
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Delivery Location</label>
                  <textarea 
                    required 
                    rows={3}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Kakoba, High Street, near MUST gate, room 4"
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                  ></textarea>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-2">  
                  <div className="flex justify-between items-center">  
                    <span className="text-sm font-bold text-slate-500">Total Due (COD):</span>  
                    <span className="font-black text-slate-900 text-lg">UGX {finalTotal.toLocaleString()}</span>  
                  </div>  
                </div>  
              </form>
            </div>

            <div className="p-5 border-t border-slate-200 bg-white flex flex-col gap-3">
              <button 
                type="submit" 
                form="checkout-form"
                disabled={isCheckingOut} 
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 text-[15px] disabled:opacity-70"
              >
                {isCheckingOut ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Placing Order...
                  </span>
                ) : (
                  <>
                    <FaCheckCircle /> Confirm & Place Order
                  </>
                )}
              </button>
              <button onClick={() => setShowCheckoutModal(false)} disabled={isCheckingOut} className="w-full py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
