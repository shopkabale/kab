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
  type: "payment" | "queue_full" | "verify_prompt" | "delete_confirm" | "none";
  title?: string;
  message?: string;
  actionType?: "boost" | "feature" | "urgent";
  product?: any;
  cost?: number;
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
  
  // Custom Modal State
  const [modal, setModal] = useState<ModalState>({ isOpen: false, type: "none" });
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

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

    const wishlistRef = collection(db, "users", user.id, "wishlist");
    const unsubscribeWishlist = onSnapshot(query(wishlistRef, orderBy("savedAt", "desc"), limit(10)), (snapshot) => {
      setSavedItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingSaved(false);
    });

    if (shouldForceRefresh) window.history.replaceState({}, document.title, window.location.pathname);
    return () => unsubscribeWishlist();
  }, [user?.id, authLoading, fetchListings, fetchSales, fetchPurchases, listings.length, purchases.length, sales.length]);

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

  // --- PREMIUM ACTIONS WITH LIMIT CHECKS ---
  const checkActiveCount = async (field: string) => {
    const q = query(collection(db, "products"), where(field, "==", true));
    const snap = await getDocs(q);
    const now = Date.now();
    return snap.docs.filter(d => {
      const data = d.data();
      const expiryField = field === "isBoosted" ? "boostExpiresAt" : field === "isFeatured" ? "featureExpiresAt" : "urgentExpiresAt";
      return data[expiryField] && data[expiryField] > now;
    }).length;
  };

  const initiatePremiumAction = async (product: any, actionType: "boost" | "feature" | "urgent") => {
    if (!user) return;

    let count = 0;
    let limitMax = 0;
    
    if (actionType === "boost") {
      count = await checkActiveCount("isBoosted");
      limitMax = 6;
    } else if (actionType === "feature") {
      count = await checkActiveCount("isFeatured");
      limitMax = 6;
    } else if (actionType === "urgent") {
      count = await checkActiveCount("isUrgent");
      limitMax = 20;
    }

    if (count >= limitMax) {
      setModal({ isOpen: true, type: "queue_full", actionType });
      return;
    }

    if (actionType === "urgent") {
      const now = Date.now();
      const expiresAt = now + (24 * 60 * 60 * 1000);
      try {
        await updateDoc(doc(db, "products", product.id), { isUrgent: true, urgentActivatedAt: now, urgentExpiresAt: expiresAt });
        const updatedListings = listings.map(item => item.id === product.id ? { ...item, isUrgent: true, urgentExpiresAt: expiresAt } : item);
        setListings(updatedListings);
        saveToCache('listings', updatedListings);
      } catch (error) { console.error(error); }
      return;
    }

    const cost = actionType === "boost" ? 1000 : 3000;
    setModal({ isOpen: true, type: "payment", product, actionType, cost });
  };

  const confirmPaymentSent = async () => {
    if (!modal.product || !modal.actionType) return;
    const productId = modal.product.id;
    
    try {
      await updateDoc(doc(db, "products", productId), { pendingVerification: modal.actionType });
      const updatedListings = listings.map(item => item.id === productId ? { ...item, pendingVerification: modal.actionType } : item);
      setListings(updatedListings);
      saveToCache('listings', updatedListings);
      closeModal();
    } catch (error) { console.error("Error setting pending state", error); }
  };

  const confirmDelete = async () => {
    if (!modal.product) return;
    try {
      await deleteDoc(doc(db, "products", modal.product.id));
      const updatedListings = listings.filter(item => item.id !== modal.product?.id);
      setListings(updatedListings);
      saveToCache('listings', updatedListings); 
      closeModal();
    } catch (error) { console.error(error); }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const closeModal = () => {
    setModal({ isOpen: false, type: "none" });
    setCopiedCode(null);
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

  return (
    <div className="pb-24 max-w-md mx-auto bg-slate-50 min-h-screen sm:border-x sm:border-slate-200 shadow-sm relative">

      {/* --- CUSTOM MODAL OVERLAY --- */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            
            {/* QUEUE FULL MODAL */}
            {modal.type === "queue_full" && (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">⏳</div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Queue is Full</h3>
                <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                  We only accept {modal.actionType === 'urgent' ? '20' : '6'} active <span className="font-bold capitalize">{modal.actionType}</span> items at a time to guarantee maximum visibility for sellers. Good luck tomorrow!
                </p>
                <button onClick={closeModal} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl active:scale-95 transition-transform">
                  Got it
                </button>
              </div>
            )}

            {/* PAYMENT INSTRUCTIONS MODAL */}
            {modal.type === "payment" && (
              <div className="p-6 text-center">
                <h3 className="text-xl font-black text-slate-900 mb-1">Activate <span className="capitalize">{modal.actionType}</span></h3>
                <p className="text-slate-500 text-sm mb-4">Pay securely using Merchant Codes</p>
                
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-500 uppercase">Amount Due</span>
                    <span className="text-lg font-black text-[#D97706]">UGX {modal.cost?.toLocaleString()}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 text-left">For {modal.actionType === 'feature' ? '3 days' : '24 hours'} of premium visibility.</p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div 
                    onClick={() => copyToClipboard('7050183')}
                    className="border border-red-200 bg-red-50 rounded-lg p-3 cursor-pointer hover:bg-red-100 transition-colors relative group"
                  >
                    <span className="block text-[10px] font-bold text-red-600 uppercase mb-1">Airtel Money</span>
                    <span className="text-lg font-black text-slate-900 tracking-wider">7050183</span>
                    {copiedCode === '7050183' && <span className="absolute -top-3 right-2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-sm">Copied!</span>}
                  </div>
                  <div 
                    onClick={() => copyToClipboard('14843537')}
                    className="border border-yellow-200 bg-yellow-50 rounded-lg p-3 cursor-pointer hover:bg-yellow-100 transition-colors relative group"
                  >
                    <span className="block text-[10px] font-bold text-yellow-600 uppercase mb-1">MTN MoMo</span>
                    <span className="text-lg font-black text-slate-900 tracking-wider">14843537</span>
                    {copiedCode === '14843537' && <span className="absolute -top-3 right-2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-sm">Copied!</span>}
                  </div>
                </div>

                <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg text-left mb-6 font-medium">
                  <span className="font-bold block mb-1">Next steps:</span>
                  1. Send the payment to a code above.<br/>
                  2. Send the screenshot via WhatsApp to <span className="font-bold">256759997376</span>.<br/>
                  3. Click "I have paid" below.
                </div>

                <div className="flex gap-2">
                  <button onClick={closeModal} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl active:bg-slate-200 transition-colors">Cancel</button>
                  <button onClick={confirmPaymentSent} className="flex-[2] py-3 bg-[#D97706] text-white font-bold rounded-xl active:bg-amber-600 transition-colors shadow-sm">I have paid</button>
                </div>
                <p className="text-[9px] font-bold text-slate-400 mt-4 uppercase tracking-widest">* Automated system coming soon *</p>
              </div>
            )}

            {/* VERIFY PROMPT MODAL */}
            {modal.type === "verify_prompt" && (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border border-amber-100">⏳</div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Verifying Payment</h3>
                <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                  We are checking your payment for this <span className="font-bold capitalize">{modal.actionType}</span>. Did you remember to send the screenshot to our Admin on WhatsApp?
                </p>
                <div className="flex flex-col gap-3">
                  <a href="https://wa.me/256759997376" target="_blank" rel="noopener noreferrer" className="w-full py-3 bg-[#25D366] text-white font-bold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform">
                    <span>📱</span> Send Screenshot Now
                  </a>
                  <button onClick={closeModal} className="w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-xl active:bg-slate-200 transition-colors">
                    Close
                  </button>
                </div>
              </div>
            )}

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

      {/* 1. TOP SECTION (User Overview) */}
      <div className="bg-white px-4 pt-6 pb-5 border-b border-slate-200">
        <div className="flex items-center gap-3 mb-5">
          {user.photoURL ? (
            <Image src={user.photoURL} alt={user.displayName || "User"} width={56} height={56} className="rounded-full object-cover border-2 border-slate-100" />
          ) : (
            <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-2xl font-bold border border-amber-200">
              {(user.displayName || "S").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              {user.displayName || "Kabale Seller"}
              {verificationStatus === "verified" && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wide border bg-blue-50 text-blue-600 border-blue-200">✓ Verified</span>
              )}
            </h1>
            <p className="text-slate-500 text-xs font-medium">{user.email || "No email"}</p>
          </div>
          <button onClick={signOut} className="text-[10px] text-slate-400 font-bold hover:text-red-600 bg-slate-50 px-2 py-1.5 rounded-md">Log Out</button>
        </div>
      </div>

      {/* 2. MAIN CONTENT AREA (Tabbed Interface) */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 flex overflow-x-auto no-scrollbar">
        <button onClick={() => setActiveTab("listings")} className={`flex-1 min-w-[100px] py-3 text-xs font-bold text-center border-b-2 transition-colors ${activeTab === "listings" ? "border-[#D97706] text-[#D97706]" : "border-transparent text-slate-500"}`}>My Ads</button>
        <button onClick={() => setActiveTab("sales")} className={`flex-1 min-w-[100px] py-3 text-xs font-bold text-center border-b-2 transition-colors ${activeTab === "sales" ? "border-[#D97706] text-[#D97706]" : "border-transparent text-slate-500"}`}>Orders</button>
        <button onClick={() => setActiveTab("purchases")} className={`flex-1 min-w-[100px] py-3 text-xs font-bold text-center border-b-2 transition-colors ${activeTab === "purchases" ? "border-[#D97706] text-[#D97706]" : "border-transparent text-slate-500"}`}>Purchases</button>
        <button onClick={() => setActiveTab("saved")} className={`flex-1 min-w-[100px] py-3 text-xs font-bold text-center border-b-2 transition-colors ${activeTab === "saved" ? "border-[#D97706] text-[#D97706]" : "border-transparent text-slate-500"}`}>Saved</button>
      </div>

      <div className="p-4">
        {/* === TAB 1: MY LISTINGS === */}
        {activeTab === "listings" && (
          <div className="space-y-4">
             {loadingListings && listings.length === 0 ? (
               <div className="text-center py-10 text-slate-400 text-sm">Loading listings...</div>
             ) : listings.length === 0 ? (
               <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm">
                 <span className="text-4xl block mb-3">🛍️</span>
                 <p className="text-slate-800 font-bold mb-1">Start selling in under 60 seconds</p>
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

                   // ACTIVE STATES
                   const isUrgentActive = item.isUrgent && item.urgentExpiresAt > now;
                   const isBoostedActive = item.isBoosted && item.boostExpiresAt > now;
                   const isFeaturedActive = item.isFeatured && item.featureExpiresAt > now;

                   // PENDING STATES (Awaiting Admin verification)
                   const pendingAction = item.pendingVerification; 

                   return (
                     <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex flex-col gap-3">
                       {/* Polished Product Card Header */}
                       <div className="flex gap-3">
                         <div className="w-20 h-20 bg-slate-50 rounded-lg flex-shrink-0 relative overflow-hidden border border-slate-100">
                           {item.images?.[0] ? (
                             <Image src={item.images[0]} alt={item.name} fill className="object-cover" sizes="80px" />
                           ) : <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-300 uppercase">No Img</span>}
                           {isFeaturedActive && <span className="absolute bottom-0 w-full bg-[#D97706] text-white text-[8px] font-black text-center py-0.5 uppercase tracking-widest">Featured</span>}
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
                             {isBoostedActive && <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide bg-amber-50 text-amber-600 border border-amber-100">🚀 Boosted</span>}
                           </div>
                         </div>
                       </div>

                       {/* Action Controls */}
                       <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                         <div className="grid grid-cols-2 gap-2">
                           <Link href={`/edit/${item.publicId || item.id}`} className="text-[11px] font-bold text-center py-2 bg-slate-50 text-slate-600 rounded-md border border-slate-200 active:bg-slate-100">Edit</Link>
                           <button onClick={() => setModal({ isOpen: true, type: "delete_confirm", product: item })} className="text-[11px] font-bold text-center py-2 bg-red-50 text-red-600 rounded-md border border-red-100 active:bg-red-100">Delete</button>
                         </div>

                         {/* Free Controls */}
                         <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => handleToggleSold(item)} className="text-[11px] font-bold text-center py-2 bg-slate-50 text-slate-600 rounded-md border border-slate-200 active:bg-slate-100">
                              {isSold ? "✅ Set Active" : "Mark Sold"}
                            </button>
                            <button 
                              onClick={() => initiatePremiumAction(item, 'urgent')} 
                              disabled={isUrgentActive}
                              className={`text-[11px] font-bold py-2 rounded-md border transition-colors ${isUrgentActive ? "bg-amber-50 text-amber-700 border-amber-200 opacity-80" : "border-slate-200 text-slate-600 bg-slate-50 active:bg-slate-100"}`}
                            >
                              {isUrgentActive ? "⚡ Urgent Active" : "⚡ Urgent"}
                            </button>
                         </div>
                       </div>

                       {/* Premium Growth Controls */}
                       {!isSold && (
                         <div className="flex gap-2 mt-1">
                           {/* BOOST BUTTON */}
                           <button 
                             onClick={() => pendingAction === 'boost' ? setModal({ isOpen: true, type: "verify_prompt", actionType: "boost" }) : initiatePremiumAction(item, 'boost')} 
                             disabled={isBoostedActive}
                             className={`flex-1 text-[11px] font-bold py-2.5 rounded-md transition-colors ${
                               isBoostedActive ? "bg-green-50 text-green-700 border border-green-200 opacity-90" : 
                               pendingAction === 'boost' ? "bg-slate-100 text-slate-600 border border-slate-200" : 
                               "bg-amber-100 text-amber-900 active:bg-amber-200"
                             }`}
                           >
                             {isBoostedActive ? "🚀 Boost Active" : pendingAction === 'boost' ? "⏳ Verify Payment" : "🚀 Boost (24h)"}
                           </button>

                           {/* FEATURE BUTTON */}
                           <button 
                             onClick={() => pendingAction === 'feature' ? setModal({ isOpen: true, type: "verify_prompt", actionType: "feature" }) : initiatePremiumAction(item, 'feature')} 
                             disabled={isFeaturedActive}
                             className={`flex-1 text-[11px] font-bold py-2.5 rounded-md transition-colors ${
                               isFeaturedActive ? "bg-green-50 text-green-700 border border-green-200 opacity-90" : 
                               pendingAction === 'feature' ? "bg-slate-100 text-slate-600 border border-slate-200" : 
                               "bg-slate-900 text-white active:bg-slate-800 shadow-sm"
                             }`}
                           >
                             {isFeaturedActive ? "⭐ Feature Active" : pendingAction === 'feature' ? "⏳ Verify Payment" : "⭐ Feature (3d)"}
                           </button>
                         </div>
                       )}
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
        {activeTab === "sales" && (
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

      {/* 4. BOTTOM SECTION (Growth Hooks) */}
      <div className="px-4 mt-2 pb-8 pt-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Grow your business</p>
        <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x pb-2">

          <div className="snap-start flex-shrink-0 w-[200px] bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">🚀 Boost Listing</h4>
              <p className="text-[10px] text-slate-500 mb-2 leading-tight">Get 10x more views today. Click "Boost" on your active ads!</p>
            </div>
            <button onClick={() => setActiveTab('listings')} className="text-[10px] font-bold bg-amber-100 text-amber-900 px-3 py-1.5 rounded-md w-full mt-2">Go to Listings</button>
          </div>

          {verificationStatus !== "verified" && (
            <div className="snap-start flex-shrink-0 w-[200px] bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">🛡️ Get Verified</h4>
                <p className="text-[10px] text-slate-500 mb-2 leading-tight">Build trust with buyers by verifying your local business.</p>
              </div>
              <button 
                onClick={handleVerifyProfile}
                disabled={verificationStatus === "pending" || isVerifying}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-md w-full transition-colors mt-2 ${verificationStatus === "pending" ? "bg-slate-100 text-slate-500" : "bg-blue-100 text-blue-900 active:bg-blue-200"}`}
              >
                {isVerifying ? "Submitting..." : verificationStatus === "pending" ? "Review Pending ⏳" : "Verify Profile"}
              </button>
            </div>
          )}

          <div className="snap-start flex-shrink-0 w-[200px] bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">⭐ Feature Item</h4>
              <p className="text-[10px] text-slate-500 mb-2 leading-tight">Pin your item to the top of the homepage for 7 days.</p>
            </div>
            <button onClick={() => setActiveTab('listings')} className="text-[10px] font-bold bg-slate-900 text-white px-3 py-1.5 rounded-md w-full mt-2">Go to Listings</button>
          </div>

        </div>
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
