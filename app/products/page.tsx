"use client";

import { useState } from "react";
// 🌟 IMPORT THE EXACT HOMEPAGE COMPONENT
import ProductSection from "@/components/ProductSection";

export default function ClientProductGrid({ products }: { products: any[] }) {
  const [visibleCount, setVisibleCount] = useState(12);
  const [loading, setLoading] = useState(false);

  // Calculate visible items and if there are more to show
  const visibleProducts = products.slice(0, visibleCount);
  const hasMore = visibleCount < products.length;

  const handleLoadMore = () => {
    setLoading(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + 12);
      setLoading(false);
    }, 600);
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-16 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 shadow-sm">
        <span className="text-5xl block mb-4">🛒</span>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">No products found</h3>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Check back soon! We are adding new items every day.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* 🌟 USE THE HOMEPAGE COMPONENT (hideTitle makes it fit perfectly) */}
      <ProductSection products={visibleProducts} hideTitle={true} />

      {/* ANIMATED LOAD MORE BUTTON */}
      {hasMore && (
        <div className="mt-12 flex justify-center pb-8">
          <button 
            onClick={handleLoadMore}
            disabled={loading}
            className="flex items-center justify-center gap-3 w-full sm:w-auto px-10 py-4 bg-[#D97706] text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-md hover:bg-amber-600 transition-all disabled:opacity-80 disabled:cursor-wait"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </>
            ) : (
              "Load More Items"
            )}
          </button>
        </div>
      )}
    </>
  );
}
