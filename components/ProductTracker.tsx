"use client";

import { useEffect } from "react";

export default function ProductTracker({ productId }: { productId: string }) {
  useEffect(() => {
    if (!productId) return;
    
    // Silently increment the view count
    fetch("/api/products/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    }).catch(console.error);
    
  }, [productId]);

  return null; // This component is invisible!
}