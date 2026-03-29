"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  getPendingRequests, 
  getSponsoredSlots, 
  approveRequest, 
  SponsoredRequest, 
  SponsoredSlot 
} from "@/lib/sponsored";

export default function AdminSponsoredSlots() {
  const [requests, setRequests] = useState<SponsoredRequest[]>([]);
  const [slots, setSlots] = useState<SponsoredSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      setRequests(await getPendingRequests());
      setSlots(await getSponsoredSlots());
    } catch (error) {
      console.error("Failed to load admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (req: SponsoredRequest) => {
    // 1. Find the first available slot
    const availableSlot = slots.find(s => s.status === "available")?.id;
    
    // 2. Determine default slot (use available, or default to slot_1 if all full but user is booking next round)
    const defaultSlot = availableSlot || "slot_1"; 
    
    // 3. Ask admin to confirm the slot assignment
    const targetSlot = window.prompt(
      `Assigning product ${req.productId} for user ${req.sellerUid.substring(0, 6)}...\n\nEnter slot ID (slot_1, slot_2, slot_3, slot_4):`, 
      defaultSlot
    );
    
    if (!targetSlot) return; // Admin cancelled

    // 4. Validate slot ID
    if (!["slot_1", "slot_2", "slot_3", "slot_4"].includes(targetSlot)) {
      alert("Invalid slot ID. Must be slot_1, slot_2, slot_3, or slot_4.");
      return;
    }

    setProcessingId(req.id || null);
    try {
      await approveRequest(req.id!, targetSlot, req);
      alert(`Successfully activated in ${targetSlot}!`);
      await loadData(); // Refresh the lists
    } catch (error) {
      console.error(error);
      alert("Failed to approve request.");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="animate-pulse flex flex-col gap-4">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      
      {/* NAVIGATION */}
      <Link 
        href="/admin" 
        className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-[#D97706] transition-colors mb-6"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Admin Home
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
          Admin: Sponsored Approvals
        </h1>
        <div className="flex gap-3 text-sm">
          <div className="bg-slate-100 dark:bg-[#111] px-4 py-2 rounded-md font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
            Pending: <span className="text-[#D97706]">{requests.length}</span>
          </div>
          <div className="bg-slate-100 dark:bg-[#111] px-4 py-2 rounded-md font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
            Active Slots: <span className="text-red-500">{slots.filter(s => s.status === 'active').length}/4</span>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-[#151515] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-[#111] border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-xs font-black tracking-wider">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Seller ID</th>
                <th className="p-4">Product ID</th>
                <th className="p-4">Payment Ref</th>
                <th className="p-4">Type</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {requests.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">
                    No pending sponsorship requests right now.
                  </td>
                </tr>
              )}
              {requests.map(req => (
                <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                  <td className="p-4 text-slate-600 dark:text-slate-400">
                    {req.createdAt ? new Date(req.createdAt.toMillis()).toLocaleDateString() : 'Just now'}
                  </td>
                  <td className="p-4 font-mono text-xs text-slate-500">{req.sellerUid}</td>
                  <td className="p-4 font-mono font-bold text-slate-900 dark:text-slate-200">{req.productId}</td>
                  <td className="p-4">
                    <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded text-xs font-bold font-mono">
                      {req.paymentRef}
                    </span>
                  </td>
                  <td className="p-4">
                    {req.isExtension ? (
                      <span className="text-blue-600 dark:text-blue-400 font-bold text-xs uppercase flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                        Extension
                      </span>
                    ) : (
                      <span className="text-slate-600 dark:text-slate-400 font-bold text-xs uppercase flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        New Slot
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleApprove(req)} 
                      disabled={processingId === req.id}
                      className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 disabled:opacity-50 text-white dark:text-slate-900 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-md transition-colors shadow-sm"
                    >
                      {processingId === req.id ? "Processing..." : "Verify & Approve"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
