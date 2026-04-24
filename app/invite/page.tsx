"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { 
  FaWhatsapp, FaCopy, FaCheckCircle, FaWallet, 
  FaShieldAlt, FaInfoCircle, FaBox, FaUserPlus, FaCoins
} from "react-icons/fa";

export default function ReferralPage() {
  const { user, signIn, loading } = useAuth();
  const [copied, setCopied] = useState(false);

  const botPhoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER || "256740373021";

  // Loading State
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#D97706]"></div>
      </div>
    );
  }

  // ==========================================
  // LOGGED-OUT VIEW (Professional Landing Page)
  // ==========================================
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-8 min-h-screen bg-slate-50 pt-10">
        <div className="text-center mb-10">
          <span className="text-[#D97706] font-bold tracking-widest uppercase text-xs mb-2 block">
            Kabale Online Partner Program
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 leading-tight">
            Invite Friends.<br/>Earn Real Cash.
          </h1>
          <p className="text-slate-600 text-base md:text-lg px-2 max-w-lg mx-auto">
            Get paid <strong className="text-slate-900">3,000 UGX</strong> directly to your Mobile Money for every new customer you bring to Kabale Online.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm mb-8">
          <h2 className="font-bold text-xl text-slate-900 mb-6 border-b border-slate-100 pb-4">
            How it works
          </h2>

          <div className="space-y-8">
            <div className="flex gap-4 items-start">
              <div className="bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <FaUserPlus className="text-slate-600 text-lg" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">1. Share your link</h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  Sign in to generate your unique partner link. Share it on WhatsApp statuses, group chats, or directly with friends.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <FaBox className="text-slate-600 text-lg" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">2. Friend places their first order</h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  They click your link and order any <strong className="text-slate-800">Official Kabale Online item</strong>. It must be their very first purchase on our platform.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="bg-[#D97706]/10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <FaCoins className="text-[#D97706] text-lg" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">3. Get Paid</h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  Once their order is delivered and completed, 3,000 UGX is instantly credited to your dashboard. Withdraw to MTN/Airtel or use it as a discount.
                </p>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={signIn}
          className="w-full bg-[#D97706] hover:bg-amber-600 text-white font-bold py-4 rounded-xl shadow-md transition-all text-lg flex items-center justify-center gap-2"
        >
          Login to Partner Dashboard
        </button>

        <div className="mt-8 flex items-start gap-3 bg-slate-200/50 p-4 rounded-xl text-sm text-slate-600">
          <FaShieldAlt className="text-slate-400 text-xl flex-shrink-0 mt-0.5" />
          <p>
            <strong>Fraud Protection:</strong> Self-referrals and duplicate accounts are strictly monitored. Rewards only apply to first-time buyers completing an official store purchase.
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // LOGGED-IN VIEW (Professional Partner Dashboard)
  // ==========================================

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

  const handleWithdrawCash = () => {
    const msg = `Hello! I have ${balance.toLocaleString()} UGX in my Kabale Online Partner balance and I would like to withdraw it to my Mobile Money. \n\nMy email is: ${user.email}`;
    window.open(`https://wa.me/${botPhoneNumber}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleUseInStore = () => {
    const msg = `Hello! I just placed an order on Kabale Online and I would like to apply my ${balance.toLocaleString()} UGX Partner balance as a discount. \n\nMy email is: ${user.email}`;
    window.open(`https://wa.me/${botPhoneNumber}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const shareMessage = encodeURIComponent(`I buy all my electronics and student supplies on Kabale Online. Use my link to shop safely: ${referralLink}`);

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 min-h-screen bg-slate-50 pt-8">
      <div className="mb-8 border-b border-slate-200 pb-6">
        <span className="text-[#D97706] font-bold tracking-widest uppercase text-[10px] mb-1 block">
          Partner Dashboard
        </span>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900">Refer & Earn</h1>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-slate-200 p-5 md:p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <FaWallet className="text-lg" />
            <p className="text-xs font-bold uppercase tracking-wider">Available Balance</p>
          </div>
          <p className="text-3xl font-black text-[#D97706]">{balance.toLocaleString()} <span className="text-lg text-amber-700">UGX</span></p>
        </div>

        <div className="bg-white border border-slate-200 p-5 md:p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <FaUserPlus className="text-lg" />
            <p className="text-xs font-bold uppercase tracking-wider">Successful Invites</p>
          </div>
          <p className="text-3xl font-black text-slate-900">{count}</p>
        </div>
      </div>

      {/* The Link */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm mb-8">
        <h2 className="font-bold text-slate-900 mb-4">Your Tracking Link</h2>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 bg-slate-50 p-3.5 rounded-xl border border-slate-200 overflow-hidden">
            <p className="text-sm font-mono text-slate-700 truncate select-all">{referralLink}</p>
          </div>
          <button 
            onClick={handleCopy}
            className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-xl font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2 flex-shrink-0"
          >
            {copied ? <FaCheckCircle className="text-green-400" /> : <FaCopy />}
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>

        <a 
          href={`https://wa.me/?text=${shareMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full mt-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3.5 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-[15px]"
        >
          <FaWhatsapp className="text-xl" /> Share directly on WhatsApp
        </a>
      </div>

      {/* Redemption Section */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm mb-8">
        <h2 className="font-bold text-slate-900 mb-5 border-b border-slate-100 pb-3">Claim your earnings</h2>

        {balance >= 3000 ? (
          <div className="flex flex-col md:flex-row gap-3">
            <button 
              onClick={handleWithdrawCash}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm"
            >
              Withdraw Mobile Money
            </button>
            <button 
              onClick={handleUseInStore}
              className="flex-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
            >
              Use as Order Discount
            </button>
          </div>
        ) : (
          <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <FaInfoCircle className="text-slate-400 text-xl flex-shrink-0 mt-0.5" />
            <p className="text-sm text-slate-600">
              The minimum withdrawal amount is <strong className="text-slate-900">3,000 UGX</strong>. Keep sharing your link to earn more!
            </p>
          </div>
        )}
      </div>

      {/* Rules Notice */}
      <div className="bg-slate-100 p-5 rounded-2xl border border-slate-200 text-sm text-slate-600 space-y-2">
        <p className="font-bold text-slate-800 mb-3 uppercase tracking-wider text-[11px]">Program Guidelines</p>
        <p>• <strong className="text-slate-800">Official Items Only:</strong> Rewards are only triggered when your friend buys an official item managed directly by Kabale Online (Not third-party vendors).</p>
        <p>• <strong className="text-slate-800">First Order Only:</strong> The reward only applies to the referred user's very first completed purchase.</p>
        <p>• <strong className="text-slate-800">Completed Orders:</strong> Earnings are credited automatically as soon as the delivery is marked as successful by our riders.</p>
      </div>

    </div>
  );
}