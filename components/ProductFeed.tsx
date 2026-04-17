"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { collection, query, orderBy, limit, startAfter, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import ProductSection from "@/components/ProductSection";
import { optimizeImage } from "@/lib/utils";

// Note: Ensure your server page fetches this same amount to properly match 'hasMore' logic
const PAGE_SIZE = 40;

export default function ProductFeed({ initialProducts }: { initialProducts: any[] }) {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialProducts.length === PAGE_SIZE);

  // Extract URL Parameters
  const maxPrice = searchParams.get("max");
  const sortType = searchParams.get("sort");

  const loadMore = async () => {
    if (loading || !hasMore || products.length === 0) return;
    setLoading(true);

    try {
      // 1. Get the ID of the last product currently on screen (from the UNFILTERED pool)
      const lastProduct = products[products.length - 1];

      // 2. Fetch the actual Document Snapshot for the cursor.
      const lastDocRef = doc(db, "products", lastProduct.id);
      const lastDocSnap = await getDoc(lastDocRef);

      if (!lastDocSnap.exists()) {
        setHasMore(false);
        setLoading(false);
        return;
      }

      // 3. Fetch the next batch using the snapshot as the cursor
      const productsRef = collection(db, "products");
      const q = query(
        productsRef,
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

      // 4. Append new products to the existing list
      setProducts(prev => [...prev, ...newProducts]);

      // 5. If we got fewer products than the PAGE_SIZE, we've hit the end
      if (newProducts.length < PAGE_SIZE) {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load more products:", error);
    } finally {
      setLoading(false);
    }
  };

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

    // 3. Optimize images for the final displayed array
    return filtered.map((product) => {
      if (!product.images || product.images.length === 0) return product;
      return {
        ...product,
        images: product.images.map((img: string) => optimizeImage(img))
      };
    });
  }, [products, maxPrice, sortType]);

  return (
    <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-4 pb-8">
      
      {displayedProducts.length > 0 ? (
        <ProductSection 
          title={`Latest Additions (${displayedProducts.length} items)`} 
          products={displayedProducts} 
        />
      ) : (
        <div className="bg-white dark:bg-[#151515] rounded-md border border-slate-200 dark:border-slate-800 shadow-sm p-12 text-center flex flex-col items-center justify-center min-h-[300px] mt-4">
          <svg className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2">No items found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-md">
            {(maxPrice || sortType) 
              ? "Try clearing your filters to see more results." 
              : "Check back soon! New local deals are posted here daily."}
          </p>
          
          {(maxPrice || sortType) && (
            <Link 
              href="/products" 
              className="mt-4 px-4 py-2 bg-[#D97706] text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-amber-600 transition-colors"
            >
              Clear Filters
            </Link>
          )}
        </div>
      )}

      {products.length > 0 && (
        <div className="flex flex-col items-center justify-center mt-12 mb-8 h-20">
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <svg className="w-8 h-8 text-[#D97706] animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm font-bold text-slate-500 animate-pulse uppercase tracking-widest">
                Loading more finds...
              </span>
            </div>
          ) : hasMore ? (
            <button 
              onClick={loadMore}
              className="px-8 py-3.5 rounded-xl bg-white dark:bg-[#151515] border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-sm hover:border-[#D97706] hover:text-[#D97706] dark:hover:border-[#D97706] transition-all shadow-sm active:scale-95"
            >
              Load More Products
            </button>
          ) : (
            <div className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3">
              <div className="w-12 h-px bg-slate-300 dark:bg-slate-700"></div>
              You've reached the end
              <div className="w-12 h-px bg-slate-300 dark:bg-slate-700"></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
