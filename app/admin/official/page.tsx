"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import Image from "next/image";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config"; // Ensure this path matches your setup

export default function OfficialProductsManager() {
  const { user, loading: authLoading } = useAuth();

  // States
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination States
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDocId, setLastDocId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

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
      fetchOfficialProducts();
    }
  }, [user]);

  // ------------------------------------------------------------------
  // TOGGLE PRODUCT BADGES
  // ------------------------------------------------------------------
  const toggleBadge = async (
    productId: string, 
    // 🔥 Added "tech_home" to the allowed fields here
    field: "isOfficialStore" | "isApprovedQuality" | "ladies_home" | "watch_home" | "isHero" | "tech_home", 
    currentValue: boolean
  ) => {
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

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1A1A1A]">Official Store Manager</h1>
          <p className="text-[#6B6B6B] font-medium mt-1">Manage Kabale Online's internal inventory & Badges</p>
        </div>
        <Link href="/admin/upload" className="bg-[#FF6A00] text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-md flex items-center justify-center gap-2 w-full sm:w-auto shrink-0">
          <span>+</span> Add New Item
        </Link>
      </div>

      {/* PRODUCTS TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="overflow-x-auto">
          {/* Increased min-w to accommodate the new column without squishing */}
          <table className="w-full text-left border-collapse min-w-[1350px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                <th className="p-4 px-6">Product</th>
                <th className="p-4 px-6">Price</th>
                <th className="p-4 px-6">Stock</th>
                <th className="p-4 px-6 text-center">Hero Promo</th>
                <th className="p-4 px-6 text-center">Official Store</th>
                <th className="p-4 px-6 text-center">Approved Quality</th>
                <th className="p-4 px-6 text-center">Ladies Home</th>
                <th className="p-4 px-6 text-center">Watch Home</th>
                <th className="p-4 px-6 text-center">Tech Home</th> {/* 🔥 NEW HEADER */}
                <th className="p-4 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                 <tr>
                   <td colSpan={10} className="px-6 py-12 text-center text-slate-500">Loading official inventory...</td>
                 </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-500 font-medium">No official products found.</td>
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
                          <p className="font-bold text-[#1A1A1A] line-clamp-1">{product.name || product.title}</p>
                          <p className="text-xs text-[#6B6B6B] font-mono mt-0.5">{product.publicId || product.id.slice(0,8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 px-6 font-bold text-[#1A1A1A] whitespace-nowrap">
                      UGX {Number(product.price).toLocaleString()}
                    </td>
                    <td className="p-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${Number(product.stock) > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {product.stock || 0} left
                      </span>
                    </td>

                    {/* HERO PROMO TOGGLE */}
                    <td className="p-4 px-6 text-center">
                      <button
                        onClick={() => toggleBadge(product.id, "isHero", !!product.isHero)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${product.isHero ? 'bg-red-500' : 'bg-slate-300'}`}
                        title="Toggle Hero Promo Status"
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${product.isHero ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </td>

                    {/* OFFICIAL STORE TOGGLE */}
                    <td className="p-4 px-6 text-center">
                      <button
                        onClick={() => toggleBadge(product.id, "isOfficialStore", !!product.isOfficialStore)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${product.isOfficialStore ? 'bg-[#FF6A00]' : 'bg-slate-300'}`}
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

                    {/* WATCH HOME TOGGLE */}
                    <td className="p-4 px-6 text-center">
                      <button
                        onClick={() => toggleBadge(product.id, "watch_home", !!product.watch_home)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${product.watch_home ? 'bg-indigo-500' : 'bg-slate-300'}`}
                        title="Toggle Watch Home Status"
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${product.watch_home ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </td>

                    {/* TECH HOME TOGGLE (🔥 NEW) */}
                    <td className="p-4 px-6 text-center">
                      <button
                        onClick={() => toggleBadge(product.id, "tech_home", !!product.tech_home)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${product.tech_home ? 'bg-blue-500' : 'bg-slate-300'}`}
                        title="Toggle Tech Home Status"
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${product.tech_home ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </td>

                    <td className="p-4 px-6 text-right">
                      <Link 
                        href={`/admin/upload?edit=${product.id}`}
                        className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 text-slate-600 hover:bg-[#FF6A00] hover:text-white transition-colors shadow-sm"
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
            className="bg-[#1A1A1A] text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-all disabled:opacity-70 flex items-center gap-2 shadow-sm"
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
