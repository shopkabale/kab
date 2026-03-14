"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Order } from "@/types";

export default function VendorOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "confirmed" | "out_for_delivery" | "delivered">("all");

  useEffect(() => {
    const fetchVendorOrders = async () => {
      if (!user) return;
      try {
        // We are assuming you have an API route that fetches orders BY SELLER ID
        const res = await fetch(`/api/orders/vendor?sellerId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch (error) {
        console.error("Failed to fetch vendor orders:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchVendorOrders();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  // Handle status updates from the vendor
  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      // Assuming you have an API route to update order status
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, vendorId: user?.id }),
      });

      if (res.ok) {
        setOrders(orders.map(order => 
          order.id === orderId ? { ...order, status: newStatus as any } : order
        ));
      } else {
        alert("Failed to update order status.");
      }
    } catch (error) {
      console.error(error);
      alert("Error updating status.");
    }
  };

  const filteredOrders = statusFilter === "all" 
    ? orders 
    : orders.filter(order => order.status === statusFilter);

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Order Management</h1>
          <p className="text-slate-500 mt-1">Track and update the status of customer purchases.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
        {["all", "pending", "confirmed", "out_for_delivery", "delivered"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status as any)}
            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
              statusFilter === status 
                ? "bg-amber-500 text-white shadow-sm" 
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {status === "all" ? "All Orders" : status.replace(/_/g, " ").toUpperCase()}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-12 text-center">
          <div className="text-4xl mb-4">🛒</div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No orders found</h3>
          <p className="text-slate-500">You don't have any {statusFilter !== "all" ? statusFilter.replace(/_/g, " ") : ""} orders yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const safeOrderNumber = order.orderNumber || "ORD-N/A";
            const safeDate = new Date(order.createdAt).toLocaleDateString();
            
            return (
              <div key={order.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                
                {/* Order Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-sm font-extrabold text-slate-900">{safeOrderNumber}</span>
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                        order.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                        order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'out_for_delivery' ? 'bg-purple-100 text-purple-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{safeDate} • Pay on Delivery</p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Order Total</p>
                    <p className="text-lg font-extrabold text-amber-600">UGX {order.total.toLocaleString()}</p>
                  </div>
                </div>

                {/* Order Details & Actions */}
                <div className="p-6 flex flex-col md:flex-row justify-between gap-6">
                  
                  {/* Items List */}
                  <div className="flex-1 space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Items Purchased</h4>
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="text-slate-700 font-medium">
                          {item.quantity}x Product ID: {item.productId}
                        </span>
                        <span className="text-slate-900 font-bold">UGX {item.price.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  {/* Status Update Actions */}
                  <div className="md:w-64 flex flex-col gap-2 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Update Status</h4>
                    
                    <select 
                      value={order.status}
                      onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block p-2.5 font-bold outline-none"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="out_for_delivery">Out for Delivery</option>
                      <option value="delivered">Delivered</option>
                    </select>
                    
                    <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                      Updating the status will notify the customer. Only mark as Delivered once cash is received.
                    </p>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
