"use client";

import { useEffect } from "react";

export default function RecentlyViewedTracker({ product }: { product: any }) {
  useEffect(() => {
    if (!product?.id) return;

    try {
      // 1. Get existing viewed items from browser storage
      const savedJSON = localStorage.getItem("recentlyViewed");
      let saved = [];
      if (savedJSON) {
        saved = JSON.parse(savedJSON);
      }

      // 2. Create a lightweight version of the product to save storage space
      // We explicitly save the 'category' here so the PersonalizedFeed can read it later!
      const lightProduct = {
        id: product.id,
        publicId: product.publicId || product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        images: product.images || [],
      };

      // 3. Remove this product if it's already in the list (to avoid duplicates)
      const filtered = saved.filter((p: any) => {
        // Fallback just in case older items were saved as strings
        const pId = typeof p === 'string' ? p : p.id;
        return pId !== product.id;
      });

      // 4. Add the new item to the very front, and keep only the latest 10 items
      const updatedViews = [lightProduct, ...filtered].slice(0, 10);

      // 5. Save it back to local storage
      localStorage.setItem("recentlyViewed", JSON.stringify(updatedViews));
      
    } catch (error) {
      console.error("Failed to track recently viewed item", error);
    }
  }, [product]);

  // This component doesn't render any UI. It's a silent background tracker.
  return null;
}
