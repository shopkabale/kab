"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { FaChevronDown, FaChevronUp, FaWhatsapp, FaGlobe, FaGift } from "react-icons/fa";

export default function AdminOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

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

  const toggleRow = (orderId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(orderId)) {
      newExpandedRows.delete(orderId);
    } else {
      newExpandedRows.add(orderId);
    }
    setExpandedRows(newExpandedRows);
  };

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
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': 
      case 'pending': return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'lead': return 'bg-pink-100 text-pink-800 border border-pink-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'out_for_delivery': return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'delivered': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-slate-100 text-slate-800 border border-slate-200';
    }
  };

  const formatSafeDate = (createdAt: any) => {
    if (!createdAt) return "Unknown Date";
    try {
      let parsedDate = new Date(createdAt);
      if (typeof createdAt === 'object') {
        if (createdAt._seconds) {
          parsedDate = new Date(createdAt._seconds * 1000);
        } else if (createdAt.seconds) {
          parsedDate = new Date(createdAt.seconds * 1000);
        }
      }
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleString();
      }
      return "Unknown Date";
    } catch {
      return "Unknown Date";
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 md:pb-8 p-4">
      <div className="mb-8 border-b border-slate-200 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Order Management</h1>
          <p className="text-slate-600 mt-2 font-medium">Track Unified Orders, Payments, and Multi-Seller Routing.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-6 py-4 w-12"></th>
                <th className="px-6 py-4">Order ID & Date</th>
                <th className="px-6 py-4">Buyer Info</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">Loading master orders...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">No orders found.</td>
                </tr>
              ) : (
                orders.map((order) => {
                  const safeTotal = Number(order.totalAmount || order.total) || 0;
                  const safeDate = formatSafeDate(order.createdAt);
                  const displayId = order.orderId || order.id.substring(0, 8).toUpperCase();
                  const itemCount = order.cartItems?.length || order.items?.length || 1;
                  const isExpanded = expandedRows.has(order.id);

                  return (
                    <React.Fragment key={order.id}>
                      {/* MAIN MASTER ROW */}
                      <tr className={`hover:bg-slate-50 transition-colors ${isExpanded ? 'bg-slate-50' : ''}`}>
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => toggleRow(order.id)}
                            className="p-2 text-slate-400 hover:text-[#D97706] hover:bg-amber-50 rounded-full transition-colors"
                          >
                            {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <p className="font-mono font-bold text-[#D97706]">{displayId}</p>
                            {order.source === "whatsapp" ? (
                              <FaWhatsapp className="text-green-500" title="WhatsApp Order" />
                            ) : (
                              <FaGlobe className="text-blue-500" title="Website Order" />
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{safeDate}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900 text-sm">{order.buyerName || "Guest User"}</p>
                            {/* 🚀 ADDED: Referral Badge */}
                            {order.referralCodeUsed && (
                              <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                <FaGift /> Ref: {order.referralCodeUsed}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{order.buyerPhone || "No Phone"}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">UGX {safeTotal.toLocaleString()}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{order.paymentMode || "COD"}</span>
                            {order.paymentStatus === "paid" ? (
                              <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded uppercase">Paid</span>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded uppercase">Unpaid</span>
                            )}
                          </div>
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
                              className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] font-medium text-slate-700 cursor-pointer"
                            >
                              <option value="new">New</option>
                              <option value="lead">Lead (WhatsApp)</option>
                              <option value="processing">Processing</option>
                              <option value="out_for_delivery">Out for Delivery</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          )}
                        </td>
                      </tr>

                      {/* EXPANDED SELLER BREAKDOWN ROW */}
                      {isExpanded && (
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <td colSpan={6} className="px-6 py-6 border-l-4 border-l-[#D97706]">
                            <div className="max-w-3xl">
                              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Master Order Details ({itemCount} items)</h4>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {order.sellerOrders && order.sellerOrders.length > 0 ? (
                                  order.sellerOrders.map((seller: any, idx: number) => (
                                    <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                      <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-3">
                                        <div>
                                          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Seller Routing</p>
                                          <p className="font-mono font-bold text-slate-800 mt-1">{seller.sellerPhone}</p>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Cut</p>
                                          <p className="font-bold text-[#D97706] mt-1">UGX {Number(seller.subtotal).toLocaleString()}</p>
                                        </div>
                                      </div>
                                      <ul className="space-y-2">
                                        {seller.items?.map((item: any, i: number) => (
                                          <li key={i} className="flex justify-between text-sm">
                                            <span className="text-slate-700"><span className="font-bold text-slate-400 mr-2">{item.quantity}x</span> {item.name}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ))
                                ) : (
                                  // Fallback for older orders that don't have the new sellerOrders array yet
                                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                    <p className="text-xs text-slate-500 italic">Legacy order format (No seller split data)</p>
                                    <ul className="mt-2">
                                      {(order.cartItems || order.items || []).map((item: any, i: number) => (
                                        <li key={i} className="text-sm text-slate-700">{item.quantity || 1}x {item.name || item.title}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
