"use client";

import { useEffect, useState } from "react";
import HorizontalScroller from "./HorizontalScroller";

export default function ContinueBrowsing({ fallbackProducts }: { fallbackProducts: any[] }) {
  const [viewedItems, setViewedItems] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedJSON = localStorage.getItem("recentlyViewed");
    
    if (savedJSON) {
      try {
        const parsed = JSON.parse(savedJSON);
        // Take only the last 8 items
        setViewedItems(parsed.slice(0, 8));
      } catch (error) {
        console.error("Error parsing recently viewed", error);
      }
    }
  }, []);

  // Prevent hydration mismatch errors in Next.js
  if (!mounted) return null; 

  // THE FALLBACK: If they haven't viewed anything, show Trending again under a different title
  if (viewedItems.length === 0) {
    if (!fallbackProducts || fallbackProducts.length === 0) return null;
    return (
      <section className="w-full">
        <div className="px-4 pt-2 -mb-2 z-10 relative">
          <p className="text-xs text-slate-500 font-bold tracking-wide italic">You haven't viewed anything yet. Check these out!</p>
        </div>
        <HorizontalScroller title="🔥 Discover Trending" products={fallbackProducts} />
      </section>
    );
  }

  // NORMAL RENDER: Show their recently viewed items
  return (
    <section className="w-full">
      <div className="px-4 pt-2 -mb-2 z-10 relative">
        <p className="text-xs text-slate-500 font-bold tracking-wide italic">Pick up where you left off</p>
      </div>
      <HorizontalScroller title="🔁 Continue Browsing" products={viewedItems} />
    </section>
  );
}
