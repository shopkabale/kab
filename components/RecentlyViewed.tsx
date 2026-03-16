"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function RecentlyViewed() {
  const [recentItems, setRecentItems] = useState<any[]>([]);

  useEffect(() => {
    try {
      // Look into the phone's memory when the component loads
      const stored = localStorage.getItem("kabale_recent");
      if (stored) {
        setRecentItems(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load recently viewed:", error);
    }
  }, []);

  // If they haven't viewed anything yet, don't show the section at all!
  if (recentItems.length === 0) return null;

  return (
    <div className="py-8 px-4 w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
          Recently Viewed
        </h2>
      </div>
      
      {/* Horizontal scrolling list for mobile, grid for desktop */}
      <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar snap-x">
        {recentItems.map((item) => (
          <Link 
            key={item.id} 
            href={`/product/${item.publicId || item.id}`} 
            className="snap-start shrink-0 w-40 sm:w-48 bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all flex flex-col group"
          >
            {/* Image */}
            <div className="aspect-square relative bg-slate-50">
              {item.image ? (
                <Image 
                  src={item.image} 
                  alt={item.name} 
                  fill 
                  sizes="192px"
                  className="object-cover group-hover:scale-105 transition-transform duration-500" 
                />
              ) : (
                <div className="flex items-center justify-center h-full text-[10px] text-slate-400 font-bold uppercase">No Image</div>
              )}
            </div>

            {/* Tiny Details */}
            <div className="p-3 flex flex-col flex-grow">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate mb-1">
                {item.category?.replace(/_/g, ' ')}
              </p>
              <h3 className="text-xs font-bold text-slate-900 line-clamp-2 mb-2 group-hover:text-[#D97706] transition-colors">
                {item.name}
              </h3>
              <div className="mt-auto">
                <p className="text-sm font-black text-[#D97706]">
                  UGX {Number(item.price).toLocaleString()}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
