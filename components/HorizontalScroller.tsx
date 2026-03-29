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
      
      {/* The px-4 here allows the items to bleed perfectly to the edge 
        of the screen while maintaining alignment with the title.
      */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-4 overflow-x-auto snap-x no-scrollbar px-4 pb-2 w-full"
      >
        {products.map((item) => (
          <Link 
            key={item.id}
            href={`/product/${item.publicId || item.id}`}
            className="snap-start shrink-0 w-[140px] sm:w-[180px] flex flex-col group"
          >
            <div className="w-full aspect-square bg-slate-100 dark:bg-slate-800/50 rounded-2xl relative overflow-hidden mb-2">
              {item.images?.[0] ? (
                <Image 
                  src={item.images[0]} 
                  alt={item.title || item.name || 'Product'} 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-300" 
                  sizes="(max-width: 768px) 50vw, 33vw" 
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-400 font-bold uppercase">No Image</span>
              )}
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-[#D97706] transition-colors">
              {item.title || item.name}
            </h3>
            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">
              UGX {(Number(item.price) || 0).toLocaleString()}
            </p>
          </Link>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="px-4 mt-2">
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
