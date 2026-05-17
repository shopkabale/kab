"use client";

import { useState } from "react";
import { collection, query, where, orderBy, limit, startAfter, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import Link from "next/link";
import ProductCard from "@/components/ProductCard"; // Adjust import path if needed

const PAGE_SIZE = 100; // 🔥 Updated to fetch and paginate by 100

export default function OfficialProductFeed({ initialProducts }: { initialProducts: any[] }) {
  const [products, setProducts] = useState<any[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialProducts.length === PAGE_SIZE);

  // Pagination Logic remains untouched for safety
  const loadMore = async () => {
    if (loading || !hasMore || products.length === 0) return;
    setLoading(true);

    try {
      const lastProduct = products[products.length - 1];
      const lastDocRef = doc(db, "products", lastProduct.id);
      const lastDocSnap = await getDoc(lastDocRef);

      if (!lastDocSnap.exists()) {
        setHasMore(false);
        setLoading(false);
        return;
      }

      const productsRef = collection(db, "products");
      const q = query(
        productsRef,
        where("isAdminUpload", "==", true),
        orderBy("createdAt", "desc"),
        startAfter(lastDocSnap),
        limit(PAGE_SIZE)
      );

      const snapshot = await getDocs(q);
      const newProducts = snapshot.docs.map(document => {
        const data = document.data();
        return {
          id: document.id,
          ...data,
          createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : data.createdAt
        };
      });

      setProducts(prev => [...prev, ...newProducts]);

      if (newProducts.length < PAGE_SIZE) {
        setHasMore(false);
      }
    } catch (error) {
      console.error("❌ Failed to load more products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Enterprise Empty State
  if (!products || products.length === 0) {
    return (
      <div className="w-full bg-white dark:bg-[#151515] rounded-md shadow-sm border border-slate-200 dark:border-slate-800 p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
        {/* Professional SVG icon instead of emoji */}
        <svg className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2">Inventory Updating</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-6 max-w-md">
          We are currently restocking our official items. Please check back soon.
        </p>
        <Link 
          href="/" 
          className="px-6 py-3 bg-[#FF6A00] hover:bg-[#e65c00] text-white text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-sm transition-colors shadow-sm outline-none"
        >
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full pb-8">
      
      {/* THE "WHITE ISLAND" CONTAINER */}
      <div className="w-full bg-white dark:bg-[#151515] rounded-md shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-6 select-none">
        
        {/* CLEAN HEADER */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
           <h2 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
             Available Inventory
           </h2>
           <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 bg-white dark:bg-[#111] px-2 py-1 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm">
             {products.length} ITEMS
           </span>
        </div>

        {/* CUSTOM GRID: Fixed to 4 columns max to prevent crushing next to the sidebar */}
        <div className="p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>

      {/* STYLED PAGINATION CONTROLS */}
      <div className="flex flex-col items-center justify-center h-16">
        {loading ? (
          <div className="flex flex-col items-center gap-2">
            <svg className="w-5 h-5 text-[#FF6A00] animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-[9px] font-black text-slate-500 animate-pulse uppercase tracking-widest">
              Loading...
            </span>
          </div>
        ) : hasMore ? (
          <button 
            onClick={loadMore}
            className="px-6 py-3 rounded-sm bg-white dark:bg-[#151515] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] sm:text-xs uppercase tracking-widest hover:border-[#FF6A00] hover:text-[#FF6A00] dark:hover:border-[#FF6A00] transition-all shadow-sm active:scale-95 flex items-center gap-2 group outline-none"
          >
            Load More Products
            <svg className="w-4 h-4 text-slate-400 group-hover:text-[#FF6A00] transition-transform group-hover:translate-y-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        ) : (
          <div className="flex items-center gap-2 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            <div className="w-8 h-[1px] bg-slate-300 dark:bg-slate-700"></div>
            End of Inventory
            <div className="w-8 h-[1px] bg-slate-300 dark:bg-slate-700"></div>
          </div>
        )}
      </div>
    </div>
  );
}
