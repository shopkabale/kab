"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Order } from "@/types";

export default function AdminOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllOrders = async () => {
      if (!user || user.role !== "admin") return;
      try {
        const res = await fetch(`/api/admin/orders?adminId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch (error) {
        console.error("Failed to fetch orders", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllOrders();
  }, [user]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    if (!user || user.role !== "admin") return;

    setProcessingId(orderId);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: user.id,
          orderId,
          newStatus
        })
      });

      if (res.ok) {
        // Update local state instantly so UI feels snappy
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, status: newStatus as any } : order
        ));
      } else {
        alert("Failed to update status.");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setProcessingId(null);
    }
  };

  // Helper function to color-code statuses
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'out_for_delivery': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-emerald-100 text-emerald-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  // 🔥 ULTIMATE BULLETPROOF DATE PARSER
  const formatSafeDate = (createdAt: any) => {
    if (!createdAt) return "Unknown Date";

    try {
      // 1. Assume it's a normal number (Date.now()) or ISO string from the website
      let parsedDate = new Date(createdAt);

      // 2. Catch mangled Firebase Timestamp objects from the old WhatsApp orders
      if (typeof createdAt === 'object') {
        if (createdAt._seconds) {
          parsedDate = new Date(createdAt._seconds * 1000);
        } else if (createdAt.seconds) {
          parsedDate = new Date(createdAt.seconds * 1000);
        }
      }

      // 3. Return a clean string if valid
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleString();
      }

      return "Unknown Date";
    } catch {
      return "Unknown Date";
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 md:pb-0">
      <div className="mb-8 border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-extrabold text-slate-900">Order Management</h1>
        <p className="text-slate-600 mt-2 font-medium">Track Cash on Delivery orders and update delivery statuses.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-6 py-4">Order ID & Date</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4">Current Status</th>
                <th className="px-6 py-4 text-right">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">Loading marketplace orders...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">No orders have been placed yet.</td>
                </tr>
              ) : (
                orders.map((order) => {
                  const safeTotal = Number(order.total) || 0;
                  
                  // 🔥 USE THE BULLETPROOF DATE PARSER HERE
                  const safeDate = formatSafeDate(order.createdAt);
                  
                  // Better fallback for older orders without a KAB- number
                  const displayId = order.orderNumber || order.id.substring(0, 8).toUpperCase();

                  return (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-mono font-bold text-primary">{displayId}</p>
                        <p className="text-xs text-slate-500 mt-1">{safeDate}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">UGX {safeTotal.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">COD</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center justify-center bg-slate-100 text-slate-700 text-xs font-bold w-6 h-6 rounded-full">
                          {order.items?.length || 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider ${getStatusColor(order.status || 'pending')}`}>
                          {(order.status || 'pending').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {processingId === order.id ? (
                          <span className="text-sm font-bold text-slate-400">Updating...</span>
                        ) : (
                          <select
                            value={order.status || "pending"}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium text-slate-700 cursor-pointer"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="out_for_delivery">Out for Delivery</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
