"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  getSponsoredSlots, 
  requestSponsoredSlot, 
  changeSponsoredProduct, 
  SponsoredSlot 
} from "@/lib/sponsored";

export default function ProfileSponsoredPage() {
  // TODO: Replace with your actual Firebase Auth hook to get the logged-in user
  // Example: const { user } = useAuth(); const sellerUid = user?.uid;
  const sellerUid = "test_seller_123"; 

  const [slots, setSlots] = useState<SponsoredSlot[]>([]);
  const [activeSlot, setActiveSlot] = useState<SponsoredSlot | null>(null);
  
  // Form states
  const [updateProductId, setUpdateProductId] = useState("");
  const [reqProductId, setReqProductId] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const allSlots = await getSponsoredSlots();
      setSlots(allSlots);
      
      // Find if this specific seller has an active slot
      const mySlot = allSlots.find(s => s.sellerUid === sellerUid && s.status === "active");
      setActiveSlot(mySlot || null);
    } catch (error) {
      console.error("Failed to load sponsored data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeProduct = async () => {
    if (!activeSlot || !updateProductId) return;
    setIsSubmitting(true);
    try {
      await changeSponsoredProduct(activeSlot.id, updateProductId);
      alert("Product successfully updated in your active slot!");
      setUpdateProductId("");
      await loadData();
    } catch (error) {
      console.error(error);
      alert("Failed to update product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqProductId || !paymentRef) return;
    
    setIsSubmitting(true);
    try {
      await requestSponsoredSlot({
        sellerUid,
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

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="animate-pulse flex flex-col gap-4">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      
      {/* NAVIGATION */}
      <Link 
        href="/profile" 
        className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-[#D97706] transition-colors mb-6"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Profile
      </Link>

      <h1 className="text-xl md:text-2xl font-black uppercase text-slate-900 dark:text-white mb-6">
        Sponsored Campaigns
      </h1>

      {/* ACTIVE CAMPAIGN SECTION */}
      {activeSlot ? (
        <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/50 p-5 rounded-lg mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="font-black text-green-800 dark:text-green-400 uppercase tracking-tight flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Active Campaign ({activeSlot.id.replace('_', ' ').toUpperCase()})
              </h2>
              <p className="text-sm text-green-700 dark:text-green-500/80 mt-1">
                Currently promoting Product ID: <span className="font-mono font-bold">{activeSlot.productId}</span>
              </p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Expires: {activeSlot.endTime ? new Date(activeSlot.endTime.toMillis()).toLocaleString() : "N/A"}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-green-200/50 dark:border-green-800/50">
            <input 
              type="text" 
              placeholder="Paste new Product ID to swap instantly" 
              className="border border-green-200 dark:border-green-800 p-2.5 text-sm rounded-md bg-white dark:bg-[#111] flex-grow focus:outline-none focus:ring-2 focus:ring-green-500/50"
              value={updateProductId}
              onChange={(e) => setUpdateProductId(e.target.value)}
            />
            <button 
              onClick={handleChangeProduct} 
              disabled={isSubmitting || !updateProductId}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-5 py-2.5 text-sm font-bold rounded-md whitespace-nowrap transition-colors"
            >
              Update Product
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-slate-800 p-5 rounded-lg mb-8 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">You currently have no active sponsored campaigns.</p>
          <p className="text-xs text-slate-500">Book a slot below to feature your product on the homepage.</p>
        </div>
      )}

      {/* REQUEST NEW / EXTEND SLOT FORM */}
      <div className="bg-white dark:bg-[#151515] border border-slate-200 dark:border-slate-800 p-5 rounded-lg mb-8 shadow-sm">
        <h2 className="font-black text-slate-900 dark:text-white uppercase mb-4">
          {activeSlot ? "Extend or Book Next Round" : "Book a Sponsored Slot"}
        </h2>
        <form onSubmit={handleRequestSlot} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Product ID</label>
            <input 
              required 
              type="text" 
              placeholder="e.g. prod_123abc" 
              className="w-full border border-slate-300 dark:border-slate-700 p-3 text-sm rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-[#D97706]/50" 
              value={reqProductId} 
              onChange={(e) => setReqProductId(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Payment Reference</label>
            <input 
              required 
              type="text" 
              placeholder="Mobile Money Transaction ID" 
              className="w-full border border-slate-300 dark:border-slate-700 p-3 text-sm rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-[#D97706]/50" 
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
            />
            {/* Update the pricing below to match your actual rates */}
            <p className="text-[10px] text-slate-400 mt-1">Please pay UGX X,XXX to 0740373021 and enter the exact transaction ID here.</p>
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="mt-2 bg-[#D97706] hover:bg-yellow-600 disabled:opacity-50 text-white font-black py-3 rounded-md transition-colors uppercase tracking-wider text-sm shadow-sm"
          >
            {isSubmitting ? "Submitting..." : "Submit Payment for Verification"}
          </button>
        </form>
      </div>

      {/* MARKETPLACE CAPACITY */}
      <div>
        <h3 className="font-black mb-3 text-slate-800 dark:text-slate-200 uppercase text-sm tracking-tight">Marketplace Capacity</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          {slots.map(s => {
            const isActive = s.status === 'active';
            return (
              <div key={s.id} className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1 ${
                isActive 
                  ? 'bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800' 
                  : 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800/50'
              }`}>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Slot {s.id.split('_')[1]}
                </span>
                <span className={`text-sm font-black uppercase ${
                  isActive ? 'text-red-500' : 'text-green-600 dark:text-green-500'
                }`}>
                  {isActive ? 'Taken' : 'Available'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      
    </div>
  );
}
