"use client";

import { useEffect } from "react";

export default function RecentlyViewedTracker({ product }: { product: any }) {
  useEffect(() => {
    if (!product || !product.id) return;

    try {
      // 1. Check if they already have a history
      const storedHistory = localStorage.getItem("kabale_recent");
      let recent = storedHistory ? JSON.parse(storedHistory) : [];

      // 2. Remove this product if it's already in the list (so we don't duplicate it)
      recent = recent.filter((p: any) => p.id !== product.id);

      // 3. Add this product to the very front of the line
      recent.unshift({
        id: product.id,
        publicId: product.publicId,
        name: product.name,
        price: product.price,
        image: product.images?.[0] || null, // Best image!
        category: product.category || "general",
      });

      // 4. Keep it clean: Only remember the last 6 items so we don't bloat their phone memory
      if (recent.length > 6) {
        recent = recent.slice(0, 6);
      }

      // 5. Save it back to their phone
      localStorage.setItem("kabale_recent", JSON.stringify(recent));

    } catch (error) {
      console.error("Could not save to recently viewed:", error);
    }
  }, [product.id]);

  // This component doesn't render any UI, it just works in the background!
  return null; 
}
