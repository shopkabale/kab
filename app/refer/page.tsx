"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { FaWhatsapp, FaCopy, FaGift, FaWallet, FaCheckCircle, FaShareAlt } from "react-icons/fa";
import Link from "next/link";

export default function ReferralPage() {
  const { user, signIn, loading } = useAuth();
  const [copied, setCopied] = useState(false);

  const botPhoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER || "256740373021";

  // Loading State
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D97706]"></div>
      </div>
    );
  }

  // ==========================================
  // LOGGED-OUT VIEW (Marketing Landing Page)
  // ==========================================
  if (!user) {
    return (
      <div className="max-w-md mx-auto p-4 md:p-8 min-h-screen bg-slate-50 flex flex-col pt-8">
        <div className="text-center mb-8">
          <div className="bg-[#D97706]/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaGift className="text-4xl text-[#D97706]" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-3 leading-tight">
            Earn 3,000 UGX for every friend you bring
          </h1>
          <p className="text-slate-600 text-[15px] px-2">
            Invite friends, family, or course mates. When they make their first purchase on Kabale Online, you earn instantly.
          </p>
        </div>

        <button 
          onClick={signIn}
          className="w-full bg-[#D97706] hover:bg-amber-600 text-white font-bold py-4 rounded-xl shadow-md transition-all text-lg mb-4"
        >
          Login to Start Earning
        </button>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mt-6">
          <h2 className="font-bold text-lg text-slate-800 mb-5 text-center">How it works</h2>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center font-black text-slate-700 flex-shrink-0">1</div>
              <div>
                <h3 className="font-bold text-slate-800">Share your link</h3>
                <p className="text-sm text-slate-500 mt-1">Send your unique link to WhatsApp groups, statuses, or direct messages.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center font-black text-slate-700 flex-shrink-0">2</div>
              <div>
                <h3 className="font-bold text-slate-800">Friend buys</h3>
                <p className="text-sm text-slate-500 mt-1">They click your link and complete their first order (Cash on Delivery or LivePay).</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-[#D97706]/20 w-8 h-8 rounded-full flex items-center justify-center font-black text-[#D97706] flex-shrink-0">3</div>
              <div>
                <h3 className="font-bold text-slate-800">You Earn!</h3>
                <p className="text-sm text-slate-500 mt-1">Get 3,000 UGX to withdraw as Mobile Money or use as a store discount.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // LOGGED-IN VIEW (Referral Dashboard)
  // ==========================================
  
  // Fallback if the user object hasn't updated with the code yet
  const referralCode = user.referralCode || "PENDING";
  const referralLink = `https://www.kabaleonline.com/?ref=${referralCode}`;
  const balance = user.referralBalance || 0;
  const count = user.referralCount || 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // WhatsApp Redemption Actions
  const handleWithdrawCash = () => {
    const msg = `Hello! I have ${balance} UGX in my Kabale Online referral balance and I would like to withdraw it to my Mobile Money. \n\nMy email is: ${user.email}`;
    window.open(`https://wa.me/${botPhoneNumber}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleUseInStore = () => {
    const msg = `Hello! I just placed an order on Kabale Online and I would like to apply my ${balance} UGX referral balance as a discount. \n\nMy email is: ${user.email}`;
    window.open(`https://wa.me/${botPhoneNumber}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const shareMessage = encodeURIComponent(`Shop safely on Kabale Online using my link: ${referralLink}`);

  return (
    <div className="max-w-md mx-auto p-4 md:p-8 min-h-screen bg-slate-50">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-slate-900">Your Referrals</h1>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm text-center">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Earned</p>
          <p className="text-2xl font-black text-[#D97706]">{balance.toLocaleString()} UGX</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm text-center">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Friends Invited</p>
          <p className="text-2xl font-black text-slate-800">{count}</p>
        </div>
      </div>

      {/* The Link */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm mb-6">
        <h2 className="font-bold text-slate-800 text-sm mb-3">Your Unique Link</h2>
        <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <div className="flex-1 overflow-hidden px-3">
            <p className="text-sm font-mono text-slate-600 truncate">{referralLink}</p>
          </div>
          <button 
            onClick={handleCopy}
            className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-slate-50 transition-colors flex items-center gap-2 flex-shrink-0"
          >
            {copied ? <FaCheckCircle className="text-green-500" /> : <FaCopy />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <a 
          href={`https://wa.me/?text=${shareMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full mt-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3.5 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-[15px]"
        >
          <FaWhatsapp className="text-xl" /> Share on WhatsApp
        </a>
      </div>

      {/* Redemption Section */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm mb-8">
        <div className="flex items-center gap-2 mb-4">
          <FaWallet className="text-[#D97706] text-xl" />
          <h2 className="font-bold text-slate-800">Claim your money</h2>
        </div>

        {balance >= 3000 ? (
          <div className="space-y-3">
            <button 
              onClick={handleWithdrawCash}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              Withdraw Cash (Mobile Money)
            </button>
            <button 
              onClick={handleUseInStore}
              className="w-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              Use as Discount on an Order
            </button>
          </div>
        ) : (
          <div className="text-center py-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-sm text-slate-500 font-medium">
              You need at least <strong className="text-slate-800">3,000 UGX</strong> to claim a reward. Keep sharing your link!
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
