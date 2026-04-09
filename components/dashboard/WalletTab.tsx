"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { FaWallet, FaClock, FaMoneyCheckAlt, FaInfoCircle, FaCheckCircle } from "react-icons/fa";

export default function WalletTab({ userId }: { userId: string }) {
  const [wallet, setWallet] = useState({
    available: 0,    // Ready to withdraw (Delivered & cleared)
    pending: 0,      // In Escrow (Paid, but not yet delivered/confirmed)
    withdrawn: 0     // Historical total of all money you've sent them
  });
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  useEffect(() => {
    // 🚀 Listen to the seller's wallet document in real-time
    const walletRef = doc(db, "wallets", userId);
    const unsubscribe = onSnapshot(walletRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setWallet({
          available: Number(data.availableBalance) || 0,
          pending: Number(data.pendingBalance) || 0,
          withdrawn: Number(data.totalWithdrawn) || 0,
        });
      }
      setLoading(false);
    }, (error) => {
      console.error("Wallet listener error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // Handle the manual withdrawal request
  const handleRequestPayout = async () => {
    if (wallet.available <= 0) return;
    setRequesting(true);

    try {
      // Create a ticket for the Admin to manually process
      await addDoc(collection(db, "payout_requests"), {
        sellerId: userId,
        amount: wallet.available,
        status: "pending",
        requestedAt: serverTimestamp(),
      });

      setRequestSuccess(true);
      setTimeout(() => setRequestSuccess(false), 5000);
    } catch (error) {
      console.error("Payout request failed:", error);
      alert("Failed to send request. Please contact support.");
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10 text-slate-400 text-sm">Loading wallet...</div>;
  }

  return (
    <div className="space-y-4">
      {/* 💡 EXPLANATION BANNER */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3.5 shadow-sm flex items-start gap-3">
        <FaInfoCircle className="text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-[12px] text-blue-900 leading-relaxed">
          <strong className="font-black block mb-0.5">How your wallet works</strong>
          When a buyer pays online, funds are held in <strong>Pending</strong> until the item is delivered. Once delivered, funds move to <strong>Available</strong>, minus our 5% platform commission.
        </p>
      </div>

      {/* 💰 WALLET METRICS GRID */}
      <div className="grid grid-cols-2 gap-3">
        
        {/* Available Balance (Full Width) */}
        <div className="col-span-2 bg-slate-900 rounded-xl p-5 shadow-md relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-10 text-7xl"><FaWallet /></div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 relative z-10">Available to Withdraw</p>
          <h2 className="text-3xl font-black text-white relative z-10">
            <span className="text-lg text-slate-400 mr-1">UGX</span>
            {wallet.available.toLocaleString()}
          </h2>
        </div>

        {/* Pending Escrow */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <FaClock className="text-amber-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">Pending Escrow</span>
          </div>
          <p className="text-lg font-black text-slate-800">
            UGX {wallet.pending.toLocaleString()}
          </p>
        </div>

        {/* Total Withdrawn */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <FaMoneyCheckAlt className="text-emerald-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">Total Withdrawn</span>
          </div>
          <p className="text-lg font-black text-slate-800">
            UGX {wallet.withdrawn.toLocaleString()}
          </p>
        </div>

      </div>

      {/* 🚀 WITHDRAWAL ACTION */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mt-2 text-center">
        <h3 className="font-bold text-slate-900 mb-2">Request Manual Payout</h3>
        <p className="text-xs text-slate-500 mb-4">
          Click below to notify the admin to disburse your available funds to your registered Mobile Money number. Processing takes up to 24 hours.
        </p>
        
        {requestSuccess ? (
          <div className="bg-green-50 text-green-700 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-green-200">
            <FaCheckCircle /> Request Sent Successfully!
          </div>
        ) : (
          <button 
            onClick={handleRequestPayout}
            disabled={wallet.available <= 0 || requesting}
            className={`w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider transition-all shadow-sm ${
              wallet.available > 0 
                ? "bg-[#D97706] hover:bg-amber-600 text-white active:scale-[0.98]" 
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            {requesting ? "Sending Request..." : "Request Payout"}
          </button>
        )}
      </div>

    </div>
  );
}
