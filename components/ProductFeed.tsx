"use client";

import { useState } from "react";
import { collection, query, orderBy, limit, startAfter, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import ProductSection from "@/components/ProductSection";
import { optimizeImage } from "@/lib/utils";

const PAGE_SIZE = 40;

export default function ProductFeed({ initialProducts }: { initialProducts: any[] }) {
  const [products, setProducts] = useState<any[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialProducts.length === PAGE_SIZE);

  const loadMore = async () => {
    if (loading || !hasMore || products.length === 0) return;
    setLoading(true);

    try {
      // 1. Get the ID of the last product currently on screen
      const lastProduct = products[products.length - 1];
      
      // 2. Fetch the actual Document Snapshot for the cursor. 
      // This is 100% bulletproof compared to relying on timestamp values.
      const lastDocRef = doc(db, "products", lastProduct.id);
      const lastDocSnap = await getDoc(lastDocRef);

      // 3. Fetch the next batch using the snapshot as the cursor
      const productsRef = collection(db, "products");
      const q = query(
        productsRef,
        orderBy("createdAt", "desc"),
        startAfter(lastDocSnap), // Passes the absolute document reference
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

  // Optimize images before passing to ProductSection
  const displayProducts = products.map((product) => {
    if (!product.images || product.images.length === 0) return product;
    return {
      ...product,
      images: product.images.map((img: string) => optimizeImage(img))
    };
  });

  return (
    <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-4 pb-8">
      <ProductSection 
        title={`Latest Additions (${products.length} items)`} 
        products={displayProducts} 
      />

      {products.length === 0 && (
        <div className="text-center py-20 text-slate-500 font-medium">
          No products found.
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
            <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              You've reached the end
            </div>
          )}
        </div>
      )}
    </div>
  );
}
