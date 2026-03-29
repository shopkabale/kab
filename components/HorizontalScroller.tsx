"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function HorizontalScroller({ title, products }: { title: string, products: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    const totalScroll = scrollWidth - clientWidth;
    
    if (totalScroll <= 0) {
      setProgress(0);
      return;
    }
    
    const currentProgress = (scrollLeft / totalScroll) * 100;
    setProgress(currentProgress);
  };

  useEffect(() => {
    handleScroll();
  }, [products]);

  if (!products || products.length === 0) return null;

  return (
    <div className="w-full overflow-hidden mb-6">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white px-4 mb-4 tracking-tight">
        {title}
      </h2>
      
      {/* Scrollable Container */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-4 overflow-x-auto snap-x no-scrollbar px-4 pb-4 w-full items-stretch"
      >
        {products.map((item) => (
          <Link 
            key={item.id}
            href={`/product/${item.publicId || item.id}`}
            className="snap-start shrink-0 w-[160px] sm:w-[200px] flex flex-col group bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-[#D97706] dark:hover:border-[#D97706] hover:shadow-md transition-all duration-300 shadow-sm overflow-hidden"
          >
            {/* Image Container */}
            <div className="w-full aspect-square bg-slate-100 dark:bg-slate-800/50 relative overflow-hidden shrink-0 border-b border-slate-100 dark:border-slate-800">
              {item.images?.[0] ? (
                <Image 
                  src={item.images[0]} 
                  alt={item.title || item.name || 'Product'} 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-500" 
                  sizes="(max-width: 768px) 50vw, 33vw" 
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-400 font-bold uppercase">No Image</span>
              )}
            </div>
            
            {/* Text & Price Details */}
            <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-[#D97706] transition-colors mb-2 leading-snug">
                {item.title || item.name}
              </h3>
              <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mt-auto">
                UGX {(Number(item.price) || 0).toLocaleString()}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="px-4 mt-1">
        <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#D97706] rounded-full transition-all duration-75 ease-out" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>
    </div>
  );
}
