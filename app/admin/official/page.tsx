"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import Image from "next/image";
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config"; // Ensure this path matches your setup

export default function OfficialProductsManager() {
  const { user, loading: authLoading } = useAuth();

  // States
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Global Settings State
  const [showWatchSection, setShowWatchSection] = useState(false);

  // Pagination States
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDocId, setLastDocId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // ------------------------------------------------------------------
  // FETCH GLOBAL SETTINGS
  // ------------------------------------------------------------------
  const fetchSettings = async () => {
    try {
      const settingsRef = doc(db, "settings", "home");
      const snap = await getDoc(settingsRef);
      if (snap.exists()) {
        setShowWatchSection(!!snap.data().showWatchSection);
      }
    } catch (error) {
      console.error("Failed to fetch global settings:", error);
    }
  };

  const fetchOfficialProducts = async (isLoadMore = false) => {
    if (!user || user.role !== "admin") return;

    try {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      const url = new URL("/api/products", window.location.origin);

      if (isLoadMore && lastDocId) {
        url.searchParams.append("cursor", lastDocId);
      }

      // We pull 50 at a time because we are filtering out user products locally. 
      url.searchParams.append("limit", "50"); 

      const res = await fetch(url.toString());

      if (res.ok) {
        const data = await res.json();
        const fetchedProducts = data.products || [];

        if (fetchedProducts.length < 50) {
          setHasMore(false);
        }

        // Filter ONLY products uploaded by the Admin/Official Store
        const officialItems = fetchedProducts.filter((p: any) => 
          p.isAdminUpload === true || 
          (p.sellerName && (p.sellerName.toLowerCase().includes("admin") || p.sellerName.toLowerCase().includes("official")))
        );

        if (isLoadMore) {
          setProducts(prev => [...prev, ...officialItems]);
        } else {
          setProducts(officialItems);
        }

        if (fetchedProducts.length > 0) {
          setLastDocId(fetchedProducts[fetchedProducts.length - 1].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      fetchSettings();
      fetchOfficialProducts();
    }
  }, [user]);

  // ------------------------------------------------------------------
  // TOGGLE GLOBAL HOMEPAGE SECTION
  // ------------------------------------------------------------------
  const toggleGlobalWatchSection = async () => {
    const newValue = !showWatchSection;
    
    // Optimistic UI Update
    setShowWatchSection(newValue);

    try {
      const settingsRef = doc(db, "settings", "home");
      // Use setDoc with merge: true in case the document doesn't exist yet
      await setDoc(settingsRef, { showWatchSection: newValue }, { merge: true });
    } catch (error) {
      console.error("Failed to update global settings:", error);
      // Revert if failed
      setShowWatchSection(!newValue);
      alert("Failed to update homepage layout. Please check your connection.");
    }
  };

  // ------------------------------------------------------------------
  // TOGGLE PRODUCT BADGES
  // ------------------------------------------------------------------
  const toggleBadge = async (productId: string, field: "isOfficialStore" | "isApprovedQuality" | "ladies_home", currentValue: boolean) => {
    const newValue = !currentValue;

    // 1. Optimistic UI update (feels instant to the user)
    setProducts(prev => 
      prev.map(p => p.id === productId ? { ...p, [field]: newValue } : p)
    );

    try {
      // 2. Update Firestore document
      const productRef = doc(db, "products", productId);
      await updateDoc(productRef, {
        [field]: newValue
      });
    } catch (error) {
      console.error(`Failed to update ${field}:`, error);
      // 3. Revert UI if the database update fails
      setProducts(prev => 
        prev.map(p => p.id === productId ? { ...p, [field]: currentValue } : p)
      );
      alert("Failed to update product status. Please check your connection.");
    }
  };

  if (authLoading) return <div className="py-20 text-center font-bold text-slate-500 animate-pulse">Checking credentials...</div>;
  if (!user || user.role !== "admin") return null;

  return (
    <div className="max-w-7xl mx-auto pb-20 md:pb-0 px-4">
      
      {/* HEADER & GLOBAL SETTINGS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Official Store Manager</h1>
          <p className="text-slate-500 font-medium mt-1">Manage Kabale Online's internal inventory & Badges</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          {/* Global Homepage Toggles */}
          <div className="flex items-center justify-between w-full sm:w-auto gap-4 bg-white border border-slate-200 px-4 py-3 rounded-xl shadow-sm">
            <span className="text-sm font-bold text-slate-700 whitespace-nowrap">⌚ "Find Your Watch" Section</span>
            <button
              onClick={toggleGlobalWatchSection}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${showWatchSection ? 'bg-[#D97706]' : 'bg-slate-300'}`}
              title="Toggle Watch Section on Homepage"
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showWatchSection ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <Link href="/admin/upload" className="bg-[#D97706] text-white px-6 py-3 rounded-xl font-bold hover:bg-amber-600 transition-all shadow-md flex items-center justify-center gap-2 w-full sm:w-auto shrink-0">
            <span>+</span> Add New Item
          </Link>
        </div>
      </div>

      {/* PRODUCTS TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                <th className="p-4 px-6">Product</th>
                <th className="p-4 px-6">Price</th>
                <th className="p-4 px-6">Stock</th>
                <th className="p-4 px-6 text-center">Official Store</th>
                <th className="p-4 px-6 text-center">Approved Quality</th>
                <th className="p-4 px-6 text-center">Ladies Home</th>
                <th className="p-4 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                 <tr>
                   <td colSpan={7} className="px-6 py-12 text-center text-slate-500">Loading official inventory...</td>
                 </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">No official products found.</td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden relative flex-shrink-0 border border-slate-200">
                          {product.images?.[0] ? (
                            <Image src={product.images[0]} alt={product.name || product.title} fill className="object-cover" />
                          ) : (
                            <span className="text-[8px] text-slate-400 absolute inset-0 flex items-center justify-center">No Img</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 line-clamp-1">{product.name || product.title}</p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{product.publicId || product.id.slice(0,8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 px-6 font-bold text-slate-900 whitespace-nowrap">
                      UGX {Number(product.price).toLocaleString()}
                    </td>
                    <td className="p-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${Number(product.stock) > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {product.stock || 0} left
                      </span>
                    </td>

                    {/* OFFICIAL STORE TOGGLE */}
                    <td className="p-4 px-6 text-center">
                      <button
                        onClick={() => toggleBadge(product.id, "isOfficialStore", !!product.isOfficialStore)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${product.isOfficialStore ? 'bg-[#D97706]' : 'bg-slate-300'}`}
                        title="Toggle Official Store Status"
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${product.isOfficialStore ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </td>

                    {/* APPROVED QUALITY TOGGLE */}
                    <td className="p-4 px-6 text-center">
                      <button
                        onClick={() => toggleBadge(product.id, "isApprovedQuality", !!product.isApprovedQuality)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${product.isApprovedQuality ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        title="Toggle Approved Quality Status"
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${product.isApprovedQuality ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </td>

                    {/* LADIES HOME TOGGLE */}
                    <td className="p-4 px-6 text-center">
                      <button
                        onClick={() => toggleBadge(product.id, "ladies_home", !!product.ladies_home)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${product.ladies_home ? 'bg-pink-500' : 'bg-slate-300'}`}
                        title="Toggle Ladies Home Status"
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${product.ladies_home ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </td>

                    <td className="p-4 px-6 text-right">
                      <Link 
                        href={`/admin/upload?edit=${product.id}`}
                        className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 text-slate-600 hover:bg-[#D97706] hover:text-white transition-colors shadow-sm"
                        title="Edit Official Item"
                      >
                        ✏️
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Load More Button */}
      {!loading && hasMore && (
        <div className="flex justify-center mb-8">
          <button 
            onClick={() => fetchOfficialProducts(true)}
            disabled={loadingMore}
            className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-70 flex items-center gap-2 shadow-sm"
          >
            {loadingMore ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Loading...</>
            ) : "Load Next Batch"}
          </button>
        </div>
      )}
    </div>
  );
}
