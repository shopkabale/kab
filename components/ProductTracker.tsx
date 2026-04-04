"use client";

import { useEffect, useRef } from "react";
import { trackViewItem } from "@/lib/analytics";

export default function ProductTracker({ product }: { product: any }) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!product || !product.id) return;

    if (!hasTracked.current) {
      // 1. Silently increment the view count in your database
      fetch("/api/products/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      }).catch(console.error);

      // 2. Fire the Google Tag Manager Analytics Event
      trackViewItem({
        id: product.id,
        name: product.name || "Unknown Item",
        price: Number(product.price) || 0,
        category: product.category || "general",
      });

      // Mark as tracked so it doesn't double-fire in React Strict Mode
      hasTracked.current = true;
    }
  }, [product]);

  return null; // This component is invisible!
}
