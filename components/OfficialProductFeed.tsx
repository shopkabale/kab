"use client";

import { useState } from "react";
import { collection, query, where, orderBy, limit, startAfter, getDoc, doc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import ProductSection from "@/components/ProductSection";
import Link from "next/link";

const PAGE_SIZE = 20;

export default function OfficialProductFeed({ initialProducts }: { initialProducts: any[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(false);
  // If the initial batch is exactly the PAGE_SIZE, assume there might be more
  const [hasMore, setHasMore] = useState(initialProducts.length === PAGE_SIZE);

  const loadMore = async () => {
    if (loading || !hasMore || products.length === 0) return;
    setLoading(true);

    try {
      // 1. Get the very last product in our current list
      const lastProduct = products[products.length - 1];
      
      // 2. Fetch the actual Firestore document snapshot to use as the pagination cursor
      const lastDocSnap = await getDoc(doc(db, "products", lastProduct.id));

      if (!lastDocSnap.exists()) {
        setHasMore(false);
        setLoading(false);
        return;
      }

      // 3. Query the next batch of Official items ONLY
      const q = query(
        collection(db, "products"),
        where("isAdminUpload", "==", true),
        orderBy("createdAt", "desc"),
        startAfter(lastDocSnap),
        limit(PAGE_SIZE)
      );

      const snapshot = await getDocs(q);
      
      const newProducts = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : data.createdAt
        };
      });

      setProducts(prev => [...prev, ...newProducts]);
      
      // If we got fewer products than the page size, we've reached the end
      if (newProducts.length < PAGE_SIZE) {
        setHasMore(false);
      }
    } catch (error) {
      console.error("❌ Error loading more products:", error);
    } finally {
      setLoading(false);
    }
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-[#111] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mt-8">
        <span className="text-4xl mb-4 block">📦</span>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Inventory Updating</h3>
        <p className="text-slate-500 dark:text-slate-400 font-medium mb-6">
          We are currently restocking our official items. Check back soon.
        </p>
        <Link 
          href="/" 
          className="inline-block px-8 py-3 bg-slate-900 dark:bg-slate-200 text-white dark:text-black rounded-full font-bold shadow-md hover:scale-105 transition-transform"
        >
          Return to Homepage
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ProductSection 
        title="Available Inventory" 
        products={products} 
      />

      {hasMore && (
        <div className="flex justify-center mt-10 mb-6">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-8 py-3.5 bg-white dark:bg-[#151515] text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-800 rounded-sm font-black uppercase tracking-widest text-sm hover:border-[#D97706] hover:text-[#D97706] transition-all disabled:opacity-50 flex items-center gap-3 outline-none group"
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-[#D97706] border-t-transparent rounded-full animate-spin"></span>
                Loading...
              </>
            ) : (
              <>
                Load More Items
                <svg className="w-5 h-5 text-slate-400 group-hover:text-[#D97706] transition-transform group-hover:translate-y-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
