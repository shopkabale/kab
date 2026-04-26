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
  ShieldCheck,
  Zap,
  Gift,
  Wallet,
  ArrowRight
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

  if (authLoading) {
    return (
      <div className="min-h-[70vh] w-full flex flex-col items-center justify-center bg-slate-50 px-4">
        <div className="relative flex items-center justify-center mb-5">
          <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-[#D97706]"></div>
        </div>
        <h2 className="text-slate-900 font-black text-lg md:text-xl mb-1">Loading Workspace...</h2>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full min-h-screen bg-slate-50 overflow-x-hidden">
        <div className="max-w-[480px] md:max-w-2xl mx-auto p-4 pt-8 md:pt-12 flex flex-col w-full">
          <div className="text-center mb-8 w-full">
            <span className="text-[#D97706] font-black tracking-widest uppercase text-[11px] mb-2 block">Kabale ID</span>
            <h1 className="text-3xl font-black text-slate-900 mb-3 leading-tight">Your Personal<br/>Workspace.</h1>
            <p className="text-slate-500 text-[15px] px-2 w-full font-medium">Log in to manage your purchases, saved items, and local sales pipeline.</p>
          </div>

          <button onClick={signIn} className="w-full bg-[#D97706] hover:bg-amber-600 text-white font-bold py-4 rounded-xl shadow-md transition-all text-[16px] flex items-center justify-center">
            Log In Securely
          </button>
        </div>
      </div>
    );
  }

  const hasInventory = metrics.totalItems > 0;

  return (
    <div className="w-full min-h-screen bg-slate-50 overflow-x-hidden pb-10">
      <div className="max-w-[480px] md:max-w-2xl mx-auto p-4 pt-6 w-full flex flex-col">

        {/* HEADER */}
        <div className="mb-6 border-b border-slate-200 pb-4 flex items-center gap-4 w-full">
          <div className="w-14 h-14 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 text-xl font-black relative flex-shrink-0">
            {user.displayName?.charAt(0).toUpperCase() || "U"}
            {verificationStatus === "verified" && (
              <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white w-5 h-5 rounded-full border-2 border-slate-50 flex items-center justify-center">
                <ShieldCheck size={10} strokeWidth={3} />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-slate-900 truncate w-full">{user.displayName || "Kabale User"}</h1>
            <p className="text-slate-500 font-medium text-[13px] truncate w-full">{user.email}</p>
          </div>
        </div>

        {/* SELLER WALLET & STATS */}
        {hasInventory && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-3 w-full">
              <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm w-full flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1 w-full min-w-0">
                  <Wallet size={14} className="flex-shrink-0" />
                  <p className="text-[10px] font-black uppercase tracking-wider truncate w-full text-slate-500">Available</p>
                </div>
                <p className="text-xl md:text-2xl font-black text-[#D97706] truncate w-full">
                  {wallet.available.toLocaleString()} <span className="text-[12px] text-amber-700">UGX</span>
                </p>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm w-full flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1 w-full min-w-0">
                  <ShieldCheck size={14} className="flex-shrink-0" />
                  <p className="text-[10px] font-black uppercase tracking-wider truncate w-full text-slate-500">In Escrow</p>
                </div>
                <p className="text-xl md:text-2xl font-black text-slate-900 truncate w-full">
                  {wallet.pending.toLocaleString()} <span className="text-[12px] text-slate-500">UGX</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6 w-full">
              <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm flex flex-col items-center justify-center text-center">
                <TrendingUp size={16} className="text-slate-400 mb-1" />
                <span className="block text-lg font-black text-slate-900">{metrics.views}</span>
                <span className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Views</span>
              </div>
              <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm flex flex-col items-center justify-center text-center">
                <MessageCircle size={16} className="text-slate-400 mb-1" />
                <span className="block text-lg font-black text-slate-900">{metrics.chats}</span>
                <span className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Chats</span>
              </div>
              <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm flex flex-col items-center justify-center text-center">
                <Zap size={16} className="text-amber-500 mb-1" />
                <span className="block text-lg font-black text-[#D97706]">{metrics.avgScore}</span>
                <span className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">AI Score</span>
              </div>
            </div>
          </>
        )}

        {/* WORKSPACE NAVIGATION */}
        <h2 className="font-black text-slate-900 mb-3 text-[14px]">Your Workspace</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          
          <Link href="/invite" className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:border-[#D97706] transition-colors flex items-center justify-between group md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-[#D97706]"><Gift size={18} /></div>
              <div><h3 className="font-black text-slate-900 text-[14px]">Invite & Earn Cash</h3><p className="text-[11px] text-slate-500 font-medium">Earn up to 3,000 UGX per referral.</p></div>
            </div>
            <ArrowRight size={16} className="text-slate-300 group-hover:text-[#D97706] transition-colors" />
          </Link>

          <Link href="/profile/products" className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:border-[#D97706] transition-colors flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600"><Store size={18} /></div>
              <div><h3 className="font-black text-slate-900 text-[14px]">My Products</h3><p className="text-[11px] text-slate-500 font-medium">Edit ads & inventory</p></div>
            </div>
            <ArrowRight size={16} className="text-slate-300 group-hover:text-[#D97706] transition-colors" />
          </Link>

          <Link href="/profile/orders" className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:border-[#D97706] transition-colors flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600"><PackageSearch size={18} /></div>
              <div><h3 className="font-black text-slate-900 text-[14px]">Sales & Orders</h3><p className="text-[11px] text-slate-500 font-medium">Manage deliveries</p></div>
            </div>
            <ArrowRight size={16} className="text-slate-300 group-hover:text-[#D97706] transition-colors" />
          </Link>

          <Link href="/profile/purchases" className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:border-[#D97706] transition-colors flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600"><ShoppingBag size={18} /></div>
              <div><h3 className="font-black text-slate-900 text-[14px]">My Purchases</h3><p className="text-[11px] text-slate-500 font-medium">View buying history</p></div>
            </div>
            <ArrowRight size={16} className="text-slate-300 group-hover:text-[#D97706] transition-colors" />
          </Link>

          <Link href="/profile/wishlist" className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:border-[#D97706] transition-colors flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600"><Heart size={18} /></div>
              <div><h3 className="font-black text-slate-900 text-[14px]">Saved Items</h3><p className="text-[11px] text-slate-500 font-medium">Your personal wishlist</p></div>
            </div>
            <ArrowRight size={16} className="text-slate-300 group-hover:text-[#D97706] transition-colors" />
          </Link>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col gap-3 w-full">
          <a 
            href="https://whatsapp.com/channel/0029Vb7mKqmKGGGKqH0bvq2D" 
            target="_blank" 
            rel="noreferrer"
            className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3.5 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 text-[14px]"
          >
            <FaWhatsapp className="text-[18px]" /> Join WhatsApp Channel
          </a>

          <button 
            onClick={signOut} 
            className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-3.5 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors flex items-center justify-center gap-2 text-[14px]"
          >
            <LogOut size={16} /> Secure Log Out
          </button>
        </div>

      </div>
    </div>
  );
}
