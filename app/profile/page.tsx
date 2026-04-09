"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { collection, query, onSnapshot, doc, getDoc, where } from "firebase/firestore"; 
import { db } from "@/lib/firebase/config";

// --- IMPORT OUR NEW ISOLATED COMPONENTS ---
import ListingsTab from "@/components/dashboard/ListingsTab";
import OrdersTab from "@/components/dashboard/OrdersTab";
import PurchasesTab from "@/components/dashboard/PurchasesTab";
import WishlistTab from "@/components/dashboard/WishlistTab";

export default function UnifiedDashboard() {
  const { user, loading: authLoading, signIn, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<"listings" | "sales" | "purchases" | "saved">("listings");
  const [verificationStatus, setVerificationStatus] = useState<"unverified" | "pending" | "verified">("unverified");

  // Real-time Metrics State (Powers the top header and AI Alerts)
  const [metrics, setMetrics] = useState({ views: 0, chats: 0, avgScore: 0, totalItems: -1, isLoaded: false });

  // ==========================================
  // TOP-LEVEL DATA LISTENER (Profile & Metrics)
  // ==========================================
  useEffect(() => {
    if (!user?.id) return;

    // 1. Fetch Verification Status
    getDoc(doc(db, "users", user.id)).then(userDoc => {
      if (userDoc.exists() && userDoc.data().verificationStatus) {
        setVerificationStatus(userDoc.data().verificationStatus);
      }
    });

    // 2. Real-time Metrics Listener (Aggregates views/chats for the header)
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

      {/* 1. TOP SECTION (User Overview & Metrics) */}
      <div className="bg-white px-4 pt-6 pb-5 border-b border-slate-200">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 pr-4">
            <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 mb-1">
              Hello, {user.displayName?.split(" ")[0] || "Seller"}
              {verificationStatus === "verified" && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wide border bg-blue-50 text-blue-600 border-blue-200">✓ Verified</span>
              )}
            </h1>
            <p className="text-slate-500 text-xs leading-relaxed">
              Welcome to your dashboard. Manage your items, orders, and sales here.
            </p>
          </div>
          <button onClick={signOut} className="text-[10px] text-slate-500 font-bold hover:text-red-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 shrink-0 shadow-sm active:bg-slate-100">
            Log Out
          </button>
        </div>

        {/* Real-time Aggregate Stats (Only show if they have items) */}
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

            {/* 🔥 DYNAMIC AI ALERTS 🔥 */}
            <div className="mt-3">
              {metrics.avgScore < 50 && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex items-start gap-3">
                  <span className="relative flex h-3 w-3 mt-1 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  <p className="text-xs text-red-800 font-medium leading-relaxed">
                    <span className="font-bold block mb-0.5">Low Engagement Alert</span>
                    Your products aren't getting enough views, sales, or inquiries. Share your product links on WhatsApp to boost your AI score and rank highly on the homepage!
                  </p>
                </div>
              )}
              {metrics.avgScore >= 50 && metrics.avgScore < 80 && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-start gap-3">
                  <span className="text-amber-500 shrink-0 mt-0.5">📈</span>
                  <p className="text-xs text-amber-800 font-medium leading-relaxed">
                    <span className="font-bold block mb-0.5">You're Getting Noticed</span>
                    You have decent views, but need more chats or sales. Try sharing your links or lowering your prices slightly to turn views into sales and climb the ranks!
                  </p>
                </div>
              )}
              {metrics.avgScore >= 80 && metrics.avgScore < 100 && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-start gap-3">
                  <span className="text-blue-500 shrink-0 mt-0.5">⭐</span>
                  <p className="text-xs text-blue-800 font-medium leading-relaxed">
                    <span className="font-bold block mb-0.5">Great Performance</span>
                    Your items are popular! Keep sharing your links in groups to push your score over 100 and hit the Top Picks section on the homepage.
                  </p>
                </div>
              )}
              {metrics.avgScore >= 100 && (
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-start gap-3">
                  <span className="text-emerald-500 shrink-0 mt-0.5">🔥</span>
                  <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                    <span className="font-bold block mb-0.5">Top Seller Status</span>
                    Amazing! Your AI score is exceptional, and your items are dominating the Kabale Online homepage. Keep up the great work!
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
            <button onClick={() => setActiveTab("listings")} className={`flex-1 min-w-[100px] py-3 text-xs font-bold text-center border-b-2 transition-colors ${activeTab === "listings" ? "border-[#D97706] text-[#D97706]" : "border-transparent text-slate-500"}`}>My Ads</button>
            <button onClick={() => setActiveTab("sales")} className={`flex-1 min-w-[100px] py-3 text-xs font-bold text-center border-b-2 transition-colors ${activeTab === "sales" ? "border-[#D97706] text-[#D97706]" : "border-transparent text-slate-500"}`}>Orders</button>
          </>
        ) : (
          <button onClick={() => setActiveTab("listings")} className={`flex-1 min-w-[100px] py-3 text-xs font-bold text-center border-b-2 transition-colors ${activeTab === "listings" ? "border-[#D97706] text-[#D97706]" : "border-transparent text-slate-500"}`}>Start Selling</button>
        )}
        <button onClick={() => setActiveTab("purchases")} className={`flex-1 min-w-[100px] py-3 text-xs font-bold text-center border-b-2 transition-colors ${activeTab === "purchases" ? "border-[#D97706] text-[#D97706]" : "border-transparent text-slate-500"}`}>Purchases</button>
        <button onClick={() => setActiveTab("saved")} className={`flex-1 min-w-[100px] py-3 text-xs font-bold text-center border-b-2 transition-colors ${activeTab === "saved" ? "border-[#D97706] text-[#D97706]" : "border-transparent text-slate-500"}`}>Saved</button>
      </div>

      {/* 3. TAB CONTENT ROUTING */}
      <div className="p-4">
        {activeTab === "listings" && <ListingsTab userId={user.id} hasInventory={hasInventory} />}
        {activeTab === "sales" && hasInventory && <OrdersTab userId={user.id} />}
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
