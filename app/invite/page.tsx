"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { 
  FaWhatsapp, FaCopy, FaCheckCircle, FaWallet, 
  FaShieldAlt, FaBox, FaUserPlus, FaCoins, FaExclamationTriangle, FaArrowRight, FaStore, FaCog, FaChartLine
} from "react-icons/fa";

export default function InviteHubPage() {
  const { user, signIn, loading } = useAuth();
  const [copied, setCopied] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false); 

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      await signIn();
    } catch (error) {
      console.error(error);
      setIsLoggingIn(false); 
    }
  };

  if (loading || isLoggingIn) {
    return (
      <div className="min-h-[70vh] w-full flex flex-col items-center justify-center bg-slate-50 px-4">
        <div className="relative flex items-center justify-center mb-5">
          <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-[#D97706]"></div>
          <FaShieldAlt className="absolute text-[#D97706] text-xl animate-pulse" />
        </div>
        <h2 className="text-slate-900 font-black text-lg md:text-xl mb-1">Authenticating Partner...</h2>
      </div>
    );
  }

  // LOGGED-OUT VIEW
  if (!user) {
    return (
      <div className="w-full min-h-screen bg-slate-50 overflow-x-hidden">
        <div className="max-w-[480px] md:max-w-2xl mx-auto p-4 pt-8 md:pt-12 flex flex-col w-full">
          <div className="text-center mb-8 w-full">
            <span className="text-[#D97706] font-black tracking-widest uppercase text-[11px] mb-2 block">Creator & Affiliate Network</span>
            <h1 className="text-3xl font-black text-slate-900 mb-3 leading-tight">Promote Kabale.<br/>Earn Real Cash.</h1>
            <p className="text-slate-500 text-[15px] px-2 w-full font-medium">Earn up to <strong className="text-slate-900">3,000 UGX</strong> directly to your Mobile Money every time someone buys using your link.</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mb-6 w-full">
            <h2 className="font-black text-lg text-slate-900 mb-5 border-b border-slate-100 pb-3">How the network works</h2>
            <div className="space-y-6 w-full">
              <div className="flex gap-3 items-start w-full min-w-0">
                <div className="bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"><FaStore className="text-slate-400 text-[16px]" /></div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-slate-900 text-[15px]">1. Get your custom links</h3>
                  <p className="text-[13px] text-slate-500 mt-1 leading-snug">Browse the Creator Studio to generate affiliate links for specific items.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start w-full min-w-0">
                <div className="bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"><FaWhatsapp className="text-slate-400 text-[16px]" /></div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-slate-900 text-[15px]">2. Share with your audience</h3>
                  <p className="text-[13px] text-slate-500 mt-1 leading-snug">Post your links on WhatsApp statuses, class groups, or to friends directly.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start w-full min-w-0">
                <div className="bg-amber-50 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"><FaCoins className="text-[#D97706] text-[16px]" /></div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-slate-900 text-[15px]">3. Earn Instant Commissions</h3>
                  <p className="text-[13px] text-slate-500 mt-1 leading-snug">Make 10% on their cart value (up to 3k). Payouts unlock when the order is delivered.</p>
                </div>
              </div>
            </div>
          </div>
          <button onClick={handleSignIn} disabled={isLoggingIn} className="w-full bg-[#D97706] hover:bg-amber-600 text-white font-bold py-4 rounded-xl shadow-md transition-all text-[16px] flex items-center justify-center disabled:opacity-70">
            {isLoggingIn ? "Authenticating..." : "Join the Partner Network"}
          </button>
        </div>
      </div>
    );
  }

  // LOGGED-IN HUB VIEW
  const referralCode = user.referralCode || "PENDING";
  const referralLink = `https://www.kabaleonline.com/invite/${referralCode}`;
  const balance = user.referralBalance || 0;
  const currentDisplayName = user.referralName || user.displayName?.split(' ')[0] || "Kabale User";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const rawGeneralShareMsg = `Hey! 👋\n\nI get my campus supplies safely from *Kabale Online*.\n\nUse my link to order your stuff with Cash on Delivery:\n👉 ${referralLink}`;

  return (
    <div className="w-full min-h-screen bg-slate-50 overflow-x-hidden pb-10">
      <div className="max-w-[480px] md:max-w-2xl mx-auto p-4 pt-6 w-full flex flex-col">

        <div className="mb-6 border-b border-slate-200 pb-4">
          <span className="text-[#D97706] font-black tracking-widest uppercase text-[10px] mb-1 block">Partner Network</span>
          <h1 className="text-2xl font-black text-slate-900">Welcome, {currentDisplayName}!</h1>
        </div>

        {/* SETTINGS ALERT */}
{!(user.phone || user.phoneNumber) && (
  <div className="bg-red-50 border border-red-200 p-4 rounded-xl shadow-sm mb-6 flex items-center justify-between">
    <div className="flex items-start gap-3">
      <FaExclamationTriangle className="text-red-500 text-lg mt-0.5" />
      <div>
        <h2 className="font-black text-red-900 text-[14px]">Setup Required</h2>
        <p className="text-[12px] text-red-700 mt-0.5 font-medium">Add your phone number to receive payouts.</p>
      </div>
    </div>
    <Link href="/invite/settings" className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-bold text-[12px] hover:bg-red-200 transition-colors">Fix Now</Link>
  </div>
)}


        {/* QUICK BALANCE */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm mb-6 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Unpaid Wallet</p>
            <p className="text-2xl md:text-3xl font-black text-[#D97706]">{balance.toLocaleString()} <span className="text-[14px] text-amber-700">UGX</span></p>
          </div>
          <Link href="/invite/wallet" className="bg-slate-900 text-white px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-slate-800 transition-colors">Withdraw</Link>
        </div>

        {/* MAIN LINK */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm mb-6">
          <h2 className="font-black text-slate-900 mb-3 text-[14px]">Your General Link</h2>
          <div className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 overflow-hidden mb-3">
            <p className="text-[13px] font-mono text-slate-500 break-all">{referralLink}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={handleCopy} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 py-3 rounded-xl font-bold text-[13px] transition-colors flex justify-center items-center gap-1.5 border border-slate-200">
              {copied ? <FaCheckCircle className="text-green-500" /> : <FaCopy className="text-slate-400" />} {copied ? "Copied!" : "Copy"}
            </button>
            <a href={`https://wa.me/?text=${encodeURIComponent(rawGeneralShareMsg)}`} target="_blank" rel="noopener noreferrer" className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 rounded-xl shadow-sm transition-colors flex justify-center items-center gap-1.5 text-[13px]">
              <FaWhatsapp className="text-[18px]" /> Share
            </a>
          </div>
        </div>

        {/* NAVIGATION GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          <Link href="/invite/products" className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:border-[#D97706] transition-colors flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-[#D97706]"><FaStore /></div>
              <div><h3 className="font-black text-slate-900 text-[14px]">Creator Studio</h3><p className="text-[11px] text-slate-500 font-medium">Get specific product links</p></div>
            </div>
            <FaArrowRight className="text-slate-300 group-hover:text-[#D97706] transition-colors" />
          </Link>

          <Link href="/invite/wallet" className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:border-[#D97706] transition-colors flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"><FaChartLine /></div>
              <div><h3 className="font-black text-slate-900 text-[14px]">Stats & Wallet</h3><p className="text-[11px] text-slate-500 font-medium">Track conversions & withdraw</p></div>
            </div>
            <FaArrowRight className="text-slate-300 group-hover:text-[#D97706] transition-colors" />
          </Link>

          <Link href="/invite/settings" className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:border-[#D97706] transition-colors flex items-center justify-between group md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"><FaCog /></div>
              <div><h3 className="font-black text-slate-900 text-[14px]">Account Settings</h3><p className="text-[11px] text-slate-500 font-medium">Update phone, alias & read guidelines</p></div>
            </div>
            <FaArrowRight className="text-slate-300 group-hover:text-[#D97706] transition-colors" />
          </Link>
        </div>

      </div>
    </div>
  );
}
