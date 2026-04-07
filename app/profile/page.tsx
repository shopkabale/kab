"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc, getDoc, getDocs, limit, where, startAfter } from "firebase/firestore"; 
import { db } from "@/lib/firebase/config";
import { Order } from "@/types";

// --- CUSTOM MODAL TYPES ---
type ModalState = {
  isOpen: boolean;
  type: "delete_confirm" | "none";
  product?: any;
};

export default function UnifiedDashboard() {
  const { user, loading: authLoading, signIn, signOut } = useAuth();
  const router = useRouter(); 

  const [activeTab, setActiveTab] = useState<"listings" | "sales" | "purchases" | "saved">("listings");
  const ITEMS_PER_PAGE = 5;

  const [listings, setListings] = useState<any[]>([]); 
  const [loadingListings, setLoadingListings] = useState(false);
  const [hasMoreListings, setHasMoreListings] = useState(true);

  const [sales, setSales] = useState<Order[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [hasMoreSales, setHasMoreSales] = useState(true);

  const [purchases, setPurchases] = useState<Order[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [hasMorePurchases, setHasMorePurchases] = useState(true);

  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);

  const [verificationStatus, setVerificationStatus] = useState<"unverified" | "pending" | "verified">("unverified");
  const [isVerifying, setIsVerifying] = useState(false);

  // Real-time Metrics State
  const [metrics, setMetrics] = useState({ views: 0, chats: 0, avgScore: 0, totalItems: -1, isLoaded: false });

  // Link Copy State
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Custom Modal State
  const [modal, setModal] = useState<ModalState>({ isOpen: false, type: "none" });

  // --- CACHE LOGIC ---
  const saveToCache = useCallback((type: 'listings' | 'sales' | 'purchases', data: any[]) => {
    if (!user) return;
    const cacheKey = `kabale_${type}_${user.id}`;
    localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: data }));
  }, [user]);

  const loadFromCache = useCallback((type: 'listings' | 'sales' | 'purchases') => {
    if (!user) return null;
    const cacheKey = `kabale_${type}_${user.id}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < 86400000) return parsed.data; 
    }
    return null;
  }, [user]);

  // --- FETCHING LOGIC ---
  const fetchListings = useCallback(async (isLoadMore = false, forceRefresh = false) => {
    if (!user || (isLoadMore && !hasMoreListings)) return;
    if (!isLoadMore && !forceRefresh) {
      const cachedData = loadFromCache('listings');
      if (cachedData && cachedData.length > 0) {
        setListings(cachedData);
        setHasMoreListings(cachedData.length >= ITEMS_PER_PAGE);
        return;
      }
    }
    setLoadingListings(true);
    try {
      let q = query(collection(db, "products"), where("sellerId", "==", user.id), orderBy("createdAt", "desc"), limit(ITEMS_PER_PAGE));
      if (isLoadMore && listings.length > 0) q = query(q, startAfter(listings[listings.length - 1].createdAt));
      const snapshot = await getDocs(q);
      const newDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setHasMoreListings(snapshot.docs.length === ITEMS_PER_PAGE);
      const updatedData = isLoadMore ? [...listings, ...newDocs] : newDocs;
      setListings(updatedData);
      saveToCache('listings', updatedData);
    } catch (error) { console.error("Error fetching listings", error); }
    setLoadingListings(false);
  }, [user, hasMoreListings, listings, loadFromCache, saveToCache]);

  const fetchSales = useCallback(async (isLoadMore = false, forceRefresh = false) => {
    if (!user || (isLoadMore && !hasMoreSales)) return;
    if (!isLoadMore && !forceRefresh) {
      const cachedData = loadFromCache('sales');
      if (cachedData && cachedData.length > 0) {
        setSales(cachedData);
        setHasMoreSales(cachedData.length >= ITEMS_PER_PAGE);
        return;
      }
    }
    setLoadingSales(true);
    try {
      let q = query(collection(db, "orders"), where("sellerId", "==", user.id), orderBy("createdAt", "desc"), limit(ITEMS_PER_PAGE));
      if (isLoadMore && sales.length > 0) q = query(q, startAfter(sales[sales.length - 1].createdAt));
      const snapshot = await getDocs(q);
      const newDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Order[];
      setHasMoreSales(snapshot.docs.length === ITEMS_PER_PAGE);
      const updatedData = isLoadMore ? [...sales, ...newDocs] : newDocs;
      setSales(updatedData);
      saveToCache('sales', updatedData);
    } catch (error) { console.error("Error fetching sales", error); }
    setLoadingSales(false);
  }, [user, hasMoreSales, sales, loadFromCache, saveToCache]);

  const fetchPurchases = useCallback(async (isLoadMore = false, forceRefresh = false) => {
    if (!user || (isLoadMore && !hasMorePurchases)) return;
    if (!isLoadMore && !forceRefresh) {
      const cachedData = loadFromCache('purchases');
      if (cachedData && cachedData.length > 0) {
        setPurchases(cachedData);
        setHasMorePurchases(cachedData.length >= ITEMS_PER_PAGE);
        return;
      }
    }
    setLoadingPurchases(true);
    try {
      let q = query(collection(db, "orders"), where("userId", "==", user.id), orderBy("createdAt", "desc"), limit(ITEMS_PER_PAGE));
      if (isLoadMore && purchases.length > 0) q = query(q, startAfter(purchases[purchases.length - 1].createdAt));
      const snapshot = await getDocs(q);
      const newDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Order[];
      setHasMorePurchases(snapshot.docs.length === ITEMS_PER_PAGE);
      const updatedData = isLoadMore ? [...purchases, ...newDocs] : newDocs;
      setPurchases(updatedData);
      saveToCache('purchases', updatedData);
    } catch (error) { console.error("Error fetching purchases", error); }
    setLoadingPurchases(false);
  }, [user, hasMorePurchases, purchases, loadFromCache, saveToCache]);

  // ==========================================
  // EFFECT 1: STANDARD DATA & URL FETCHING
  // ==========================================
  useEffect(() => {
    if (!user || authLoading) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const shouldForceRefresh = urlParams.get('refresh') === 'true';

    getDoc(doc(db, "users", user.id)).then(userDoc => {
      if (userDoc.exists() && userDoc.data().verificationStatus) setVerificationStatus(userDoc.data().verificationStatus);
    });

    if (listings.length === 0 || shouldForceRefresh) fetchListings(false, shouldForceRefresh);
    if (sales.length === 0 || shouldForceRefresh) fetchSales(false, shouldForceRefresh);
    if (purchases.length === 0 || shouldForceRefresh) fetchPurchases(false, shouldForceRefresh);

    if (shouldForceRefresh) window.history.replaceState({}, document.title, window.location.pathname);
    
  }, [user?.id, authLoading, fetchListings, fetchSales, fetchPurchases, listings.length, purchases.length, sales.length]);


  // ==========================================
  // EFFECT 2: REAL-TIME LISTENERS (ISOLATED TO PREVENT LOOP)
  // ==========================================
  useEffect(() => {
    if (!user?.id) return;

    // 1. Wishlist Listener
    const wishlistRef = collection(db, "users", user.id, "wishlist");
    const unsubscribeWishlist = onSnapshot(query(wishlistRef, orderBy("savedAt", "desc"), limit(10)), (snapshot) => {
      setSavedItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingSaved(false);
    });

    // 2. Metrics Listener
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

    // Clean up when component unmounts or user changes
    return () => {
      unsubscribeWishlist();
      unsubscribeMetrics(); 
    };
  }, [user?.id]); 

  // --- STANDARD ACTIONS ---
  const handleRemoveSaved = async (productId: string) => {
    if (!user) return;
    try { await deleteDoc(doc(db, "users", user.id, "wishlist", productId)); } catch (error) { console.error("Failed to remove saved item", error); }
  };

  const handleToggleSold = async (product: any) => {
    if (!user) return;
    const newStatus = product.status === "sold" ? "active" : "sold";
    try {
      await updateDoc(doc(db, "products", product.id), { status: newStatus });
      const updatedListings = listings.map(item => item.id === product.id ? { ...item, status: newStatus } : item);
      setListings(updatedListings);
      saveToCache('listings', updatedListings); 
      
      // 🔥 BREAK CACHE WHEN ITEM STATUS CHANGES 🔥
      await fetch('/api/revalidate');
      
    } catch (error) { console.error("Failed to update status", error); }
  };

  const handleSaleStatusChange = async (orderId: string, newStatus: string) => {
    if (!user) return;
    try {
      const res = await fetch("/api/orders/seller", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId: user.id, orderId, newStatus })
      });
      if (res.ok) {
        const updatedSales = sales.map(order => order.id === orderId ? { ...order, status: newStatus as any } : order);
        setSales(updatedSales);
        saveToCache('sales', updatedSales);
      }
    } catch (error) { console.error("Failed to update sale status", error); }
  };

  const handleVerifyProfile = async () => {
    if (!user) return;
    setIsVerifying(true);
    try {
      await updateDoc(doc(db, "users", user.id), {
        verificationStatus: "pending",
        verificationRequestedAt: Date.now()
      });
      setVerificationStatus("pending");
    } catch (error) {
      console.error(error);
    } finally { setIsVerifying(false); }
  };

  const confirmDelete = async () => {
    if (!modal.product) return;
    try {
      await deleteDoc(doc(db, "products", modal.product.id));
      const updatedListings = listings.filter(item => item.id !== modal.product?.id);
      setListings(updatedListings);
      saveToCache('listings', updatedListings); 
      closeModal();
      
      // 🔥 BREAK CACHE WHEN ITEM IS DELETED 🔥
      await fetch('/api/revalidate');
      
    } catch (error) { console.error(error); }
  };

  const handleCopyProductLink = (publicId: string, id: string) => {
    const url = `${window.location.origin}/product/${publicId || id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const closeModal = () => {
    setModal({ isOpen: false, type: "none" });
  };

  // --- RENDER ---
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
    <div className="pb-24 max-w-md mx-auto bg-slate-50 min-h-screen sm:border-x sm:border-slate-200 shadow-sm relative">

      {/* --- CUSTOM MODAL OVERLAY --- */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">

            {/* DELETE CONFIRM MODAL */}
            {modal.type === "delete_confirm" && (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">🗑️</div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Delete this Ad?</h3>
                <p className="text-slate-600 text-sm mb-6">This action cannot be undone. Are you sure you want to remove this item permanently?</p>
                <div className="flex gap-3">
                  <button onClick={closeModal} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl active:bg-slate-200 transition-colors">Cancel</button>
                  <button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl active:bg-red-700 transition-colors shadow-sm">Yes, Delete</button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

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
              Welcome to your dashboard, manage your items, orders, sales, delete, edit, mark as sold here.
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

      {/* 2. MAIN CONTENT AREA (Tabbed Interface) */}
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

      <div className="p-4">
        {/* === TAB 1: MY LISTINGS / START SELLING === */}
        {activeTab === "listings" && (
          <div className="space-y-4">
             {loadingListings && listings.length === 0 ? (
               <div className="text-center py-10 text-slate-400 text-sm">Loading data...</div>
             ) : !hasInventory && metrics.isLoaded ? (
               <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-sm mt-4 animate-in fade-in zoom-in-95 duration-500">
                  <div className="w-20 h-20 bg-[#D97706]/10 text-[#D97706] rounded-full flex items-center justify-center text-4xl mx-auto mb-4">💸</div>
                  <h2 className="text-2xl font-black text-slate-900 mb-2 leading-tight">Turn your items into cash instantly</h2>
                  <p className="text-slate-600 text-sm mb-8 leading-relaxed">
                    Join hundreds of successful sellers in Kabale. Post your unused items, reach thousands of local buyers daily, and keep 100% of your profits.
                  </p>
                  <Link href="/sell" className="w-full block py-4 bg-[#D97706] text-white font-black text-lg rounded-xl shadow-md hover:bg-amber-600 active:scale-95 transition-all">
                    Post Your First Item Free
                  </Link>
               </div>
             ) : (
               <>
                 <div className="flex justify-between items-center px-1 mb-2">
                   <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Inventory</h2>
                   <button onClick={() => fetchListings(false, true)} className="text-[10px] font-bold text-[#D97706]">↻ Refresh</button>
                 </div>
                 {listings.map((item) => {
                   const isSold = item.status === "sold";
                   const now = Date.now();

                   // Read AI Engine badging
                   const isBoostedActive = item.isBoosted && item.boostExpiresAt > now;
                   const isFeaturedActive = item.isFeatured && item.featureExpiresAt > now;

                   // Performance Stats
                   const views = item.views || 0;
                   const inquiries = item.inquiries || 0;
                   const aiScore = item.aiScore || 0;

                   return (
                     <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex flex-col gap-3">
                       {/* Polished Product Card Header */}
                       <div className="flex gap-3">
                         <div className="w-20 h-20 bg-slate-50 rounded-lg flex-shrink-0 relative overflow-hidden border border-slate-100">
                           {item.images?.[0] ? (
                             <Image src={item.images[0]} alt={item.name} fill className="object-cover" sizes="80px" />
                           ) : <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-300 uppercase">No Img</span>}
                           {isFeaturedActive && <span className="absolute bottom-0 w-full bg-blue-600 text-white text-[8px] font-black text-center py-0.5 uppercase tracking-widest">Top Pick</span>}
                         </div>
                         <div className="flex-1 flex flex-col py-1 justify-between">
                           <div>
                             <h3 className="text-sm font-bold text-slate-900 leading-tight line-clamp-2">{item.name}</h3>
                             <p className="text-sm font-black text-[#D97706] mt-1">UGX {(Number(item.price) || 0).toLocaleString()}</p>
                           </div>
                           <div className="flex items-center gap-1.5 mt-1">
                             <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${isSold ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-600 border border-emerald-100"}`}>
                               {isSold ? "Sold Out" : "Active"}
                             </span>
                             {isBoostedActive && <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide bg-amber-50 text-amber-600 border border-amber-100">🚀 Trending</span>}
                           </div>
                         </div>
                       </div>

                       {/* AI Analytics Dashboard */}
                       <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 flex justify-between items-center">
                          <div className="flex gap-4">
                            <div className="text-center">
                              <span className="block text-[10px] text-slate-400 font-bold uppercase">Views</span>
                              <span className="block text-sm font-black text-slate-700">{views}</span>
                            </div>
                            <div className="text-center">
                              <span className="block text-[10px] text-slate-400 font-bold uppercase">Chats</span>
                              <span className="block text-sm font-black text-slate-700">{inquiries}</span>
                            </div>
                          </div>
                          <div className="text-right border-l border-slate-200 pl-4">
                              <span className="block text-[10px] text-slate-400 font-bold uppercase">AI Rank</span>
                              <span className="block text-sm font-black text-[#D97706]">{aiScore}</span>
                          </div>
                       </div>

                       {/* Action Controls */}
                       <div className="grid grid-cols-3 gap-2 pt-1">
                         <Link href={`/edit/${item.publicId || item.id}`} className="text-[11px] font-bold text-center py-2 bg-slate-50 text-slate-600 rounded-md border border-slate-200 active:bg-slate-100">Edit</Link>
                         <button onClick={() => setModal({ isOpen: true, type: "delete_confirm", product: item })} className="text-[11px] font-bold text-center py-2 bg-red-50 text-red-600 rounded-md border border-red-100 active:bg-red-100">Delete</button>
                         <button onClick={() => handleToggleSold(item)} className="text-[11px] font-bold text-center py-2 bg-slate-900 text-white rounded-md active:bg-slate-800">
                           {isSold ? "Set Active" : "Mark Sold"}
                         </button>
                       </div>

                       {/* 🔥 Copy Link Button 🔥 */}
                       <button
                         onClick={() => handleCopyProductLink(item.publicId, item.id)}
                         className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                           copiedId === item.id 
                             ? "bg-green-50 text-green-700 border-green-200" 
                             : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 active:bg-slate-200"
                         }`}
                       >
                         {copiedId === item.id ? "✅ Link Copied!" : "🔗 Tap to copy product link"}
                       </button>

                     </div>
                   )
                 })}

                 {hasMoreListings && (
                   <button onClick={() => fetchListings(true)} disabled={loadingListings} className="w-full py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 active:bg-slate-50 transition-colors shadow-sm">
                     {loadingListings ? "Loading..." : "Load More Ads"}
                   </button>
                 )}
               </>
             )}
          </div>
        )}

        {/* === TAB 2: ORDERS (Sales) === */}
        {activeTab === "sales" && hasInventory && (
          <div className="space-y-3">
            {loadingSales && sales.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">Loading orders...</div>
            ) : sales.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm">
                <span className="text-4xl block mb-3">📦</span>
                <p className="text-slate-800 font-bold mb-1">Your orders will appear here</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center px-1 mb-2">
                   <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Orders</h2>
                   <button onClick={() => fetchSales(false, true)} className="text-[10px] font-bold text-[#D97706]">↻ Refresh</button>
                </div>
                {sales.map((order) => {
                  const status = order.status || "pending";
                  return (
                    <div key={order.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-xs text-slate-500 font-medium mb-0.5">Buyer: <span className="font-bold text-slate-800">{order.buyerName || order.contactPhone || "Guest"}</span></p>
                          <p className="text-sm font-bold text-slate-900">{order.items?.[0]?.productId || "Product Name"}</p>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-1 rounded-sm uppercase tracking-wide ${status === 'delivered' ? 'bg-green-100 text-green-700' : status === 'confirmed' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {status === 'pending' ? 'Awaiting Payment' : status === 'confirmed' ? 'Paid' : status === 'delivered' ? 'Completed' : status}
                        </span>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <button onClick={() => handleSaleStatusChange(order.id, 'confirmed')} disabled={status !== 'pending'} className="flex-1 text-[11px] font-bold py-2 border border-slate-200 text-slate-700 rounded-lg active:bg-slate-50 disabled:opacity-50">Mark as Paid</button>
                        <button onClick={() => handleSaleStatusChange(order.id, 'delivered')} disabled={status === 'delivered'} className="flex-1 text-[11px] font-bold py-2 bg-slate-900 text-white rounded-lg active:bg-slate-800 disabled:opacity-50">Complete</button>
                      </div>
                    </div>
                  )
                })}

                {hasMoreSales && (
                   <button onClick={() => fetchSales(true)} disabled={loadingSales} className="w-full py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
                     {loadingSales ? "Loading..." : "Load Older Orders"}
                   </button>
                 )}
              </>
            )}
          </div>
        )}

        {/* === TAB 3: PURCHASES === */}
        {activeTab === "purchases" && (
           <div className="space-y-3">
             {purchases.length === 0 ? <p className="text-center text-sm text-slate-500 py-10">No purchases yet.</p> : (
               <>
                 <div className="flex justify-between items-center px-1 mb-2">
                   <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">My Purchases</h2>
                   <button onClick={() => fetchPurchases(false, true)} className="text-[10px] font-bold text-[#D97706]">↻ Refresh</button>
                 </div>
                 {purchases.map(order => (
                   <div key={order.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                     <div><p className="font-bold text-sm text-slate-900">Order {order.orderNumber}</p><p className="text-xs text-slate-500">UGX {(Number(order.total) || 0).toLocaleString()}</p></div>
                     <span className="text-[9px] font-bold bg-slate-100 px-2 py-1 rounded-sm uppercase">{order.status || 'pending'}</span>
                   </div>
                 ))}
                 {hasMorePurchases && (
                   <button onClick={() => fetchPurchases(true)} disabled={loadingPurchases} className="w-full py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 shadow-sm">
                     {loadingPurchases ? "Loading..." : "Load Older Purchases"}
                   </button>
                 )}
               </>
             )}
           </div>
        )}

        {/* === TAB 4: SAVED === */}
        {activeTab === "saved" && (
           <div className="grid grid-cols-2 gap-3">
             {savedItems.length === 0 ? <p className="col-span-2 text-center text-sm text-slate-500 py-10">Wishlist empty.</p> : savedItems.map(item => (
               <div key={item.id} className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                  <Link href={`/product/${item.publicId || item.id}`}>
                    <div className="aspect-square bg-slate-100 rounded-lg mb-2 relative overflow-hidden border border-slate-100">
                      {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" sizes="50vw" />}
                    </div>
                    <h3 className="text-xs font-bold line-clamp-1 text-slate-900">{item.name}</h3>
                  </Link>
                  <button onClick={() => handleRemoveSaved(item.id)} className="text-[10px] text-red-500 font-bold mt-2 w-full text-left py-1">✕ Remove</button>
               </div>
             ))}
           </div>
        )}

      </div>

      <Link 
        href="/sell" 
        className="fixed bottom-6 right-6 absolute sm:bottom-10 sm:-right-6 bg-[#D97706] text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-3xl pb-1 hover:bg-amber-600 active:scale-95 transition-transform z-50 border-2 border-white"
      >
        +
      </Link>

    </div>
  );
}
