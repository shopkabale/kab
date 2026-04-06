"use client";

import { useEffect, useRef } from "react";
import { trackViewItem } from "@/lib/analytics";

export default function ProductTracker({ product }: { product: any }) {
  // Track the specific product ID instead of a generic boolean
  const trackedId = useRef<string | null>(null);

  useEffect(() => {
    // Safety check: ensure product and ID exist before proceeding
    if (!product || !product.id) return;

    // Only fire if we haven't tracked THIS specific product ID yet
    if (trackedId.current !== product.id) {
      // Mark this ID as tracked immediately to prevent double-firing in Strict Mode
      trackedId.current = product.id;

      // 1. Silently increment the view count in your database
      fetch("/api/products/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      })
        .then((res) => {
          if (!res.ok) {
            console.error("API failed to register view, status:", res.status);
          }
        })
        .catch(console.error);

      // 2. Fire the Google Tag Manager Analytics Event
      trackViewItem({
        id: product.id,
        name: product.name || "Unknown Item",
        price: Number(product.price) || 0,
        category: product.category || "general",
      });
    }
  }, [product?.id]); // Depend strictly on the product ID

  return null; // This component remains invisible
}
