"use client";

import { useEffect, useState } from "react";
import HorizontalScroller from "@/components/HorizontalScroller";

export default function PersonalizedFeed({ allProducts }: { allProducts: any[] }) {
  const [recommended, setRecommended] = useState<any[]>([]);
  const [topCategory, setTopCategory] = useState<string>("");

  useEffect(() => {
    try {
      // Look for the user's recently viewed items
      const viewedJSON = localStorage.getItem("recentlyViewed");
      if (!viewedJSON) return;

      const viewedItems = JSON.parse(viewedJSON);
      if (!Array.isArray(viewedItems) || viewedItems.length === 0) return;

      // Extract categories from what they looked at
      const categories = viewedItems.map((p: any) => p.category).filter(Boolean);
      if (categories.length === 0) return;

      // Find the most frequent category
      const counts = categories.reduce((acc: any, cat: string) => {
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {});

      const favoriteCat = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);

      // Filter the global products to find matches that share this category
      const matches = allProducts.filter((p) => p.category === favoriteCat);

      // Filter out items they already viewed so we show them *new* things
      const viewedIds = viewedItems.map((v: any) => v.id);
      const freshMatches = matches.filter((m) => !viewedIds.includes(m.id));

      // Format category for sentence case (e.g. "student item")
      const formattedCat = favoriteCat.replace("_", " ").toLowerCase();
      
      setTopCategory(formattedCat);
      // Bumped to 12 so the horizontal scroller has enough items to scroll!
      setRecommended(freshMatches.slice(0, 12)); 

    } catch (error) {
      console.error("Failed to load personalized recommendations", error);
    }
  }, [allProducts]);

  // If we couldn't find anything relevant, don't show the section at all
  if (recommended.length === 0) return null;

  return (
    <div className="w-full">
      <HorizontalScroller 
        title={`Because you looked at ${topCategory}`} 
        products={recommended} 
      />
    </div>
  );
}
