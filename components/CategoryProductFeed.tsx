"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { collection, query, where, orderBy, limit, startAfter, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import Link from "next/link";
import Image from "next/image";
import { optimizeImage } from "@/lib/utils";
import { trackSelectItem } from "@/lib/analytics";

// Note: If you changed the limit to 100 on the server page, update this to 100 to match,
// otherwise the initial 'hasMore' check might instantly return false.
const PAGE_SIZE = 20;

export default function CategoryProductFeed({ 
  initialProducts, 
  categoryName, 
  title 
}: { 
  initialProducts: any[], 
  categoryName: string,
  title: string
}) {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialProducts.length === PAGE_SIZE);

  // Extract URL Parameters
  const maxPrice = searchParams.get("max");
  const sortType = searchParams.get("sort");

  // ==========================================
  // FRONTEND FILTERING & SORTING LOGIC
  // ==========================================
  const displayedProducts = useMemo(() => {
    let filtered = [...products];

    // 1. Apply Price Filter
    if (maxPrice) {
      const max = Number(maxPrice);
      if (!isNaN(max)) {
        filtered = filtered.filter((p) => Number(p.price || 0) <= max);
      }
    }

    // 2. Apply Sorting
    if (sortType === "popular") {
      filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (sortType === "new") {
      filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    return filtered;
  }, [products, maxPrice, sortType]);

  // ==========================================
  // FIREBASE PAGINATION LOGIC
  // ==========================================
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
        where("category", "==", categoryName),
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
      console.error(`❌ Failed to load more ${categoryName} products:`, error);
    } finally {
      setLoading(false);
    }
  };

  // If the database has absolutely zero items for this category, let the parent layout handle the empty state.
  if (!products || products.length === 0) return null; 

  return (
    <div className="w-full pb-8">
      
      {/* THE "WHITE ISLAND" CONTAINER */}
      <div className="w-full bg-white dark:bg-[#151515] rounded-md shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-6 select-none">
        
        {/* CLEAN HEADER */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
           <h2 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
             {title}
           </h2>
           <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 bg-white dark:bg-[#111] px-2 py-1 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm tracking-widest uppercase">
             {displayedProducts.length} {displayedProducts.length === 1 ? 'Item' : 'Items'}
           </span>
        </div>

        {/* CONDITION: If filters wiped out all items, show an inline empty state */}
        {displayedProducts.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center justify-center min-h-[250px] bg-slate-50/50 dark:bg-black/20">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-2">No Matches Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4 leading-relaxed">
              We have items in this category, but none match your current filters. 
            </p>
            <div className="flex gap-3">
              <Link 
                href={`/category/${categoryName}`}
                className="px-4 py-2 bg-[#D97706] text-white text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-amber-600 transition-colors shadow-sm"
              >
                Clear Filters
              </Link>
              {hasMore && (
                <button 
                  onClick={loadMore}
                  className="px-4 py-2 bg-white dark:bg-[#151515] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-sm hover:border-[#D97706] dark:hover:border-[#D97706] transition-colors shadow-sm"
                >
                  Load More Items
                </button>
              )}
            </div>
          </div>
        ) : (
          /* CUSTOM GRID: Fixed to 4 columns max on desktop */
          <div className="p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {displayedProducts.map((p) => {
              const optimizedImage = p.images?.[0] ? optimizeImage(p.images[0]) : null;
              const isSold = p.status === "sold";
              const titleStr = p.title || p.name || 'Product';

              return (
                <div key={p.id} className={`group flex flex-col transition-all hover:shadow-md rounded-md p-1 sm:p-2 relative h-full ${isSold ? 'opacity-80 grayscale-[20%]' : ''}`}>
                  <Link 
                    href={`/product/${p.publicId || p.id}`} 
                    className="flex flex-col flex-grow relative pointer-events-auto outline-none"
                    onClick={() => {
                      trackSelectItem({
                        id: p.id,
                        name: titleStr, 
                        price: Number(p.price) || 0,
                        category: p.category || categoryName,
                      });
                    }}
                  >
                    {/* Image Area - Strict Square */}
                    <div className="relative aspect-square w-full bg-slate-50 dark:bg-slate-900 rounded-sm overflow-hidden mb-2 border border-slate-100 dark:border-slate-800/50">
                      {optimizedImage ? (
                        <Image 
                          src={optimizedImage} 
                          alt={titleStr} 
                          fill 
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw" 
                          className="object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase">No Image</div>
                      )}

                      {isSold && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 dark:bg-black/40 backdrop-blur-[2px]">
                           <span className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] sm:text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-sm shadow-lg transform -rotate-6">
                             Sold Out
                           </span>
                        </div>
                      )}
                    </div>

                    {/* Text Area */}
                    <div className="flex flex-col flex-grow bg-transparent">
                      <div className="h-[36px] sm:h-[42px] mb-1 flex flex-col justify-start">
                        <h3 className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 line-clamp-2 leading-snug transition-colors duration-200 group-hover:text-[#D97706]">
                          {titleStr}
                        </h3>
                      </div>

                      <div className="mt-auto pt-1 flex flex-col">
                        <span className={`text-sm sm:text-base font-black transition-colors duration-200 ${isSold ? 'text-slate-500' : 'text-slate-900 dark:text-white group-hover:text-[#D97706]'}`}>
                          UGX {Number(p.price).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* STYLED PAGINATION CONTROLS */}
      <div className="flex flex-col items-center justify-center h-16">
        {loading ? (
          <div className="flex flex-col items-center gap-2">
            <svg className="w-5 h-5 text-[#D97706] animate-spin" fill="none" viewBox="0 0 24 24">
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
            className="px-6 py-3 rounded-sm bg-white dark:bg-[#151515] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] sm:text-xs uppercase tracking-widest hover:border-[#D97706] hover:text-[#D97706] dark:hover:border-[#D97706] transition-all shadow-sm active:scale-95 flex items-center gap-2 group outline-none"
          >
            Load More Products
            <svg className="w-4 h-4 text-slate-400 group-hover:text-[#D97706] transition-transform group-hover:translate-y-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        ) : (
          <div className="flex items-center gap-2 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            <div className="w-8 h-[1px] bg-slate-300 dark:bg-slate-700"></div>
            End of Category
            <div className="w-8 h-[1px] bg-slate-300 dark:bg-slate-700"></div>
          </div>
        )}
      </div>
    </div>
  );
}
