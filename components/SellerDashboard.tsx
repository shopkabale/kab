"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config"; // Your client Firebase config
import Image from "next/image";

interface Order {
  id: string;
  itemId: string;
  itemName: string;
  itemImage: string;
  price: number;
  buyerName: string;
  buyerPhone: string;
  buyerLocation: string;
  status: "pending" | "completed" | "cancelled";
  createdAt: any;
}

export default function SellerDashboard({ userId }: { userId: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchOrders = async () => {
      try {
        // Fetch orders where this user is the seller
        const q = query(
          collection(db, "orders"),
          where("sellerId", "==", userId),
          orderBy("createdAt", "desc")
        );
        
        const snap = await getDocs(q);
        const fetchedOrders = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Order[];
        
        setOrders(fetchedOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userId]);

  const updateOrderStatus = async (orderId: string, newStatus: Order["status"]) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
      // Update local UI instantly
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (error) {
      alert("Failed to update order status.");
      console.error(error);
    }
  };

  // Calculate Quick Stats
  const pendingCount = orders.filter(o => o.status === "pending").length;
  const totalRevenue = orders
    .filter(o => o.status === "completed")
    .reduce((sum, order) => sum + Number(order.price), 0);

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium animate-pulse">Loading your orders...</div>;
  }

  return (
    <div className="space-y-8">
      
      {/* 1. Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-sm font-bold text-slate-500 mb-1">Total Orders</p>
          <p className="text-2xl font-black text-slate-900">{orders.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm bg-amber-50/50">
          <p className="text-sm font-bold text-amber-700 mb-1">Action Needed</p>
          <p className="text-2xl font-black text-amber-900">{pendingCount}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm bg-emerald-50/50 md:col-span-2">
          <p className="text-sm font-bold text-emerald-700 mb-1">Total Earned (Completed)</p>
          <p className="text-2xl font-black text-emerald-900">UGX {totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* 2. Orders List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-900">Recent Orders</h3>
        </div>

        {orders.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            <span className="text-4xl block mb-3">🛒</span>
            <p className="font-medium">No orders yet. Keep listing great items!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {orders.map(order => {
              const date = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : "Recent";
              
              return (
                <div key={order.id} className="p-5 flex flex-col md:flex-row gap-5 items-start md:items-center hover:bg-slate-50 transition-colors">
                  
                  {/* Item Image & Info */}
                  <div className="flex gap-4 flex-1">
                    <img src={order.itemImage || "/og-image.jpg"} alt={order.itemName} className="w-16 h-16 rounded-lg object-cover border border-slate-200" />
                    <div>
                      <h4 className="font-bold text-slate-900 leading-tight">{order.itemName}</h4>
                      <p className="text-primary font-bold text-sm mt-1">UGX {Number(order.price).toLocaleString()}</p>
                      <p className="text-xs text-slate-500 mt-1 font-medium">{date}</p>
                    </div>
                  </div>

                  {/* Buyer Info */}
                  <div className="flex-1 bg-slate-100 p-3 rounded-lg w-full md:w-auto">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Buyer Details</p>
                    <p className="text-sm font-bold text-slate-900">👤 {order.buyerName}</p>
                    <p className="text-sm text-slate-700 mt-1">📞 <a href={`tel:${order.buyerPhone}`} className="text-sky-600 hover:underline">{order.buyerPhone}</a></p>
                    <p className="text-sm text-slate-700 mt-1">📍 {order.buyerLocation}</p>
                  </div>

                  {/* Status Actions */}
                  <div className="w-full md:w-auto flex flex-row md:flex-col gap-2 justify-end">
                    {order.status === "pending" ? (
                      <>
                        <button 
                          onClick={() => updateOrderStatus(order.id, "completed")}
                          className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                        >
                          Mark Sold
                        </button>
                        <button 
                          onClick={() => updateOrderStatus(order.id, "cancelled")}
                          className="flex-1 md:flex-none bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <span className={`px-4 py-2 rounded-lg text-sm font-bold text-center ${
                        order.status === "completed" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                      }`}>
                        {order.status.toUpperCase()}
                      </span>
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