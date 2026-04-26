"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { FaArrowLeft, FaShieldAlt, FaWallet, FaUserPlus, FaInfoCircle, FaMoneyBillWave, FaShoppingCart } from "react-icons/fa";

export default function WalletPage() {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
        <FaShieldAlt className="text-[#D97706] text-3xl animate-pulse" />
      </div>
    );
  }

  const referralCode = user.referralCode || "PENDING";
  const balance = user.referralBalance || 0;
  const count = user.referralCount || 0;
  const botPhoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER || "256740373021";

  const rawWithdrawMsg = `*Partner Payout Request* 💰\n\n*Partner ID:* ${referralCode}\n*Email:* ${user.email}\n*Amount:* ${balance.toLocaleString()} UGX\n\n*Action:* Please process my pending commission via Mobile Money.`;
  const rawDiscountMsg = `*Partner Discount Request* 🛍️\n\n*Partner ID:* ${referralCode}\n*Email:* ${user.email}\n*Balance to Apply:* ${balance.toLocaleString()} UGX\n\n*Action:* I just placed a COD order and want to use my affiliate wallet as a discount.`;

  return (
    <div className="w-full min-h-screen bg-slate-50 pb-10">
      <div className="max-w-[480px] md:max-w-2xl mx-auto p-4 pt-6">
        
        <Link href="/invite" className="inline-flex items-center gap-2 text-slate-500 font-bold text-[12px] mb-6 hover:text-slate-900 transition-colors uppercase tracking-wider">
          <FaArrowLeft /> Back to Dashboard
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900">Wallet & Stats</h1>
          <p className="text-slate-500 text-[14px] font-medium mt-1">Track your network performance and claim your earnings.</p>
        </div>

        {/* STATS BOARD */}
        <div className="grid grid-cols-2 gap-3 mb-6 w-full">
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm w-full flex flex-col min-w-0">
            <div className="flex items-center gap-2 text-slate-400 mb-2 w-full min-w-0">
              <FaWallet className="text-[15px] flex-shrink-0" />
              <p className="text-[11px] font-black uppercase tracking-wider truncate w-full text-slate-500">Unpaid Wallet</p>
            </div>
            <p className="text-2xl md:text-3xl font-black text-[#D97706] truncate w-full">
              {balance.toLocaleString()} <span className="text-[13px] text-amber-700">UGX</span>
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm w-full flex flex-col min-w-0">
            <div className="flex items-center gap-2 text-slate-400 mb-2 w-full min-w-0">
              <FaUserPlus className="text-[15px] flex-shrink-0" />
              <p className="text-[11px] font-black uppercase tracking-wider truncate w-full text-slate-500">Conversions</p>
            </div>
            <p className="text-2xl md:text-3xl font-black text-slate-900 truncate w-full">{count}</p>
          </div>
        </div>

        {/* REDEMPTION SECTION */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm mb-6 w-full">
          <h2 className="font-black text-slate-900 mb-4 text-[15px] border-b border-slate-100 pb-3">Claim Your Earnings</h2>

          {balance >= 3000 ? (
            <div className="flex flex-col gap-3 w-full">
              <a 
                href={`https://wa.me/${botPhoneNumber}?text=${encodeURIComponent(rawWithdrawMsg)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-4 rounded-xl transition-all shadow-sm flex items-center justify-between text-[14px] group"
              >
                <span className="flex items-center gap-2"><FaMoneyBillWave className="text-green-400" /> Withdraw to Mobile Money</span>
                <span className="text-slate-400 group-hover:text-white transition-colors">&rarr;</span>
              </a>
              <a 
                href={`https://wa.me/${botPhoneNumber}?text=${encodeURIComponent(rawDiscountMsg)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold py-4 px-4 rounded-xl transition-all flex items-center justify-between text-[14px] group"
              >
                <span className="flex items-center gap-2"><FaShoppingCart className="text-[#D97706]" /> Use as Checkout Discount</span>
                <span className="text-amber-700/50 group-hover:text-amber-700 transition-colors">&rarr;</span>
              </a>
            </div>
          ) : (
            <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 w-full min-w-0">
              <FaInfoCircle className="text-slate-400 text-[18px] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] text-slate-600 font-medium leading-tight">
                  Your balance is currently <strong className="text-slate-900">{balance.toLocaleString()} UGX</strong>.
                </p>
                <p className="text-[12px] text-slate-500 mt-1">
                  The minimum payout threshold is <strong className="text-slate-900">3,000 UGX</strong>. Keep sharing your links to unlock withdrawals!
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
