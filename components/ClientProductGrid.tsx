"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import QuickCartButton from "@/components/QuickCartButton";

export default function ClientProductGrid({ products }: { products: any[] }) {
  const [visibleCount, setVisibleCount] = useState(12);
  const [loading, setLoading] = useState(false);

  // Calculate visible items and if there are more to show
  const visibleProducts = products.slice(0, visibleCount);
  const hasMore = visibleCount < products.length;

  const handleLoadMore = () => {
    setLoading(true);
    // Fake a tiny network delay so the user sees the cool spinning animation
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
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
        {visibleProducts.map((p) => (
          <div key={p.id} className="relative group flex flex-col bg-white dark:bg-[#151515] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-lg transition-all h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <Link href={`/product/${p.publicId || p.id}`} className="flex flex-col flex-grow">
              <div className="relative aspect-square overflow-hidden bg-slate-50 dark:bg-slate-900">
                 {p.images?.[0] ? (
                   <Image src={p.images[0]} alt={p.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                 ) : (
                   <div className="m-auto flex items-center justify-center h-full text-[10px] font-bold text-slate-400 uppercase">No Image</div>
                 )}
              </div>
              <div className="p-4 flex flex-col flex-grow">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate mb-1">{p.category?.replace('_', ' ')}</p>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2 mb-4">{p.name}</h3>
                <div className="mt-auto">
                  {/* YELLOW PRICE TEXT */}
                  <span className="text-sm font-black text-yellow-500">UGX {Number(p.price).toLocaleString()}</span>
                </div>
              </div>
            </Link>

            {/* QUICK CART BUTTON */}
            <div className="absolute bottom-4 right-4 z-20">
              <QuickCartButton product={p} />
            </div>

          </div>
        ))}
      </div>

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
                {/* SVG Rotating Circle */}
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
