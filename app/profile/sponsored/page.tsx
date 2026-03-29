"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { 
  getSponsoredSlots, 
  requestSponsoredSlot, 
  changeSponsoredProduct, 
  SponsoredSlot 
} from "@/lib/sponsored";

export default function ProfileSponsoredPage() {
  const { user, loading: authLoading } = useAuth();

  const [slots, setSlots] = useState<SponsoredSlot[]>([]);
  const [activeSlot, setActiveSlot] = useState<SponsoredSlot | null>(null);
  
  // Form states
  const [updateProductId, setUpdateProductId] = useState("");
  const [reqProductId, setReqProductId] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- CACHE LOGIC ---
  const saveToCache = useCallback((data: SponsoredSlot[]) => {
    if (!user) return;
    const cacheKey = `kabale_sponsored_${user.id}`;
    localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: data }));
  }, [user]);

  const loadFromCache = useCallback(() => {
    if (!user) return null;
    const cacheKey = `kabale_sponsored_${user.id}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < 86400000) return parsed.data; // 24 hours
    }
    return null;
  }, [user]);

  // --- FETCHING LOGIC ---
  const fetchSponsoredData = useCallback(async (forceRefresh = false) => {
    if (!user) return;

    if (!forceRefresh) {
      const cachedData = loadFromCache();
      if (cachedData && cachedData.length > 0) {
        setSlots(cachedData);
        const mySlot = cachedData.find((s: SponsoredSlot) => s.sellerUid === user.id && s.status === "active");
        setActiveSlot(mySlot || null);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    try {
      const allSlots = await getSponsoredSlots();
      setSlots(allSlots);
      
      const mySlot = allSlots.find(s => s.sellerUid === user.id && s.status === "active");
      setActiveSlot(mySlot || null);
      
      saveToCache(allSlots);
    } catch (error) {
      console.error("Failed to load sponsored data:", error);
    } finally {
      setLoading(false);
    }
  }, [user, loadFromCache, saveToCache]);

  // --- THE FIX: LOCKED MOUNT EFFECT ---
  useEffect(() => {
    if (!user || authLoading) return;

    const urlParams = new URLSearchParams(window.location.search);
    const shouldForceRefresh = urlParams.get('refresh') === 'true';

    fetchSponsoredData(shouldForceRefresh);

    if (shouldForceRefresh) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]);

  // --- ACTIONS ---
  const handleChangeProduct = async () => {
    if (!activeSlot || !updateProductId || !user) return;
    setIsSubmitting(true);
    try {
      await changeSponsoredProduct(activeSlot.id, updateProductId);
      alert("Product successfully updated in your active slot!");
      setUpdateProductId("");
      await fetchSponsoredData(true); // Force refresh to get fresh data
    } catch (error) {
      console.error(error);
      alert("Failed to update product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqProductId || !paymentRef || !user) return;
    
    setIsSubmitting(true);
    try {
      await requestSponsoredSlot({
        sellerUid: user.id,
        productId: reqProductId,
        requestedSlot: "any",
        paymentRef: paymentRef,
        isExtension: !!activeSlot
      });
      alert("Request sent to Admin for verification!");
      setReqProductId("");
      setPaymentRef("");
    } catch (error) {
      console.error(error);
      alert("Failed to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDER ---
  if (authLoading || loading) {
    return <div className="py-20 text-center text-slate-500 font-bold animate-pulse">Loading campaigns...</div>;
  }

  if (!user) return null;

  return (
    <div className="pb-24 max-w-md mx-auto bg-slate-50 min-h-screen sm:border-x sm:border-slate-200 shadow-sm relative">
      
      {/* 1. TOP SECTION (Navigation & Header) */}
      <div className="bg-white px-4 pt-6 pb-5 border-b border-slate-200">
        <Link 
          href="/profile" 
          className="inline-flex items-center text-[11px] font-bold text-slate-500 hover:text-[#D97706] transition-colors mb-4 bg-slate-50 px-2 py-1.5 rounded-md"
        >
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Profile
        </Link>

        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Sponsored Campaigns
        </h1>
        <p className="text-slate-500 text-xs font-medium mt-1">Manage your premium homepage slots</p>
      </div>

      <div className="p-4 space-y-4">
        
        {/* === ACTIVE CAMPAIGN SECTION === */}
        {activeSlot ? (
          <div className="bg-white rounded-xl border border-green-200 p-4 shadow-sm flex flex-col gap-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  Active: {activeSlot.id.replace('_', ' ').toUpperCase()}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Product: <span className="font-bold text-slate-800">{activeSlot.productId}</span>
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-2 rounded-md border border-slate-100">
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-0.5">Expires</p>
              <p className="text-xs font-bold text-slate-800">
                {activeSlot.endTime ? new Date(activeSlot.endTime.toMillis()).toLocaleString() : "N/A"}
              </p>
            </div>
            
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 mt-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Swap Product</p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="New Product ID" 
                  className="flex-1 border border-slate-200 p-2 text-xs rounded-lg bg-slate-50 focus:outline-none focus:border-green-500"
                  value={updateProductId}
                  onChange={(e) => setUpdateProductId(e.target.value)}
                />
                <button 
                  onClick={handleChangeProduct} 
                  disabled={isSubmitting || !updateProductId}
                  className="bg-slate-900 disabled:opacity-50 text-white px-4 py-2 text-[11px] font-bold rounded-lg active:bg-slate-800 transition-colors"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-center shadow-sm">
            <span className="text-3xl block mb-2">📢</span>
            <p className="text-slate-800 font-bold text-sm">No active campaigns</p>
            <p className="text-slate-500 text-xs mt-1">Book a slot to feature your items on the homepage.</p>
          </div>
        )}

        {/* === REQUEST NEW / EXTEND SLOT FORM === */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              {activeSlot ? "Extend or Book Next" : "Book a Slot"}
            </h2>
            <button onClick={() => fetchSponsoredData(true)} className="text-[10px] font-bold text-[#D97706]">↻ Refresh</button>
          </div>
          
          <form onSubmit={handleRequestSlot} className="flex flex-col gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Product ID</label>
              <input 
                required 
                type="text" 
                placeholder="e.g. prod_123abc" 
                className="w-full border border-slate-200 p-2.5 text-xs rounded-lg bg-slate-50 focus:outline-none focus:border-[#D97706]" 
                value={reqProductId} 
                onChange={(e) => setReqProductId(e.target.value)} 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Payment Reference</label>
              <input 
                required 
                type="text" 
                placeholder="Mobile Money TX ID" 
                className="w-full border border-slate-200 p-2.5 text-xs rounded-lg bg-slate-50 focus:outline-none focus:border-[#D97706]" 
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
              />
              <p className="text-[9px] text-slate-400 mt-1.5 leading-tight">Pay UGX X,XXX to 0740373021 and enter the exact transaction ID above.</p>
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="mt-1 w-full bg-[#D97706] disabled:opacity-50 text-white font-bold py-2.5 rounded-lg active:scale-95 transition-transform text-xs"
            >
              {isSubmitting ? "Submitting..." : "Submit for Verification"}
            </button>
          </form>
        </div>

        {/* === MARKETPLACE CAPACITY === */}
        <div className="mt-6 mb-2">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Marketplace Capacity</h3>
          <div className="grid grid-cols-4 gap-2 text-center">
            {slots.map(s => {
              const isActive = s.status === 'active';
              return (
                <div key={s.id} className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-0.5 ${
                  isActive 
                    ? 'bg-slate-50 border-slate-200' 
                    : 'bg-green-50 border-green-200'
                }`}>
                  <span className="text-[9px] font-medium text-slate-500">
                    Slot {s.id.split('_')[1]}
                  </span>
                  <span className={`text-[10px] font-black uppercase tracking-tight ${
                    isActive ? 'text-red-500' : 'text-green-600'
                  }`}>
                    {isActive ? 'Taken' : 'Open'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
