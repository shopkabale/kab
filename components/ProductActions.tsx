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

  // The official Kabale Online Bot Number (Include country code, no '+')
  const botPhoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER || "256700000000";

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

  // 🔥 THE NEW CORE ACTION: Route inquiries through the bot
  const handleBotInquiry = () => {
    // 1. Format the exact Regex string our bot is listening for
    const rawMessage = `Hi! I am interested in this item on Kabale Online: *${product.title || product.name}*\n\nProduct ID: [${product.id}]`;
    
    // 2. Encode and open WhatsApp
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

  // Dynamic Button Styling based on Stock Status
  let btnLabel = "Inquire on WhatsApp";
  let btnClass = "bg-[#25D366] text-white hover:bg-[#1EBE57] active:scale-[0.98]";

  if (loading) {
    btnLabel = "Processing...";
    btnClass = "bg-slate-200 text-slate-500 cursor-wait";
  } else if (isSoldOut) {
    btnLabel = "Sold Out";
    btnClass = "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed";
  } else if (isReserved) {
    btnLabel = "Reserved (Pending Delivery)";
    btnClass = "bg-amber-50 text-amber-700 border border-amber-200 cursor-not-allowed";
  }

  return (
    <div className="mt-6 flex flex-col gap-3">
      
      {/* 1. PRIMARY ACTION: THE WHATSAPP BOT INQUIRY */}
      <button 
        onClick={handleBotInquiry}
        disabled={isUnavailable || loading}
        className={`w-full py-4 rounded-xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-sm ${btnClass}`}
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
        </svg>
        {btnLabel}
      </button>

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
            <button onClick={handleCopyLink} disabled={loading} className="w-full bg-white text-slate-700 border border-slate-200 py-3 rounded-xl font-bold text-sm flex justify-center gap-2">
              {copied ? "✅ Link Copied!" : "🔗 Copy Link"}
            </button>

            {/* Slot for SaveProductButton (Wishlist) */}
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
