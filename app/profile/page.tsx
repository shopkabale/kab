"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { collection, query, onSnapshot, doc, getDoc, where } from "firebase/firestore"; 
import { db } from "@/lib/firebase/config";
import { FaWhatsapp } from "react-icons/fa";
import { 
  PackageSearch, 
  ShoppingBag, 
  Heart, 
  LogOut, 
  Store, 
  TrendingUp, 
  MessageCircle,
  ChevronRight,
  ShieldCheck,
  Zap,
  Gift // 🚀 Added for the Invite link
} from "lucide-react";

export default function ProfilePage() {
  const { user, loading: authLoading, signIn, signOut } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<"unverified" | "pending" | "verified">("unverified");
  const [metrics, setMetrics] = useState({ views: 0, chats: 0, avgScore: 0, totalItems: -1, isLoaded: false });
  const [wallet, setWallet] = useState({ available: 0, pending: 0, withdrawn: 0, isLoaded: false });

  useEffect(() => {
    if (!user?.id) return;

    // 1. Fetch Verification Status
    getDoc(doc(db, "users", user.id)).then(userDoc => {
      if (userDoc.exists() && userDoc.data().verificationStatus) {
        setVerificationStatus(userDoc.data().verificationStatus);
      }
    });

    // 2. Fetch Real-time Metrics
    const metricsQuery = query(collection(db, "products"), where("sellerId", "==", user.id));
    const unsubscribeMetrics = onSnapshot(metricsQuery, (snapshot) => {
      let totalViews = 0, totalChats = 0, totalScore = 0, itemCount = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        totalViews += data.views || 0;
        totalChats += data.inquiries || 0;
        totalScore += data.aiScore || 0;
        itemCount++;
      });
      setMetrics({
        views: totalViews,
        chats: totalChats,
        avgScore: itemCount > 0 ? Math.round(totalScore / itemCount) : 0,
        totalItems: itemCount,
        isLoaded: true
      });
    });

    // 3. Fetch Real-time Wallet
    const walletRef = doc(db, "wallets", user.id);
    const unsubscribeWallet = onSnapshot(walletRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setWallet({
          available: Number(data.availableBalance) || 0,
          pending: Number(data.pendingBalance) || 0,
          withdrawn: Number(data.totalWithdrawn) || 0,
          isLoaded: true
        });
      } else {
        setWallet(prev => ({ ...prev, isLoaded: true }));
      }
    });

    return () => {
      unsubscribeMetrics();
      unsubscribeWallet();
    };
  }, [user?.id]);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center text-slate-400 font-bold animate-pulse">Loading workspace...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl text-center">
          <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-inner">🔒</div>
          <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Your Kabale ID</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">Log in to manage your premium purchases, saved items, and local sales pipeline.</p>
          <button onClick={signIn} className="w-full bg-[#D97706] text-white py-4 rounded-2xl font-black text-lg hover:bg-amber-600 active:scale-[0.98] transition-all shadow-[0_8px_30px_rgb(217,119,6,0.3)]">
            Log In Securely
          </button>
        </div>
      </div>
    );
  }

  const hasInventory = metrics.totalItems > 0;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-28 font-sans selection:bg-amber-100">

      {/* 👑 PREMIUM HEADER */}
      <div className="bg-white px-6 pt-12 pb-10 shadow-[0_4px_30px_rgb(0,0,0,0.03)] rounded-b-[40px] relative z-10">
        <div className="max-w-md mx-auto flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-tr from-[#D97706] to-amber-300 rounded-full flex items-center justify-center text-white text-3xl font-black shadow-[0_8px_20px_rgb(217,119,6,0.3)] border-4 border-white">
              {user.displayName?.charAt(0).toUpperCase() || "U"}
            </div>
            {verificationStatus === "verified" && (
              <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white w-7 h-7 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                <ShieldCheck size={14} strokeWidth={3} />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
              {user.displayName || "Kabale User"}
            </h1>
            <p className="text-slate-500 font-medium mt-1">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 mt-8 space-y-10">

        {/* 💰 ISOLATED WALLET & EARNINGS SECTION */}
        {hasInventory && (
          <section className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-slate-900 rounded-[32px] p-8 shadow-[0_20px_40px_rgb(0,0,0,0.1)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                Available Earnings
              </p>
              <h2 className="text-4xl font-black text-white tracking-tight mb-8">
                <span className="text-xl text-slate-500 font-bold mr-2">UGX</span>
                {wallet.available.toLocaleString()}
              </h2>

              <div className="grid grid-cols-2 gap-6 bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50 backdrop-blur-sm">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">In Escrow</p>
                  <p className="font-bold text-white text-lg tracking-tight">UGX {wallet.pending.toLocaleString()}</p>
                </div>
                <div className="pl-6 border-l border-slate-700/50">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Withdrawn</p>
                  <p className="font-bold text-white text-lg tracking-tight">UGX {wallet.withdrawn.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed px-2 font-medium">
              <strong className="text-slate-700">How earnings work:</strong> Funds from online payments stay in <strong className="text-slate-700">Escrow</strong> until the buyer receives the item. Once delivered, it moves to <strong className="text-slate-700">Available</strong> for withdrawal.
            </p>
          </section>
        )}

        {/* 📊 ISOLATED PERFORMANCE STATS SECTION */}
        {hasInventory && (
          <section className="space-y-3 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-[24px] p-5 shadow-[0_8px_20px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col items-center justify-center text-center transition-transform hover:-translate-y-1">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-3">
                  <TrendingUp size={18} strokeWidth={2.5} />
                </div>
                <span className="block text-2xl font-black text-slate-900 tracking-tight">{metrics.views}</span>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Views</span>
              </div>

              <div className="bg-white rounded-[24px] p-5 shadow-[0_8px_20px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col items-center justify-center text-center transition-transform hover:-translate-y-1">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-3">
                  <MessageCircle size={18} strokeWidth={2.5} />
                </div>
                <span className="block text-2xl font-black text-slate-900 tracking-tight">{metrics.chats}</span>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Inquiries</span>
              </div>

              <div className="bg-gradient-to-b from-amber-50 to-white rounded-[24px] p-5 shadow-[0_8px_20px_rgb(217,119,6,0.08)] border border-amber-100 flex flex-col items-center justify-center text-center transition-transform hover:-translate-y-1">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-[#D97706] flex items-center justify-center mb-3">
                  <Zap size={18} strokeWidth={2.5} fill="currentColor" />
                </div>
                <span className="block text-2xl font-black text-[#D97706] tracking-tight">{metrics.avgScore}</span>
                <span className="block text-[10px] text-amber-700/70 font-bold uppercase tracking-wider mt-1">AI Score</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed px-2 font-medium">
              <strong className="text-slate-700">Boost your AI Score:</strong> High scores mean your items appear at the top of search results. Increase it by sharing your product links directly to WhatsApp statuses and groups.
            </p>
          </section>
        )}

        {/* 🗂️ SPACED NAVIGATION LINKS */}
        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h3 className="px-2 text-sm font-black text-slate-900 tracking-wide uppercase">Workspace</h3>

          <div className="space-y-3">
            {/* 🚀 NEW: INVITE & EARN CARD */}
            <Link href="/invite" className="flex items-center justify-between p-5 bg-white rounded-[24px] shadow-[0_10px_30px_rgb(217,119,6,0.08)] border-2 border-amber-100 hover:shadow-[0_15px_35px_rgb(217,119,6,0.12)] active:scale-[0.98] transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#D97706] flex items-center justify-center group-hover:bg-[#D97706] group-hover:text-white transition-colors duration-300">
                  <Gift size={22} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Invite & Earn Cash</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Earn up to 3,000 UGX for every friend who buys.</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-[#D97706] group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link href="/profile/products" className="flex items-center justify-between p-5 bg-white rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] active:scale-[0.98] transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                  <Store size={22} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">My Products</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Edit ads & check inventory</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-300 group-hover:text-slate-900 transition-colors group-hover:translate-x-1" />
            </Link>

            <Link href="/profile/orders" className="flex items-center justify-between p-5 bg-white rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] active:scale-[0.98] transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                  <PackageSearch size={22} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Sales & Orders</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Manage deliveries & buyers</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-300 group-hover:text-slate-900 transition-colors group-hover:translate-x-1" />
            </Link>

            <Link href="/profile/purchases" className="flex items-center justify-between p-5 bg-white rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] active:scale-[0.98] transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                  <ShoppingBag size={22} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">My Purchases</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">View your buying history</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-300 group-hover:text-slate-900 transition-colors group-hover:translate-x-1" />
            </Link>

            <Link href="/profile/wishlist" className="flex items-center justify-between p-5 bg-white rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] active:scale-[0.98] transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center group-hover:bg-pink-600 group-hover:text-white transition-colors duration-300">
                  <Heart size={22} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Saved Items</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Your personal wishlist</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-300 group-hover:text-slate-900 transition-colors group-hover:translate-x-1" />
            </Link>
          </div>
        </section>

        {/* 📢 COMMUNITY & ACTIONS */}
        <section className="pt-4 space-y-4">
          <a 
            href="https://whatsapp.com/channel/0029Vb7mKqmKGGGKqH0bvq2D" 
            target="_blank" 
            rel="noreferrer"
            className="w-full bg-[#25D366] text-white p-5 rounded-[24px] font-black text-lg flex items-center justify-center gap-3 shadow-[0_8px_25px_rgb(37,211,102,0.3)] hover:bg-[#20bd5a] hover:-translate-y-1 active:scale-[0.98] active:translate-y-0 transition-all"
          >
            <FaWhatsapp className="text-2xl" />
            Join WhatsApp Channel
          </a>

          <button 
            onClick={signOut} 
            className="w-full bg-white border-2 border-slate-200 text-slate-600 p-5 rounded-[24px] font-bold flex items-center justify-center gap-2 hover:bg-slate-50 hover:text-red-600 hover:border-red-100 active:scale-[0.98] transition-all"
          >
            <LogOut size={20} />
            Secure Log Out
          </button>
        </section>

      </div>
    </div>
  );
}
