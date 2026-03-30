"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import Image from "next/image";
import { doc, updateDoc, collection, query, where, getDocs, deleteField } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export default function PremiumRequestsManager() {
  const { user, loading: authLoading } = useAuth();

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Capacity Tracking
  const [activeBoosts, setActiveBoosts] = useState(0);
  const [activeFeatures, setActiveFeatures] = useState(0);

  const fetchData = async () => {
    if (!user || user.role !== "admin") return;
    setLoading(true);

    try {
      const now = Date.now();

      // 1. Fetch Active Limits (to show you available slots)
      const boostQ = query(collection(db, "products"), where("isBoosted", "==", true));
      const boostSnap = await getDocs(boostQ);
      setActiveBoosts(boostSnap.docs.filter(d => d.data().boostExpiresAt && d.data().boostExpiresAt > now).length);

      const featureQ = query(collection(db, "products"), where("isFeatured", "==", true));
      const featureSnap = await getDocs(featureQ);
      setActiveFeatures(featureSnap.docs.filter(d => d.data().featureExpiresAt && d.data().featureExpiresAt > now).length);

      // 2. Fetch Pending Requests
      // We look for any product where pendingVerification is "boost" or "feature"
      const requestsQ = query(collection(db, "products"), where("pendingVerification", "in", ["boost", "feature"]));
      const reqSnap = await getDocs(requestsQ);
      
      const pendingItems = reqSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Sort so oldest requests are at the top (First come, first served)
      setRequests(pendingItems.sort((a, b) => a.createdAt - b.createdAt));

    } catch (error) {
      console.error("Failed to fetch premium data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      fetchData();
    }
  }, [user]);

  const handleApprove = async (product: any) => {
    if (!window.confirm(`Approve ${product.pendingVerification} for ${product.name}? Make sure you received the mobile money!`)) return;

    try {
      const now = Date.now();
      const updates: any = { 
        pendingVerification: deleteField() // Remove from the pending queue
      };

      if (product.pendingVerification === "boost") {
        updates.isBoosted = true;
        updates.boostedAt = now;
        updates.boostExpiresAt = now + (24 * 60 * 60 * 1000); // 24 Hours
      } else if (product.pendingVerification === "feature") {
        updates.isFeatured = true;
        updates.featuredAt = now;
        updates.featureExpiresAt = now + (3 * 24 * 60 * 60 * 1000); // 3 Days
      }

      await updateDoc(doc(db, "products", product.id), updates);
      
      // Update UI
      setRequests(prev => prev.filter(r => r.id !== product.id));
      if (product.pendingVerification === "boost") setActiveBoosts(prev => prev + 1);
      if (product.pendingVerification === "feature") setActiveFeatures(prev => prev + 1);
      
      alert("✅ Request Approved and Activated!");
    } catch (error) {
      console.error(error);
      alert("Failed to approve request.");
    }
  };

  const handleReject = async (productId: string) => {
    if (!window.confirm("Reject this request? This will remove it from your queue.")) return;

    try {
      // Just clear the pending status so they can try again later
      await updateDoc(doc(db, "products", productId), { 
        pendingVerification: deleteField() 
      });
      setRequests(prev => prev.filter(r => r.id !== productId));
    } catch (error) {
      console.error(error);
      alert("Failed to reject request.");
    }
  };

  if (authLoading) return <div className="py-20 text-center font-bold text-slate-500 animate-pulse">Checking credentials...</div>;
  if (!user || user.role !== "admin") return <div className="py-20 text-center font-bold text-red-500">Access Denied</div>;

  return (
    <div className="max-w-6xl mx-auto pb-20 md:pb-0 px-4 mt-8">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Premium Requests</h1>
          <p className="text-slate-500 font-medium mt-1">Approve or reject paid Boost & Feature requests</p>
        </div>
        <button onClick={fetchData} className="bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all shadow-sm flex items-center gap-2">
          ↻ Refresh Queue
        </button>
      </div>

      {/* SERVER CAPACITY WIDGETS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Boosted Capacity</h3>
            <p className="text-slate-600 text-sm">Max 6 allowed</p>
          </div>
          <div className="text-right">
            <span className={`text-3xl font-black ${activeBoosts >= 6 ? 'text-red-500' : 'text-[#D97706]'}`}>
              {activeBoosts} <span className="text-xl text-slate-400">/ 6</span>
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Featured Capacity</h3>
            <p className="text-slate-600 text-sm">Max 6 allowed</p>
          </div>
          <div className="text-right">
            <span className={`text-3xl font-black ${activeFeatures >= 6 ? 'text-red-500' : 'text-slate-900'}`}>
              {activeFeatures} <span className="text-xl text-slate-400">/ 6</span>
            </span>
          </div>
        </div>
      </div>

      {/* PENDING REQUESTS TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                <th className="p-4 px-6">Product & Seller</th>
                <th className="p-4 px-6 text-center">Request Type</th>
                <th className="p-4 px-6 text-center">Amount Expected</th>
                <th className="p-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                 <tr>
                   <td colSpan={4} className="px-6 py-12 text-center text-slate-500">Checking for new requests...</td>
                 </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <span className="text-4xl block mb-3">📭</span>
                    <p className="text-slate-800 font-bold text-lg">No pending requests</p>
                    <p className="text-slate-500 text-sm">You're all caught up!</p>
                  </td>
                </tr>
              ) : (
                requests.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden relative flex-shrink-0 border border-slate-200">
                          {product.images?.[0] ? (
                            <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                          ) : (
                            <span className="text-[8px] text-slate-400 absolute inset-0 flex items-center justify-center">No Img</span>
                          )}
                        </div>
                        <div>
                          <Link href={`/product/${product.publicId || product.id}`} target="_blank" className="font-bold text-slate-900 line-clamp-1 hover:text-[#D97706] hover:underline">
                            {product.name}
                          </Link>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Seller: <span className="font-bold text-slate-700">{product.sellerName || "Unknown"}</span> 
                            {product.sellerPhone && ` (${product.sellerPhone})`}
                          </p>
                        </div>
                      </div>
                    </td>
                    
                    <td className="p-4 px-6 text-center">
                      {product.pendingVerification === "boost" ? (
                        <span className="bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                          🚀 Boost (24h)
                        </span>
                      ) : (
                        <span className="bg-slate-900 text-white border border-slate-900 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                          ⭐ Feature (3d)
                        </span>
                      )}
                    </td>

                    <td className="p-4 px-6 text-center font-black text-slate-900 text-lg">
                      {product.pendingVerification === "boost" ? "UGX 1,000" : "UGX 3,000"}
                    </td>

                    <td className="p-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleReject(product.id)}
                          className="px-4 py-2 rounded-lg bg-red-50 text-red-600 font-bold text-xs hover:bg-red-100 transition-colors border border-red-100"
                        >
                          Reject
                        </button>
                        <button 
                          onClick={() => handleApprove(product)}
                          className="px-6 py-2 rounded-lg bg-[#D97706] text-white font-bold text-xs hover:bg-amber-600 transition-colors shadow-sm"
                        >
                          Verify & Approve
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
