"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Product } from "@/types";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export default function ProductActions({ product, children }: { product: Product, children?: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [copied, setCopied] = useState(false);

  const [currentStock, setCurrentStock] = useState(Number(product.stock) || 0);
  const [isLocked, setIsLocked] = useState((product as any).locked === true);
  const [productStatus, setProductStatus] = useState(product.status);

  // Securely pull the WhatsApp Bot Number
  const botPhoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER || "256740373021";

  useEffect(() => {
    const fetchLiveStock = async () => {
      try {
        const docRef = doc(db, "products", product.id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const liveData = snap.data();
          setCurrentStock(Number(liveData.stock) || 0);
          setIsLocked(liveData.locked === true);
          setProductStatus(liveData.status);
        }
      } catch (error) {
        console.error("Failed to fetch live stock:", error);
      }
    };
    fetchLiveStock();
  }, [product.id]);

  const isSoldOut = currentStock <= 0 || productStatus === "sold_out";
  const isReserved = isLocked;
  const isUnavailable = isSoldOut || isReserved;

  // --- SELLER LOGIC ---
  const sellerNameStr = String(product.sellerName || "").toLowerCase();
  const isOfficial = sellerNameStr.includes('admin') || sellerNameStr.includes('kabale online') || sellerNameStr.includes('official');
  const displayName = product.sellerName || "Verified Seller";
  const replyText = isOfficial ? "Replies within minutes" : "Response times vary";

  // Route inquiries through the bot
  const handleBotInquiry = () => {
    const rawMessage = `Hi! I have a question about this item on Kabale Online: *${product.name}*\n\nProduct ID: [${product.id}]`;
    const encodedMessage = encodeURIComponent(rawMessage);
    window.open(`https://wa.me/${botPhoneNumber}?text=${encodedMessage}`, "_blank");
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

  // Dynamic Button Styling
  let btnLabel = "Have questions? Chat with seller";
  let btnClass = "bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300";

  if (loading) {
    btnLabel = "Processing...";
    btnClass = "bg-slate-100 text-slate-400 border border-slate-200 cursor-wait";
  } else if (isSoldOut) {
    btnLabel = "Sold Out";
    btnClass = "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed";
  } else if (isReserved) {
    btnLabel = "Reserved (Pending Delivery)";
    btnClass = "bg-amber-50 text-amber-700 border border-amber-200 cursor-not-allowed";
  }

  return (
    <div className="mt-6 flex flex-col gap-3">

      {/* 1. SELLER INFO & CHAT BUTTON */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col gap-4">
        
        {/* Seller Details */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-black text-lg border border-amber-200">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 flex items-center gap-1">
              {displayName}
              {isOfficial && <span className="bg-blue-100 text-blue-600 rounded-full w-3.5 h-3.5 flex items-center justify-center text-[9px]">✓</span>}
            </p>
            <p className="text-xs text-slate-500">{replyText}</p>
          </div>
        </div>

        {/* Chat Action */}
        <button 
          onClick={handleBotInquiry}
          disabled={isUnavailable || loading}
          className={`w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm ${btnClass}`}
        >
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
          </svg>
          {btnLabel}
        </button>
      </div>

      {/* 2. COLLAPSIBLE MORE ACTIONS */}
      <div className="mt-2">
        <button 
          onClick={() => setShowMore(!showMore)}
          className="text-sm font-bold text-slate-500 flex items-center gap-1 py-2 px-1"
        >
          {showMore ? "− Hide options" : "+ More options"}
        </button>

        {showMore && (
          <div className="mt-3 bg-slate-50 rounded-xl p-4 flex flex-col gap-3 border border-slate-100">
            <button onClick={handleCopyLink} disabled={loading} className="w-full bg-white text-slate-700 border border-slate-200 py-3 rounded-xl font-bold text-sm flex justify-center gap-2 shadow-sm">
              {copied ? "✅ Link Copied!" : "🔗 Copy Link"}
            </button>

            {/* Slot for MakeOfferButton / SaveProductButton */}
            {children}

            {user?.role === "admin" && (
              <button onClick={handleAdminDelete} disabled={loading} className="w-full bg-red-50 text-red-600 border border-red-200 py-3 rounded-xl font-bold text-sm flex justify-center mt-2">
                🗑️ Admin Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
