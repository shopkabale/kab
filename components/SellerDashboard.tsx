"use client";

import { useEffect, useState } from "react";
import { Order } from "@/types";
import Link from "next/link";

export default function SellerDashboard({ userId }: { userId: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSellerOrders = async () => {
      try {
        const res = await fetch(`/api/orders/seller?sellerId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch (error) {
        console.error("Failed to fetch seller orders:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchSellerOrders();
  }, [userId]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    if (newStatus === "cancelled") {
      alert("⚠️ To cancel an order and safely return the item to stock, please contact Kabale Online Admin directly at 0759997376.");
      return;
    }

    setUpdatingId(orderId);
    try {
      const res = await fetch("/api/orders/seller", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId: userId, orderId, newStatus })
      });

      if (res.ok) {
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, status: newStatus as any } : order
        ));
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to update status.");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong updating the order.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-slate-500 font-medium animate-pulse">Loading your dashboard...</div>;
  }

  // --- STATS CALCULATIONS ---
  const activeOrders = orders.filter(o => ["pending", "confirmed", "out_for_delivery"].includes(o.status || ""));
  const completedOrders = orders.filter(o => o.status === "delivered");
  
  const totalEarned = completedOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
  const expectedRevenue = activeOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);

  return (
    <div className="space-y-8">
      
      {/* --- STATS CARDS --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">To Fulfill</p>
          <p className="text-2xl font-black text-slate-900">{activeOrders.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Delivered</p>
          <p className="text-2xl font-black text-green-600">{completedOrders.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Earned</p>
          <p className="text-lg font-black text-slate-900">UGX {totalEarned.toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Pending Cash</p>
          <p className="text-lg font-black text-[#D97706]">UGX {expectedRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* --- CANCELLATION NOTICE --- */}
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
        <span className="text-xl">⚠️</span>
        <div>
          <h4 className="text-rose-800 font-bold text-sm">Need to cancel an order?</h4>
          <p className="text-rose-600 text-xs mt-1 font-medium leading-relaxed">
            To prevent fraud and ensure items are properly returned to the marketplace stock, sellers cannot cancel orders directly. If a buyer rejects an item or you cannot fulfill it, please call/WhatsApp Admin at <strong className="font-black">0759997376</strong>.
          </p>
        </div>
      </div>

      {/* --- ORDERS LIST --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Your Sales Orders</h3>
        </div>

        {orders.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="font-medium">No orders yet. Keep sharing your ads!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {orders.map((order) => {
              const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString();
              const isCancelled = order.status === "cancelled";
              
              return (
                <div key={order.id} className="p-5 flex flex-col md:flex-row gap-4 md:items-center justify-between hover:bg-slate-50 transition-colors">
                  
                  {/* Order Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-[#D97706]">{order.orderNumber}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500 font-medium">{orderDate}</span>
                    </div>
                    
                    <p className="font-bold text-slate-900 leading-tight">
                      {order.items && order.items.length > 0 ? "Product ID: " + order.items[0].productId : "Item"}
                    </p>
                    <p className="text-sm font-extrabold mt-1 text-slate-700">UGX {(Number(order.total) || 0).toLocaleString()} (COD)</p>
                  </div>

                  {/* Buyer Contact */}
                  <div className="flex-1 bg-slate-100 rounded-lg p-3 border border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Buyer Details</p>
                    <p className="text-sm font-bold text-slate-800">{order.buyerName}</p>
                    <a href={`tel:${order.contactPhone}`} className="text-sm font-bold text-[#D97706] hover:underline flex items-center gap-1 mt-0.5">
                      📞 {order.contactPhone || "No phone"}
                    </a>
                  </div>

                  {/* Status Toggle */}
                  <div className="flex-shrink-0 w-full md:w-48 text-right">
                    {updatingId === order.id ? (
                      <span className="text-sm font-bold text-slate-400 block py-2">Updating...</span>
                    ) : isCancelled ? (
                      <span className="inline-block w-full text-center bg-red-100 text-red-800 text-xs font-bold px-3 py-2.5 rounded-lg border border-red-200">
                        CANCELLED BY ADMIN
                      </span>
                    ) : (
                      <select
                        value={order.status || "pending"}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className="w-full text-sm font-bold text-slate-700 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] cursor-pointer shadow-sm"
                      >
                        <option value="pending">⏳ Pending</option>
                        <option value="confirmed">✅ Confirmed</option>
                        <option value="out_for_delivery">🚚 Out for Delivery</option>
                        <option value="delivered">🎁 Delivered</option>
                        <option value="cancelled" disabled>❌ Cancel (Call Admin)</option>
                      </select>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
