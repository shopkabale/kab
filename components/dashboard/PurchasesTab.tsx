"use client";

import { useEffect, useState, useCallback } from "react";
import { collection, query, orderBy, getDocs, limit, where, startAfter } from "firebase/firestore"; 
import { db } from "@/lib/firebase/config";

export default function PurchasesTab({ userId }: { userId: string }) {
  const ITEMS_PER_PAGE = 5;
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchPurchases = useCallback(async (isLoadMore = false) => {
    if (isLoadMore && !hasMore) return;
    setLoading(true);
    
    try {
      let q = query(
        collection(db, "orders"), 
        where("userId", "==", userId), 
        orderBy("createdAt", "desc"), 
        limit(ITEMS_PER_PAGE)
      );
      
      if (isLoadMore && purchases.length > 0) {
        q = query(q, startAfter(purchases[purchases.length - 1].createdAt));
      }
      
      const snapshot = await getDocs(q);
      const newDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      setHasMore(snapshot.docs.length === ITEMS_PER_PAGE);
      setPurchases(isLoadMore ? [...purchases, ...newDocs] : newDocs);
    } catch (error) {
      console.error("Error fetching purchases", error);
    }
    setLoading(false);
  }, [userId, hasMore, purchases]);

  useEffect(() => {
    fetchPurchases();
  }, [userId]);

  if (loading && purchases.length === 0) {
    return <div className="text-center py-10 text-slate-400 text-sm">Loading purchases...</div>;
  }

  if (purchases.length === 0) {
    return <p className="text-center text-sm text-slate-500 py-10">No purchases yet.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-1 mb-2">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">My Purchases</h2>
        <button onClick={() => fetchPurchases()} className="text-[10px] font-bold text-[#D97706]">↻ Refresh</button>
      </div>
      
      {purchases.map((order) => (
        <div key={order.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-sm text-slate-900">Order {order.orderId || order.id.substring(0,8)}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {order.cartItems?.length || 1} item(s) • {order.paymentMode === "COD" ? "Cash on Delivery" : "Mobile Money"}
              </p>
            </div>
            <span className={`text-[9px] font-bold px-2 py-1 rounded-sm uppercase tracking-wide ${
               order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
            }`}>
              {order.status || 'processing'}
            </span>
          </div>

          <div className="flex justify-between items-center border-t border-slate-100 pt-3">
             <span className="text-xs text-slate-500">
               Status: {order.paymentStatus === 'paid' ? '✅ Paid' : '⏳ Pending'}
             </span>
             <span className="font-black text-[#D97706]">UGX {(Number(order.totalAmount) || 0).toLocaleString()}</span>
          </div>
        </div>
      ))}
      
      {hasMore && (
        <button onClick={() => fetchPurchases(true)} disabled={loading} className="w-full py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 shadow-sm">
          {loading ? "Loading..." : "Load Older Purchases"}
        </button>
      )}
    </div>
  );
}
