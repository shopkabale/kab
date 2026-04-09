"use client";

import { useEffect, useState, useCallback } from "react";
import { collection, query, orderBy, getDocs, limit, where, startAfter } from "firebase/firestore"; 
import { db } from "@/lib/firebase/config";

export default function OrdersTab({ userId }: { userId: string }) {
  const ITEMS_PER_PAGE = 5;
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchSales = useCallback(async (isLoadMore = false) => {
    if (isLoadMore && !hasMore) return;
    setLoading(true);
    
    try {
      // 🚀 UPGRADED QUERY: Uses the new 'sellerIds' flat array
      let q = query(
        collection(db, "orders"), 
        where("sellerIds", "array-contains", userId), 
        orderBy("createdAt", "desc"), 
        limit(ITEMS_PER_PAGE)
      );
      
      if (isLoadMore && sales.length > 0) {
        q = query(q, startAfter(sales[sales.length - 1].createdAt));
      }
      
      const snapshot = await getDocs(q);
      const newDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      setHasMore(snapshot.docs.length === ITEMS_PER_PAGE);
      setSales(isLoadMore ? [...sales, ...newDocs] : newDocs);
    } catch (error) {
      console.error("Error fetching sales", error);
    }
    setLoading(false);
  }, [userId, hasMore, sales]);

  useEffect(() => {
    fetchSales();
  }, [userId]); // Intentionally omitting fetchSales to prevent infinite loops on mount

  const handleSaleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/orders/seller", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId: userId, orderId, newStatus })
      });
      if (res.ok) {
        setSales(sales.map(order => order.id === orderId ? { ...order, status: newStatus } : order));
      } else {
        alert("Failed to update status.");
      }
    } catch (error) { 
      console.error("Failed to update sale status", error); 
    }
  };

  if (loading && sales.length === 0) {
    return <div className="text-center py-10 text-slate-400 text-sm">Loading orders...</div>;
  }

  if (sales.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm">
        <span className="text-4xl block mb-3">📦</span>
        <p className="text-slate-800 font-bold mb-1">Your orders will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-1 mb-2">
         <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Orders</h2>
         <button onClick={() => fetchSales()} className="text-[10px] font-bold text-[#D97706]">↻ Refresh</button>
      </div>
      
      {sales.map((order) => {
        const status = order.status || "processing";
        // 🚀 UPGRADED LOGIC: Find the specific sub-order for THIS seller
        const mySubOrder = order.sellerOrders?.find((so: any) => so.sellerId === userId);
        const mySubtotal = mySubOrder ? mySubOrder.subtotal : (order.totalAmount || 0);
        const myItems = mySubOrder ? mySubOrder.items : (order.cartItems || []);

        return (
          <div key={order.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-xs text-slate-500 font-medium mb-0.5">
                  Buyer: <span className="font-bold text-slate-800">{order.buyerName || order.buyerPhone || "Guest"}</span>
                </p>
                <div className="text-sm font-bold text-slate-900 mt-1">
                  {myItems.map((item: any, idx: number) => (
                    <div key={idx} className="line-clamp-1">{item.quantity}x {item.name}</div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-[9px] font-bold px-2 py-1 rounded-sm uppercase tracking-wide ${
                  status === 'delivered' ? 'bg-green-100 text-green-700' : 
                  status === 'processing' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {status}
                </span>
                {/* Payment Badge */}
                {order.paymentStatus === 'paid' ? (
                  <span className="text-[9px] font-bold text-green-600">✅ PAID ONLINE</span>
                ) : (
                  <span className="text-[9px] font-bold text-amber-600">⚠️ {order.paymentMode}</span>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-500">Your Cut:</span>
              <span className="font-black text-[#D97706]">UGX {Number(mySubtotal).toLocaleString()}</span>
            </div>

            <div className="flex gap-2 mt-4">
              <button 
                onClick={() => handleSaleStatusChange(order.id, 'out_for_delivery')} 
                disabled={status === 'delivered' || status === 'out_for_delivery'} 
                className="flex-1 text-[11px] font-bold py-2 border border-slate-200 text-slate-700 rounded-lg active:bg-slate-50 disabled:opacity-50"
              >
                Send Delivery
              </button>
              <button 
                onClick={() => handleSaleStatusChange(order.id, 'delivered')} 
                disabled={status === 'delivered'} 
                className="flex-1 text-[11px] font-bold py-2 bg-slate-900 text-white rounded-lg active:bg-slate-800 disabled:opacity-50"
              >
                Complete
              </button>
            </div>
          </div>
        );
      })}

      {hasMore && (
         <button onClick={() => fetchSales(true)} disabled={loading} className="w-full py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
           {loading ? "Loading..." : "Load Older Orders"}
         </button>
      )}
    </div>
  );
}
