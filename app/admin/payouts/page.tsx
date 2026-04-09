"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { FaMoneyBillWave, FaCheckCircle, FaTimesCircle, FaClock } from "react-icons/fa";

export default function AdminPayoutsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayouts = async () => {
      if (!user || user.role !== "admin") return;
      try {
        const res = await fetch(`/api/admin/payouts?adminId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setRequests(data.requests || []);
        }
      } catch (error) {
        console.error("Failed to fetch payouts", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayouts();
  }, [user]);

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    if (!user || user.role !== "admin") return;
    
    if (newStatus === "paid" && !window.confirm("Are you sure? This will permanently deduct the money from the seller's wallet!")) {
      return;
    }

    setProcessingId(requestId);
    try {
      const res = await fetch("/api/admin/payouts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: user.id,
          requestId,
          newStatus
        })
      });

      if (res.ok) {
        setRequests(prev => prev.map(req => 
          req.id === requestId ? { ...req, status: newStatus } : req
        ));
        alert(`Payout marked as ${newStatus.toUpperCase()}! Email ledger sent to shopkabale@gmail.com.`);
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 w-max"><FaCheckCircle /> Paid</span>;
      case 'rejected': return <span className="bg-red-100 text-red-800 border border-red-200 px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 w-max"><FaTimesCircle /> Rejected</span>;
      default: return <span className="bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 w-max"><FaClock /> Pending</span>;
    }
  };

  const formatSafeDate = (timestamp: any) => {
    if (!timestamp) return "Unknown Date";
    try {
      let d = new Date(timestamp);
      if (typeof timestamp === 'object' && timestamp.seconds) {
        d = new Date(timestamp.seconds * 1000);
      }
      return d.toLocaleString();
    } catch { return "Unknown Date"; }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 md:pb-8 p-4">
      <div className="mb-8 border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
          <FaMoneyBillWave className="text-[#D97706]" /> Payout Requests
        </h1>
        <p className="text-slate-600 mt-2 font-medium">Manage seller withdrawals and monitor the financial ledger.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-6 py-4">Request ID & Date</th>
                <th className="px-6 py-4">Seller ID</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">Loading payout requests...</td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">No pending payout requests.</td></tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-mono font-bold text-slate-800">{req.id.substring(0, 10)}...</p>
                      <p className="text-xs text-slate-500 mt-1">{formatSafeDate(req.requestedAt)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-mono text-slate-500 bg-slate-100 p-1.5 rounded w-max">{req.sellerId}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-black text-slate-900 text-lg">UGX {Number(req.amount).toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {processingId === req.id ? (
                        <span className="text-sm font-bold text-slate-400">Processing...</span>
                      ) : (
                        <select
                          value={req.status || "pending"}
                          onChange={(e) => handleStatusChange(req.id, e.target.value)}
                          disabled={req.status === "paid"} // Lock dropdown if already paid to prevent double actions
                          className={`text-sm border rounded-lg px-3 py-2 outline-none font-medium ${req.status === 'paid' ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-slate-300 text-slate-700 cursor-pointer focus:border-[#D97706]'}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Mark as Paid</option>
                          <option value="rejected">Reject</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
