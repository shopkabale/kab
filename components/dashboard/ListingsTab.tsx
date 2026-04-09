"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc, limit, where, startAfter } from "firebase/firestore"; 
import { db } from "@/lib/firebase/config";

// Local Modal State Type
type ModalState = {
  isOpen: boolean;
  type: "delete_confirm" | "none";
  product?: any;
};

export default function ListingsTab({ userId, hasInventory }: { userId: string, hasInventory: boolean }) {
  const ITEMS_PER_PAGE = 5;
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>({ isOpen: false, type: "none" });

  const fetchListings = useCallback(async (isLoadMore = false) => {
    if (isLoadMore && !hasMore) return;
    setLoading(true);
    
    try {
      let q = query(
        collection(db, "products"), 
        where("sellerId", "==", userId), 
        orderBy("createdAt", "desc"), 
        limit(ITEMS_PER_PAGE)
      );
      
      if (isLoadMore && listings.length > 0) {
        q = query(q, startAfter(listings[listings.length - 1].createdAt));
      }
      
      const snapshot = await getDocs(q);
      const newDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      setHasMore(snapshot.docs.length === ITEMS_PER_PAGE);
      setListings(isLoadMore ? [...listings, ...newDocs] : newDocs);
    } catch (error) {
      console.error("Error fetching listings", error);
    }
    setLoading(false);
  }, [userId, hasMore, listings]);

  useEffect(() => {
    fetchListings();
  }, [userId]);

  const handleToggleSold = async (product: any) => {
    const newStatus = product.status === "sold" ? "active" : "sold";
    try {
      await updateDoc(doc(db, "products", product.id), { status: newStatus });
      setListings(listings.map(item => item.id === product.id ? { ...item, status: newStatus } : item));
      await fetch('/api/revalidate'); // Revalidate cache
    } catch (error) { console.error("Failed to update status", error); }
  };

  const confirmDelete = async () => {
    if (!modal.product) return;
    try {
      await deleteDoc(doc(db, "products", modal.product.id));
      setListings(listings.filter(item => item.id !== modal.product.id));
      setModal({ isOpen: false, type: "none" });
      await fetch('/api/revalidate'); // Revalidate cache
    } catch (error) { console.error("Failed to delete product", error); }
  };

  const handleCopyProductLink = (publicId: string, id: string) => {
    const url = `${window.location.origin}/product/${publicId || id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  if (loading && listings.length === 0) {
    return <div className="text-center py-10 text-slate-400 text-sm">Loading ads...</div>;
  }

  // Empty State: Encourage them to start selling!
  if (!hasInventory && listings.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-sm mt-4 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-[#D97706]/10 text-[#D97706] rounded-full flex items-center justify-center text-4xl mx-auto mb-4">💸</div>
        <h2 className="text-2xl font-black text-slate-900 mb-2 leading-tight">Turn your items into cash instantly</h2>
        <p className="text-slate-600 text-sm mb-8 leading-relaxed">
          Join hundreds of successful sellers in Kabale. Post your unused items, reach thousands of local buyers daily, and keep 100% of your profits.
        </p>
        <Link href="/sell" className="w-full block py-4 bg-[#D97706] text-white font-black text-lg rounded-xl shadow-md hover:bg-amber-600 active:scale-95 transition-all">
          Post Your First Item Free
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* 🛑 ISOLATED DELETE MODAL */}
      {modal.isOpen && modal.type === "delete_confirm" && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">🗑️</div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Delete this Ad?</h3>
              <p className="text-slate-600 text-sm mb-6">This action cannot be undone. Are you sure you want to remove this item permanently?</p>
              <div className="flex gap-3">
                <button onClick={() => setModal({ isOpen: false, type: "none" })} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl active:bg-slate-200 transition-colors">Cancel</button>
                <button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl active:bg-red-700 transition-colors shadow-sm">Yes, Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📦 LISTINGS FEED */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1 mb-2">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Inventory</h2>
          <button onClick={() => fetchListings()} className="text-[10px] font-bold text-[#D97706]">↻ Refresh</button>
        </div>

        {listings.map((item) => {
          const isSold = item.status === "sold";
          const now = Date.now();
          const isBoostedActive = item.isBoosted && item.boostExpiresAt > now;
          const isFeaturedActive = item.isFeatured && item.featureExpiresAt > now;

          return (
            <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex flex-col gap-3">
              <div className="flex gap-3">
                <div className="w-20 h-20 bg-slate-50 rounded-lg flex-shrink-0 relative overflow-hidden border border-slate-100">
                  {item.images?.[0] ? (
                    <Image src={item.images[0]} alt={item.name} fill className="object-cover" sizes="80px" />
                  ) : <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-300 uppercase">No Img</span>}
                  {isFeaturedActive && <span className="absolute bottom-0 w-full bg-blue-600 text-white text-[8px] font-black text-center py-0.5 uppercase tracking-widest">Top Pick</span>}
                </div>
                <div className="flex-1 flex flex-col py-1 justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight line-clamp-2">{item.name}</h3>
                    <p className="text-sm font-black text-[#D97706] mt-1">UGX {(Number(item.price) || 0).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${isSold ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-600 border border-emerald-100"}`}>
                      {isSold ? "Sold Out" : "Active"}
                    </span>
                    {isBoostedActive && <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide bg-amber-50 text-amber-600 border border-amber-100">🚀 Trending</span>}
                  </div>
                </div>
              </div>

              {/* AI Analytics Dashboard */}
              <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 flex justify-between items-center">
                <div className="flex gap-4">
                  <div className="text-center">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Views</span>
                    <span className="block text-sm font-black text-slate-700">{item.views || 0}</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Chats</span>
                    <span className="block text-sm font-black text-slate-700">{item.inquiries || 0}</span>
                  </div>
                </div>
                <div className="text-right border-l border-slate-200 pl-4">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">AI Rank</span>
                  <span className="block text-sm font-black text-[#D97706]">{item.aiScore || 0}</span>
                </div>
              </div>

              {/* Action Controls */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <Link href={`/edit/${item.publicId || item.id}`} className="text-[11px] font-bold text-center py-2 bg-slate-50 text-slate-600 rounded-md border border-slate-200 active:bg-slate-100">Edit</Link>
                <button onClick={() => setModal({ isOpen: true, type: "delete_confirm", product: item })} className="text-[11px] font-bold text-center py-2 bg-red-50 text-red-600 rounded-md border border-red-100 active:bg-red-100">Delete</button>
                <button onClick={() => handleToggleSold(item)} className="text-[11px] font-bold text-center py-2 bg-slate-900 text-white rounded-md active:bg-slate-800">
                  {isSold ? "Set Active" : "Mark Sold"}
                </button>
              </div>

              <button
                onClick={() => handleCopyProductLink(item.publicId, item.id)}
                className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                  copiedId === item.id 
                    ? "bg-green-50 text-green-700 border-green-200" 
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 active:bg-slate-200"
                }`}
              >
                {copiedId === item.id ? "✅ Link Copied!" : "🔗 Tap to copy product link"}
              </button>
            </div>
          )
        })}

        {hasMore && (
          <button onClick={() => fetchListings(true)} disabled={loading} className="w-full py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 active:bg-slate-50 transition-colors shadow-sm">
            {loading ? "Loading..." : "Load More Ads"}
          </button>
        )}
      </div>
    </>
  );
}
