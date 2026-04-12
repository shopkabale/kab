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
  Wallet, 
  TrendingUp, 
  MessageCircle,
  ChevronRight
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

    // 2. Fetch Real-time Metrics (Products)
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

    // 3. Fetch Real-time Wallet Data
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

  if (authLoading) return <div className="py-20 text-center text-slate-500 font-bold animate-pulse">Loading dashboard...</div>;

  if (!user) {
    return (
      <div className="py-20 text-center px-4 max-w-sm mx-auto">
        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">🔒</div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Welcome to Kabale Online</h2>
        <p className="text-slate-600 mb-8 text-sm">Log in to manage your purchases, saved items, and local sales.</p>
        <button onClick={signIn} className="w-full bg-[#D97706] text-white py-3 rounded-xl font-bold hover:bg-amber-600 active:scale-95 transition-all shadow-sm">
          Log In or Create Account
        </button>
      </div>
    );
  }

  const hasInventory = metrics.totalItems > 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans">
      <div className="max-w-md mx-auto">
        
        {/* HEADER SECTION */}
        <div className="bg-white px-4 pt-8 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-tr from-[#D97706] to-amber-400 rounded-full flex items-center justify-center text-white text-2xl font-black shadow-md border-2 border-white">
              {user.displayName?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                {user.displayName || "Kabale User"}
                {verificationStatus === "verified" && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wide border bg-blue-50 text-blue-600 border-blue-200">✓ Verified</span>
                )}
              </h1>
              <p className="text-slate-500 text-sm">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-5">
          {/* 📊 SELLER METRICS & WALLET WIDGET */}
          {hasInventory && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-slate-900 flex items-center gap-2">
                  <Wallet size={18} className="text-[#D97706]" /> 
                  Wallet & Stats
                </h2>
                <span className="text-xs font-bold text-slate-400 uppercase">Seller Hub</span>
              </div>
              
              <div className="p-4 bg-slate-900 text-white">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Available to Withdraw</p>
                <h2 className="text-3xl font-black mb-3">
                  <span className="text-lg text-slate-400 mr-1">UGX</span>
                  {wallet.available.toLocaleString()}
                </h2>
                <div className="flex gap-4 border-t border-slate-700 pt-3">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Pending Escrow</p>
                    <p className="font-bold text-sm">UGX {wallet.pending.toLocaleString()}</p>
                  </div>
                  <div className="pl-4 border-l border-slate-700">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Total Withdrawn</p>
                    <p className="font-bold text-sm">UGX {wallet.withdrawn.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 divide-x divide-slate-100 bg-white">
                <div className="p-3 text-center">
                  <TrendingUp size={16} className="mx-auto text-slate-400 mb-1" />
                  <span className="block text-lg font-black text-slate-700">{metrics.views}</span>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Views</span>
                </div>
                <div className="p-3 text-center">
                  <MessageCircle size={16} className="mx-auto text-slate-400 mb-1" />
                  <span className="block text-lg font-black text-slate-700">{metrics.chats}</span>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Chats</span>
                </div>
                <div className="p-3 text-center">
                  <span className="block text-lg font-black text-[#D97706] mt-1">{metrics.avgScore}</span>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">AI Score</span>
                </div>
              </div>
            </div>
          )}

          {/* 🗂️ NAVIGATION MENU */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex flex-col divide-y divide-slate-100">
              
              <Link href="/profile/products" className="flex items-center justify-between p-4 hover:bg-slate-50 active:bg-slate-100 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform"><Store size={20} /></div>
                  <div>
                    <h3 className="font-bold text-slate-900">My Products</h3>
                    <p className="text-xs text-slate-500">Manage your active ads</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-300" />
              </Link>

              <Link href="/profile/orders" className="flex items-center justify-between p-4 hover:bg-slate-50 active:bg-slate-100 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform"><PackageSearch size={20} /></div>
                  <div>
                    <h3 className="font-bold text-slate-900">Sales & Orders</h3>
                    <p className="text-xs text-slate-500">Track items you are selling</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-300" />
              </Link>

              <Link href="/profile/purchases" className="flex items-center justify-between p-4 hover:bg-slate-50 active:bg-slate-100 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform"><ShoppingBag size={20} /></div>
                  <div>
                    <h3 className="font-bold text-slate-900">My Purchases</h3>
                    <p className="text-xs text-slate-500">View your buying history</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-300" />
              </Link>

              <Link href="/profile/wishlist" className="flex items-center justify-between p-4 hover:bg-slate-50 active:bg-slate-100 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center group-hover:scale-110 transition-transform"><Heart size={20} /></div>
                  <div>
                    <h3 className="font-bold text-slate-900">Saved Items</h3>
                    <p className="text-xs text-slate-500">Your wishlist</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-300" />
              </Link>

            </div>
          </div>

          {/* 📢 COMMUNITY & ACTIONS */}
          <div className="flex flex-col gap-3">
            <a 
              href="https://whatsapp.com/channel/0029Vb7mKqmKGGGKqH0bvq2D" 
              target="_blank" 
              rel="noreferrer"
              className="w-full bg-[#25D366] text-white p-4 rounded-xl font-bold flex items-center justify-center gap-3 shadow-md hover:bg-[#20bd5a] active:scale-[0.98] transition-all"
            >
              <FaWhatsapp className="text-2xl" />
              Join Our WhatsApp Channel
            </a>

            <button 
              onClick={signOut} 
              className="w-full bg-white border border-slate-200 text-slate-700 p-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 active:bg-slate-100 transition-colors"
            >
              <LogOut size={18} className="text-slate-400" />
              Log Out
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
