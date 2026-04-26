"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { FaWhatsapp, FaUsers, FaMoneyBillWave, FaTrophy, FaCheckCircle } from "react-icons/fa";

export default function AdminPartnersPage() {
  const { user } = useAuth();
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPartners = async () => {
      if (!user || user.role !== "admin") return; 
      
      try {
        const res = await fetch(`/api/admin/partners?adminId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setPartners(data.partners || []);
        }
      } catch (error) {
        console.error("Failed to fetch partners", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPartners();
  }, [user]);

  const handleClearBalance = async (partnerId: string, currentBalance: number, partnerName: string) => {
    if (currentBalance <= 0) {
      return alert("This partner currently has a balance of 0 UGX.");
    }

    const confirmed = window.confirm(
      `Have you sent the ${currentBalance.toLocaleString()} UGX Mobile Money to ${partnerName}?\n\nClicking OK will reset their wallet balance to 0.`
    );

    if (!confirmed) return;

    setProcessingId(partnerId);
    try {
      const res = await fetch("/api/admin/partners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: user?.id,
          partnerId,
          action: "CLEAR_BALANCE"
        })
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        // Update UI instantly
        setPartners(prev => prev.map(p => 
          p.id === partnerId ? { ...p, referralBalance: 0 } : p
        ));
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (error) {
      console.error(error);
      alert("Network error while updating balance.");
    } finally {
      setProcessingId(null);
    }
  };

  const totalPlatformPayouts = partners.reduce((sum, p) => sum + (Number(p.referralBalance) || 0), 0);
  const totalConversions = partners.reduce((sum, p) => sum + (Number(p.referralCount) || 0), 0);

  return (
    <div className="max-w-6xl mx-auto pb-20 md:pb-8 p-4">
      {/* HEADER */}
      <div className="mb-8 border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
          <FaUsers className="text-[#D97706]" /> Partner Network
        </h1>
        <p className="text-slate-600 mt-2 font-medium">Manage affiliates, track conversions, and settle payouts.</p>
      </div>

      {/* STATS BOARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <FaUsers /> <h3 className="font-bold uppercase tracking-wider text-[11px]">Active Partners</h3>
          </div>
          <p className="text-3xl font-black text-slate-900">{partners.length}</p>
        </div>
        
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <FaCheckCircle className="text-green-500" /> <h3 className="font-bold uppercase tracking-wider text-[11px]">Total Conversions</h3>
          </div>
          <p className="text-3xl font-black text-slate-900">{totalConversions}</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-amber-700 mb-2">
            <FaMoneyBillWave /> <h3 className="font-bold uppercase tracking-wider text-[11px]">Pending Payouts</h3>
          </div>
          <p className="text-3xl font-black text-[#D97706]">{totalPlatformPayouts.toLocaleString()} UGX</p>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-6 py-4">Partner Details</th>
                <th className="px-6 py-4 text-center">Referral Code</th>
                <th className="px-6 py-4 text-center">Conversions</th>
                <th className="px-6 py-4 text-right">Unpaid Balance</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">Loading partner data...</td>
                </tr>
              ) : partners.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">No partners have generated a link yet.</td>
                </tr>
              ) : (
                partners.map((partner, index) => {
                  const balance = Number(partner.referralBalance) || 0;
                  const count = Number(partner.referralCount) || 0;
                  const isTopPartner = index === 0 && count > 0;

                  return (
                    <tr key={partner.id} className="hover:bg-slate-50 transition-colors">
                      
                      {/* DETAILS */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                            {partner.photoURL ? (
                              <img src={partner.photoURL} className="w-full h-full rounded-full object-cover" alt="Profile" />
                            ) : (
                              (partner.referralName || partner.displayName || "U")[0].toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900">{partner.referralName || partner.displayName || "Unknown"}</p>
                              {isTopPartner && <FaTrophy className="text-amber-500" title="Top Earner" />}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {partner.phone ? (
                                <a href={`https://wa.me/${partner.phone}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-green-600 hover:underline font-medium">
                                  <FaWhatsapp /> {partner.phone}
                                </a>
                              ) : (
                                <span className="text-xs text-red-500 font-medium">No Phone Linked</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* CODE */}
                      <td className="px-6 py-4 text-center">
                        <span className="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg font-mono font-bold text-sm tracking-wider">
                          {partner.referralCode}
                        </span>
                      </td>

                      {/* CONVERSIONS */}
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${count > 0 ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500'}`}>
                          {count} Orders
                        </span>
                      </td>

                      {/* BALANCE */}
                      <td className="px-6 py-4 text-right">
                        <p className={`font-black ${balance > 0 ? 'text-[#D97706]' : 'text-slate-400'}`}>
                          {balance.toLocaleString()} UGX
                        </p>
                      </td>

                      {/* ACTION */}
                      <td className="px-6 py-4 text-right">
                        {processingId === partner.id ? (
                          <span className="text-sm font-bold text-slate-400">Processing...</span>
                        ) : (
                          <button
                            onClick={() => handleClearBalance(partner.id, balance, partner.referralName || partner.displayName || "Partner")}
                            disabled={balance <= 0}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                              balance > 0 
                              ? 'bg-slate-900 text-white hover:bg-slate-800' 
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            Settle Payout
                          </button>
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
