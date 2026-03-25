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
  const [showModal, setShowModal] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const [contactPhone, setContactPhone] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [copied, setCopied] = useState(false);

  const [currentStock, setCurrentStock] = useState(Number(product.stock) || 0);
  const [isLocked, setIsLocked] = useState((product as any).locked === true);
  const [productStatus, setProductStatus] = useState(product.status);

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

  const formatWhatsAppNumber = (phone: string) => {
    if (!phone) return "";
    const cleanPhone = phone.replace(/\D/g, "");
    return cleanPhone.startsWith("0") ? `256${cleanPhone.slice(1)}` : cleanPhone;
  };

  const handleBuyViaWhatsApp = () => {
    if (!product.sellerPhone) return alert("Seller did not provide a WhatsApp number.");
    const phone = formatWhatsAppNumber(product.sellerPhone);
    const message = encodeURIComponent(`Hello ${product.sellerName || "there"}, I am interested in buying your item on Kabale Online:\n\n*${product.name}*\nPrice: UGX ${Number(product.price).toLocaleString()}\nID: ${product.publicId || product.id}\n\nIs it still available?`);
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  };

  const handleShareToWhatsApp = () => {
    const url = `${window.location.origin}/product/${product.publicId || product.id}`;
    const message = encodeURIComponent(`Check out this ${product.name} for UGX ${Number(product.price).toLocaleString()} on Kabale Online! \n\nSee it here: ${url}`);
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/product/${product.publicId || product.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const executeFastCheckout = async () => {
    if (!buyerName.trim()) return alert("Please provide your name.");
    if (!contactPhone.trim() || contactPhone.replace(/\D/g, "").length < 10) return alert("Please enter a valid 10-digit phone number.");
    
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user ? user.id : "GUEST",
          buyerName: buyerName.trim(),
          productId: product.id,
          sellerId: product.sellerId || "SYSTEM",
          total: product.price,
          contactPhone: contactPhone.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowModal(false);
        router.push(`/success/${data.orderId}`);
      } else {
        alert(data.error || "Failed to place order.");
        setShowModal(false);
        // Re-fetch live stock on failure
        const docRef = doc(db, "products", product.id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setCurrentStock(Number(snap.data().stock) || 0);
          setIsLocked(snap.data().locked === true);
        }
      }
    } catch (error) {
      alert("Connection error.");
    } finally {
      setLoading(false);
    }
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

  let btnLabel = "Chat With Seller";
  let btnClass = "bg-[#25D366] text-white";

  if (loading) {
    btnLabel = "Processing...";
    btnClass = "bg-slate-200 text-slate-500 cursor-wait";
  } else if (isSoldOut) {
    btnLabel = "Sold Out";
    btnClass = "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed";
  } else if (isReserved) {
    btnLabel = "Reserved (Pending)";
    btnClass = "bg-amber-50 text-amber-700 border border-amber-200 cursor-not-allowed";
  }

  return (
    <>
      <div className="mt-6 flex flex-col gap-3">
        {/* 1. PRIMARY ACTION: WHATSAPP CHAT */}
        <button 
          onClick={handleBuyViaWhatsApp}
          disabled={isUnavailable || !product.sellerPhone || loading}
          className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 ${btnClass}`}
        >
          💬 {btnLabel}
        </button>

        {/* 2. SECONDARY ACTION: FAST CHECKOUT */}
        <button 
          onClick={() => {
            if (user?.displayName) setBuyerName(user.displayName);
            setShowModal(true);
          }}
          disabled={isUnavailable || loading}
          className="w-full py-4 rounded-xl font-bold text-md bg-white border-2 border-slate-900 text-slate-900 flex items-center justify-center"
        >
          Buy Now (Fast Checkout)
        </button>

        {/* 3. COLLAPSIBLE MORE ACTIONS */}
        <div className="mt-2">
          <button 
            onClick={() => setShowMore(!showMore)}
            className="text-sm font-bold text-slate-500 flex items-center gap-1 py-2 px-1"
          >
            {showMore ? "− Hide actions" : "+ More actions"}
          </button>
          
          {showMore && (
            <div className="mt-3 bg-slate-50 rounded-xl p-4 flex flex-col gap-3 border border-slate-100">
              <button onClick={handleShareToWhatsApp} disabled={loading} className="w-full bg-white text-slate-700 border border-slate-200 py-3 rounded-xl font-bold text-sm flex justify-center gap-2">
                📤 Share via WhatsApp
              </button>
              <button onClick={handleCopyLink} disabled={loading} className="w-full bg-white text-slate-700 border border-slate-200 py-3 rounded-xl font-bold text-sm flex justify-center gap-2">
                {copied ? "✅ Copied" : "🔗 Copy Link"}
              </button>
              
              {/* Slot for SaveProductButton */}
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

      {/* MODAL (Stripped of animations for a professional, snappy feel) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md relative overflow-hidden">
            <h2 className="text-2xl font-black text-slate-900 mb-2">Fast Checkout</h2>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 mt-4">
              <p className="font-bold text-lg text-slate-900 leading-tight line-clamp-2">{product.name}</p>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200">
                <span className="text-sm font-medium text-slate-500">Pay on delivery:</span>
                <span className="font-black text-[#D97706] text-lg">UGX {Number(product.price).toLocaleString()}</span>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-900 mb-2">Your Name *</label>
              <input required type="text" placeholder="John Doe" className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none" value={buyerName} onChange={e => setBuyerName(e.target.value)} />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-900 mb-2">WhatsApp Number *</label>
              <input required type="tel" placeholder="077..." className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none" value={contactPhone} onChange={e => setContactPhone(e.target.value)} />
              <p className="text-xs text-slate-500 mt-2 font-medium">The seller will call to arrange delivery in Kabale.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowModal(false); setContactPhone(""); setBuyerName(""); }} disabled={loading} className="flex-1 bg-white border-2 border-slate-200 text-slate-700 py-3 rounded-xl font-bold">Cancel</button>
              <button onClick={executeFastCheckout} disabled={loading || !contactPhone.trim() || !buyerName.trim()} className="flex-1 bg-[#D97706] text-white py-3 rounded-xl font-bold disabled:opacity-50">{loading ? "Sending..." : "Order"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
