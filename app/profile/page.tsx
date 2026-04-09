"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { collection, query, onSnapshot, doc, getDoc, where } from "firebase/firestore"; 
import { db } from "@/lib/firebase/config";
import { FaChartLine, FaWallet, FaBoxOpen, FaLock, FaUserTag } from "react-icons/fa";

// --- IMPORT OUR NEW ISOLATED COMPONENTS ---
import ListingsTab from "@/components/dashboard/ListingsTab";
import OrdersTab from "@/components/dashboard/OrdersTab";
import PurchasesTab from "@/components/dashboard/PurchasesTab";
import WishlistTab from "@/components/dashboard/WishlistTab";
import WalletTab from "@/components/dashboard/WalletTab"; // 🔥 Added Wallet Tab

export default function UnifiedDashboard() {
  const { user, loading: authLoading, signIn, signOut } = useAuth();

  // 🔥 Added "wallet" to the state types
  const [activeTab, setActiveTab] = useState<"listings" | "sales" | "purchases" | "saved" | "wallet">("listings");
  const [verificationStatus, setVerificationStatus] = useState<"unverified" | "pending" | "verified">("unverified");

  const [metrics, setMetrics] = useState({ views: 0, chats: 0, avgScore: 0, totalItems: -1, isLoaded: false });

  // ==========================================
  // TOP-LEVEL DATA LISTENER (Profile & Metrics)
  // ==========================================
  useEffect(() => {
    if (!user?.id) return;

    getDoc(doc(db, "users", user.id)).then(userDoc => {
      if (userDoc.exists() && userDoc.data().verificationStatus) {
        setVerificationStatus(userDoc.data().verificationStatus);
      }
    });

    const metricsQuery = query(collection(db, "products"), where("sellerId", "==", user.id));
    const unsubscribeMetrics = onSnapshot(metricsQuery, (snapshot) => {
      let totalViews = 0;
      let totalChats = 0;
      let totalScore = 0;
      let itemCount = 0;

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

    return () => unsubscribeMetrics(); 
  }, [user?.id]); 

  // ==========================================
  // RENDER UN-AUTHENTICATED STATE
  // ==========================================
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

  // ==========================================
  // RENDER MAIN DASHBOARD
  // ==========================================
  return (
    <div className="pb-24 max-w-md mx-auto bg-slate-50 min-h-screen sm:border-x sm:border-slate-200 shadow-sm relative">

      {/* 1. TOP SECTION (User Overview) */}
      <div className="bg-white px-4 pt-6 pb-5 border-b border-slate-200">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 pr-4">
            <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 mb-1">
              Hello, {user.displayName?.split(" ")[0] || "User"}
              {verificationStatus === "verified" && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wide border bg-blue-50 text-blue-600 border-blue-200">✓ Verified</span>
              )}
            </h1>
            <p className="text-slate-500 text-xs leading-relaxed">
              {hasInventory 
                ? "Welcome to your Seller Dashboard. Manage your items, orders, and wallet."
                : "Welcome to your Buyer Account. Manage your purchases and saved items."
              }
            </p>
          </div>
          <button onClick={signOut} className="text-[10px] text-slate-500 font-bold hover:text-red-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 shrink-0 shadow-sm active:bg-slate-100">
            Log Out
          </button>
        </div>

        {/* Real-time Aggregate Stats (SELLER ONLY) */}
        {hasInventory && metrics.isLoaded && (
          <>
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 text-center">
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Total Views</span>
                <span className="block text-lg font-black text-slate-700">{metrics.views}</span>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 text-center">
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Total Chats</span>
                <span className="block text-lg font-black text-slate-700">{metrics.chats}</span>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 text-center">
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Avg Score</span>
                <span className="block text-lg font-black text-[#D97706]">{metrics.avgScore}</span>
              </div>
            </div>

            {/* DYNAMIC AI ALERTS */}
            <div className="mt-3">
              {metrics.avgScore < 50 && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex items-start gap-3">
                  <span className="relative flex h-3 w-3 mt-1 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  <p className="text-xs text-red-800 font-medium leading-relaxed">
                    <span className="font-bold block mb-0.5">Low Engagement Alert</span>
                    Share your product links on WhatsApp to boost your AI score and rank highly!
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* 2. TABS NAVIGATION */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 flex overflow-x-auto no-scrollbar">
        {hasInventory || !metrics.isLoaded ? (
          <>
            <button onClick={() => setActiveTab("listings")} className={`flex-1 min-w-[90px] py-3 text-xs font-bold text-center border-b-2 transition-colors ${activeTab === "listings" ? "border-[#D97706] text-[#D97706]" : "border-transparent text-slate-500"}`}>Ads</button>
            <button onClick={() => setActiveTab("sales")} className={`flex-1 min-w-[90px] py-3 text-xs font-bold text-center border-b-2 transition-colors ${activeTab === "sales" ? "border-[#D97706] text-[#D97706]" : "border-transparent text-slate-500"}`}>Orders</button>
            <button onClick={() => setActiveTab("wallet")} className={`flex-1 min-w-[90px] py-3 text-xs font-bold text-center border-b-2 transition-colors ${activeTab === "wallet" ? "border-[#D97706] text-[#D97706]" : "border-transparent text-slate-500"}`}>Wallet</button>
          </>
        ) : (
          <button onClick={() => setActiveTab("listings")} className={`flex-1 min-w-[140px] py-3 text-xs font-bold text-center border-b-2 transition-colors ${activeTab === "listings" ? "border-[#D97706] text-[#D97706]" : "border-transparent text-slate-500"}`}>
            <FaLock className="inline mb-0.5 mr-1 text-[10px]" /> Seller Tools
          </button>
        )}
        <button onClick={() => setActiveTab("purchases")} className={`flex-1 min-w-[90px] py-3 text-xs font-bold text-center border-b-2 transition-colors ${activeTab === "purchases" ? "border-[#D97706] text-[#D97706]" : "border-transparent text-slate-500"}`}>Purchases</button>
        <button onClick={() => setActiveTab("saved")} className={`flex-1 min-w-[90px] py-3 text-xs font-bold text-center border-b-2 transition-colors ${activeTab === "saved" ? "border-[#D97706] text-[#D97706]" : "border-transparent text-slate-500"}`}>Saved</button>
      </div>

      {/* 3. TAB CONTENT ROUTING */}
      <div className="p-4">
        
        {/* BUYER-ONLY PROMO OVERLAY */}
        {activeTab === "listings" && !hasInventory && metrics.isLoaded && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mt-2 animate-in fade-in zoom-in-95 duration-500">
             <div className="flex justify-center mb-4">
               <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 text-2xl">
                 <FaUserTag />
               </div>
             </div>
             <div className="text-center mb-6">
               <span className="inline-block bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full mb-3">Buyer Account</span>
               <h2 className="text-xl font-black text-slate-900 mb-2 leading-tight">Unlock your Seller Dashboard</h2>
               <p className="text-slate-500 text-sm leading-relaxed">
                 You are currently viewing a standard buyer account. Upload your first product to instantly unlock premium seller features:
               </p>
             </div>

             <ul className="space-y-4 mb-8">
               <li className="flex items-center gap-3 text-sm font-bold text-slate-700">
                 <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center"><FaChartLine /></div>
                 Real-time AI Analytics
               </li>
               <li className="flex items-center gap-3 text-sm font-bold text-slate-700">
                 <div className="w-8 h-8 rounded-lg bg-green-50 text-green-500 flex items-center justify-center"><FaBoxOpen /></div>
                 Order Management System
               </li>
               <li className="flex items-center gap-3 text-sm font-bold text-slate-700">
                 <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center"><FaWallet /></div>
                 Digital Escrow Wallet
               </li>
             </ul>

             <Link href="/sell" className="w-full flex items-center justify-center py-4 bg-[#D97706] text-white font-black text-md rounded-xl shadow-md hover:bg-amber-600 active:scale-95 transition-all">
               Post a Product to Unlock
             </Link>
          </div>
        )}

        {/* ACTUAL TABS */}
        {activeTab === "listings" && hasInventory && <ListingsTab userId={user.id} hasInventory={hasInventory} />}
        {activeTab === "sales" && hasInventory && <OrdersTab userId={user.id} />}
        {activeTab === "wallet" && hasInventory && <WalletTab userId={user.id} />}
        {activeTab === "purchases" && <PurchasesTab userId={user.id} />}
        {activeTab === "saved" && <WishlistTab userId={user.id} />}
      </div>

      {/* FLOATING ACTION BUTTON */}
      <Link 
        href="/sell" 
        className="fixed bottom-6 right-6 absolute sm:bottom-10 sm:-right-6 bg-[#D97706] text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-3xl pb-1 hover:bg-amber-600 active:scale-95 transition-transform z-50 border-2 border-white"
      >
        +
      </Link>

    </div>
  );
}
