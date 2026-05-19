"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useCart } from "@/context/CartContext"; 
import { Product } from "@/types";
import { FaWhatsapp } from "react-icons/fa";
// 🔥 Import the Send (paper plane) icon
import { Send } from "lucide-react";

export default function ProductActions({ product, children }: { product: Product, children?: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const { addToCart } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // NEW STATE FOR THE WHATSAPP INTERCEPTION POPUP
  const [showWhatsAppPopup, setShowWhatsAppPopup] = useState(false);
  const [loadingWhatsApp, setLoadingWhatsApp] = useState(false);
  
  const [showMore, setShowMore] = useState(false);
  const [copied, setCopied] = useState(false);

  const botPhoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER || "256740373021";

  const isNegotiable = Number(product.price) === 0;

  // ==========================================
  // 🛒 CART LOGIC
  // ==========================================
  const handleAddToCart = () => {
    if (isNegotiable) {
      alert("This item's price is negotiable. Please use WhatsApp to contact the seller.");
      return;
    }

    addToCart({
      id: product.id,
      title: product.name || "Unknown Item", 
      price: Number(product.price),
      image: product.images?.[0] || "",
      quantity: quantity,
      sellerId: product.sellerId || "SYSTEM", 
      sellerPhone: product.sellerPhone || ""
    });

    alert("✅ Added to cart successfully!");
  };

  // ==========================================
  // 🚀 WHATSAPP LEAD CAPTURE & REDIRECT
  // ==========================================
  const handleBotInquiry = async () => {
    setLoadingWhatsApp(true);

    try {
      const getCookie = (name: string) => {
        if (typeof document === "undefined") return null;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
      };
      const referralCode = getCookie("kabale_ref");

      // We only generate the lead once they confirm on the popup!
      const res = await fetch("/api/orders/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          productId: product.id,
          productName: product.name, 
          sellerId: product.sellerId,
          sellerPhone: product.sellerPhone,
          price: product.price,
          referralCodeUsed: referralCode || null 
        }),
      });

      let referenceCode = product.id; 

      if (res.ok) {
        const data = await res.json();
        referenceCode = data.leadId; 
      }

      const priceText = isNegotiable ? "Price: Negotiable" : `Price: UGX ${Number(product.price).toLocaleString()}`;
      const rawMessage = `Hi! I want to order or ask about this item on Kabale Online:\n\n*${product.name}*\n${priceText}\n\nRef: [${referenceCode}]`;
      const encodedMessage = encodeURIComponent(rawMessage);

      window.open(`https://wa.me/${botPhoneNumber}?text=${encodedMessage}`, "_blank");

    } catch (error) {
      console.error("Failed to generate lead:", error);
      const rawMessage = `Hi! I want to ask about: *${product.name}*\n\nProduct ID: [${product.id}]`;
      window.open(`https://wa.me/${botPhoneNumber}?text=${encodeURIComponent(rawMessage)}`, "_blank");
    } finally {
      setLoadingWhatsApp(false);
      setShowWhatsAppPopup(false); // Close the popup after redirecting
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/product/${product.publicId || product.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleAdminDelete = async () => {
    if (!user || user.role !== "admin") return;
    if (!window.confirm("ADMIN ACTION: Permanently delete this product?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${product.id}?isAdmin=true&adminId=${user.id}`, { method: "DELETE" });
      if (res.ok) {
        alert("Product removed.");
        router.push("/");
      } else {
        alert("Failed to delete.");
        setLoading(false);
      }
    } catch (error) {
      alert("Database error.");
      setLoading(false);
    }
  };

  // 🔥 CUSTOM INLINE ICON COMPONENT
  // This replicates the dark plane on a green circle look from your image.
  const WhatsAppSendIcon = () => (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#25D366] border border-green-600 align-sub ml-1 shadow-inner">
      <Send className="w-3 h-3 text-black" strokeWidth={3} />
    </span>
  );

  return (
    <>
      <div className="mt-6 flex flex-col gap-4">

        {/* 1. QUANTITY & ADD TO CART (Hidden if Negotiable) */}
        {!isNegotiable ? (
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center border border-slate-300 rounded-md overflow-hidden h-12 bg-white shadow-sm">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 h-full text-lg font-bold text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition-colors"
              >
                -
              </button>
              <span className="px-4 font-semibold text-lg border-x border-slate-300 h-full flex items-center justify-center min-w-[45px] text-slate-800 bg-slate-50">
                {quantity}
              </span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="px-4 h-full text-lg font-bold text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition-colors"
              >
                +
              </button>
            </div>

            <button 
              onClick={handleAddToCart}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 rounded-md text-sm uppercase tracking-wider shadow-sm transition-all active:scale-[0.98]"
            >
              Add to Cart
            </button>
          </div>
        ) : (
          <div className="bg-orange-50 dark:bg-[#FF6A00]/10 border border-[#FF6A00]/30 rounded-md p-3 flex items-start gap-2 animate-in fade-in">
            <span className="text-lg">🤝</span>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
              The price for this item is <strong className="text-[#FF6A00]">Negotiable</strong>. "Add to Cart" is disabled. Please contact the seller via WhatsApp to agree on a price.
            </p>
          </div>
        )}

        {/* 2. ASK OR ORDER ON WHATSAPP */}
        <button 
          onClick={() => setShowWhatsAppPopup(true)}
          className={`w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3.5 rounded-md shadow-sm transition-all flex items-center justify-center gap-2 text-[15px] ${isNegotiable ? 'animate-pulse' : ''}`}
        >
          <FaWhatsapp className="text-xl" /> 
          {isNegotiable ? "Negotiate on WhatsApp" : "Order Using WhatsApp"}
        </button>

        {/* 3. MORE OPTIONS & ADMIN CONTROLS */}
        <div className="mt-1">
          <button 
            onClick={() => setShowMore(!showMore)}
            className="text-xs font-bold text-slate-500 flex items-center gap-1 py-2 px-1 hover:text-slate-700 transition-colors"
          >
            {showMore ? "− Hide options" : "+ More options"}
          </button>

          {showMore && (
            <div className="mt-2 bg-slate-50 rounded-lg p-3 flex flex-col gap-2 border border-slate-100">
              <button onClick={handleCopyLink} disabled={loading} className="w-full bg-white text-slate-700 border border-slate-200 py-2.5 rounded-lg font-bold text-xs flex justify-center gap-2 shadow-sm hover:bg-slate-100 transition-colors">
                {copied ? "✅ Link Copied!" : "🔗 Copy Link"}
              </button>

              {children}

              {user?.role === "admin" && (
                <button onClick={handleAdminDelete} disabled={loading} className="w-full bg-red-50 text-red-600 border border-red-200 py-2.5 rounded-lg font-bold text-xs flex justify-center mt-1 hover:bg-red-100 transition-colors">
                  🗑️ Admin Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================== */}
      {/* 🛑 THE UX INTERCEPTION POPUP               */}
      {/* ========================================== */}
      {showWhatsAppPopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#151515] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
            
            <div className="p-6 md:p-8">
              {/* WhatsApp Icon Header */}
              <div className="w-14 h-14 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center mb-5 mx-auto border border-green-100 dark:border-green-500/20">
                <FaWhatsapp className="text-3xl text-[#25D366]" />
              </div>
              
              <h3 className="text-xl font-black text-slate-900 dark:text-white text-center mb-2 tracking-tight">
                Complete Your Order
              </h3>
              
              {/* 🔥 UPDATED: Added icon in brackets to the message text */}
              <p className="text-[13px] text-slate-500 dark:text-slate-400 text-center mb-6 leading-relaxed">
                When WhatsApp opens, tap <strong className="text-slate-800 dark:text-slate-200">SEND</strong> (looks like <WhatsAppSendIcon/> on mobile) to send the pre-filled message and we will confirm your order immediately.
              </p>

              {/* Trust Indicators */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 mb-8 border border-slate-100 dark:border-slate-800">
                <ul className="flex flex-col gap-3">
                  <li className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-500/20 text-[#25D366] flex items-center justify-center text-[10px]">✓</span> 
                    Fast confirmation
                  </li>
                  <li className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-500/20 text-[#25D366] flex items-center justify-center text-[10px]">✓</span> 
                    Quick delivery
                  </li>
                  <li className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-500/20 text-[#25D366] flex items-center justify-center text-[10px]">✓</span> 
                    Trusted support
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleBotInquiry}
                  disabled={loadingWhatsApp}
                  className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 text-[15px] disabled:opacity-70 active:scale-[0.98]"
                >
                  {loadingWhatsApp ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Connecting...
                    </span>
                  ) : (
                    <>Continue to WhatsApp</>
                  )}
                </button>
                
                <button
                  onClick={() => setShowWhatsAppPopup(false)}
                  disabled={loadingWhatsApp}
                  className="w-full py-3 text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
