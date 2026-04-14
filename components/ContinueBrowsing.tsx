"use client";

import { useEffect, useState } from "react";
import HorizontalScroller from "./HorizontalScroller";

interface ContinueBrowsingProps {
  title: string;
  subtitle: string;
  fallbackProducts: any[];
}

export default function ContinueBrowsing({ title, subtitle, fallbackProducts }: ContinueBrowsingProps) {
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

  // THE FALLBACK: If they haven't viewed anything, show Trending again
  if (viewedItems.length === 0) {
    if (!fallbackProducts || fallbackProducts.length === 0) return null;
    return (
      <section className="w-full">
        <HorizontalScroller 
          title="Discover Trending" 
          subtitle="You haven't viewed anything yet. Check these out!"
          products={fallbackProducts} 
        />
      </section>
    );
  }

  // NORMAL RENDER: Show their recently viewed items using the unified Scroller layout
  return (
    <section className="w-full">
      <HorizontalScroller 
        title={title} 
        subtitle={subtitle}
        products={viewedItems} 
      />
    </section>
  );
}
