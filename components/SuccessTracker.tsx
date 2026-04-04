"use client";

import { useEffect, useRef } from "react";
import { trackPurchase } from "@/lib/analytics";

export default function SuccessTracker({ 
  orderId, 
  total, 
  items 
}: { 
  orderId: string; 
  total: number; 
  items: Array<{ id: string; name: string; price: number }>;
}) {
  const hasTracked = useRef(false);

  useEffect(() => {
    // Only fire once per page load to prevent duplicate Google Ads conversions
    if (!hasTracked.current) {
      trackPurchase(orderId, total, items);
      hasTracked.current = true;
    }
  }, [orderId, total, items]);

  return null; // Invisible component
}
