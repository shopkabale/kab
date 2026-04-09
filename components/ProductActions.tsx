"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useCart } from "@/context/CartContext"; 
import { Product } from "@/types";
import { FaCheck, FaWhatsapp, FaShieldAlt } from "react-icons/fa";
import { MdOutlineLocalShipping, MdOutlineLocationOn } from "react-icons/md";

export default function ProductActions({ product, children }: { product: Product, children?: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const { addToCart } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingWhatsApp, setLoadingWhatsApp] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [copied, setCopied] = useState(false);

  const botPhoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER || "256740373021";

  // --- CART LOGIC ---
  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      title: product.name,
      price: Number(product.price),
      image: product.images?.[0] || "",
      quantity: quantity,
      sellerPhone: product.sellerPhone || botPhoneNumber
    });
    alert("✅ Added to cart successfully!");
  };

  // ==========================================
  // 🚀 UPGRADED WHATSAPP LEAD CAPTURE
  // ==========================================
  const handleBotInquiry = async () => {
    setLoadingWhatsApp(true);

    try {
      // 1. Generate the Lead in Firestore before they leave the site
      const res = await fetch("/api/orders/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          productId: product.id,
          productName: product.name,
          sellerId: product.sellerId,
          sellerPhone: product.sellerPhone,
          price: product.price
        }),
      });

      let referenceCode = product.id; // Fallback to raw ID if fetch fails

      if (res.ok) {
        const data = await res.json();
        referenceCode = data.leadId; // Use the shiny new LEAD-XXXXX code
      }

      // 2. Construct the smart message with the Lead ID embedded
      const rawMessage = `Hi! I want to order or ask about this item on Kabale Online:\n\n*${product.name}*\n\nRef: [${referenceCode}]`;
      const encodedMessage = encodeURIComponent(rawMessage);
      
      // 3. Send them to WhatsApp
      window.open(`https://wa.me/${botPhoneNumber}?text=${encodedMessage}`, "_blank");

    } catch (error) {
      console.error("Failed to generate lead:", error);
      // Fallback redirect so the user isn't stuck if the DB is slow
      const rawMessage = `Hi! I want to ask about: *${product.name}*\n\nProduct ID: [${product.id}]`;
      window.open(`https://wa.me/${botPhoneNumber}?text=${encodeURIComponent(rawMessage)}`, "_blank");
    } finally {
      setLoadingWhatsApp(false);
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

  return (
    <div className="mt-6 flex flex-col gap-5">

      {/* 1. QUANTITY & ADD TO CART (Under Maintenance Overlay) */}
      <div className="relative group">
        {/* The Overlay */}
        <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[2px] flex items-center justify-center rounded-lg border border-slate-200/50">
          <div className="bg-slate-900/90 text-white text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            Cart Under Maintenance
          </div>
        </div>

        {/* The Original Content (Blurred/Disabled visually) */}
        <div className="flex items-center gap-3 opacity-50 grayscale-[0.3]">
          <div className="flex items-center border border-slate-300 rounded-md overflow-hidden h-12 bg-white">
            <button disabled className="px-4 h-full text-lg font-bold text-slate-400">-</button>
            <span className="px-4 font-semibold text-lg border-x border-slate-300 h-full flex items-center justify-center min-w-[45px] text-slate-400 bg-slate-50">{quantity}</span>
            <button disabled className="px-4 h-full text-lg font-bold text-slate-400">+</button>
          </div>

          <button 
            disabled
            className="flex-1 bg-slate-400 text-white font-bold h-12 rounded-md text-sm uppercase tracking-wider"
          >
            Add to Cart
          </button>
        </div>
      </div>

      {/* 2. ASK OR ORDER ON WHATSAPP (Green Button) */}
      <button 
        onClick={handleBotInquiry}
        disabled={loadingWhatsApp}
        className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3.5 rounded-md shadow-sm transition-all flex items-center justify-center gap-2 text-[15px] disabled:opacity-70"
      >
        <FaWhatsapp className="text-xl" /> 
        {loadingWhatsApp ? "Connecting..." : "Ask or Order on WhatsApp"}
      </button>

      {/* 3. KABALE SHIPPING & DELIVERY CARD (Hybrid) */}
      <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm bg-white mt-2">
        <div className="bg-slate-50 p-3.5 font-bold text-slate-800 border-b border-slate-200 text-sm">
          Shipping & Delivery
        </div>

        <div className="grid grid-cols-2 p-4 gap-4">
          <div className="flex gap-2.5">
            <MdOutlineLocalShipping className="text-xl text-green-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-[13px] text-slate-800">Local Delivery</p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">Campus & Kabale Town</p>
            </div>
          </div>

          <div className="flex gap-2.5">
            <MdOutlineLocationOn className="text-xl text-green-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-[13px] text-slate-800">Meetup Points</p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">Secure central locations</p>
            </div>
          </div>

          <div className="flex gap-2.5">
            <FaShieldAlt className="text-xl text-red-500 flex-shrink-0" />
            <div>
              <p className="font-bold text-[13px] text-slate-800">Buyer Protection</p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">Inspect before you pay</p>
            </div>
          </div>

          <div className="flex gap-2.5">
            <FaCheck className="text-xl text-amber-500 flex-shrink-0" />
            <div>
              <p className="font-bold text-[13px] text-slate-800">Verified Sellers</p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">Safe local community</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. MORE OPTIONS & ADMIN CONTROLS */}
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
  );
}
