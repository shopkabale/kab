"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { optimizeImage } from "@/lib/utils";

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

  // Helper to dynamically check if an item is less than 7 days old
  const checkIsNew = (p: any) => {
    const pDate = p.createdAt?.seconds ? p.createdAt.seconds * 1000 : new Date(p.createdAt || 0).getTime();
    return pDate > 0 && (Date.now() - pDate) < (7 * 24 * 60 * 60 * 1000); 
  };

  if (!products || products.length === 0) return null;

  return (
    <div className="w-full overflow-hidden mb-4">
      
      {/* TITLE ALIGNED WITH GLOBAL LAYOUT */}
      <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-4 mb-3">
        <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
          {title}
        </h2>
      </div>

      {/* SCROLL CONTAINER */}
      <div className="w-full max-w-[1200px] mx-auto">
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-2 overflow-x-auto snap-x no-scrollbar px-3 sm:px-4 pb-4 w-full items-stretch"
        >
          {products.map((p) => {
            const optimizedImage = p.images?.[0] ? optimizeImage(p.images[0]) : null;
            const isJustPosted = checkIsNew(p);

            return (
              // MATCHED TO PRODUCT SECTION: rounded-sm, soft shadow, gap-2 width
              <div key={p.id} className="snap-start shrink-0 w-[150px] sm:w-[190px] group flex flex-col bg-white dark:bg-[#151515] rounded-sm overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-none dark:border dark:border-slate-800 transition-shadow hover:shadow-md h-full relative">

                <Link href={`/product/${p.publicId || p.id}`} className="flex flex-col flex-grow">
                  {/* Image Area: aspect-square for uniformity */}
                  <div className="relative aspect-square w-full bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                    {optimizedImage ? (
                      <Image 
                        src={optimizedImage} 
                        alt={p.title || p.name || 'Product'} 
                        fill 
                        sizes="(max-width: 768px) 50vw, 20vw" 
                        className="object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase">No Image</div>
                    )}

                    {/* Conditional "Just Posted" Overlay */}
                    {isJustPosted && (
                      <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-sm flex items-center gap-1 shadow-sm">
                         <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                         New
                      </div>
                    )}
                  </div>

                  {/* Details Area */}
                  <div className="p-2 sm:p-3 flex flex-col flex-grow bg-white dark:bg-[#151515]">
                    {/* Fixed height to ensure uniform card sizing even if titles are 1 or 2 lines */}
                    <h3 className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug mb-1 group-hover:text-[#D97706] transition-colors h-[34px] sm:h-[40px]">
                      {p.title || p.name}
                    </h3>
                    <div className="mt-auto pt-1">
                      <span className="text-sm sm:text-base font-black text-[#D97706] dark:text-yellow-500">
                        UGX {Number(p.price).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Bottom Quick Actions (Exact match to ProductSection) */}
                <div className="grid grid-cols-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111] mt-auto">
                   <a 
                     href={`https://wa.me/256740373021?text=${encodeURIComponent(`Hi! I am interested in this item on Kabale Online: *${p.title || p.name}*\n\nProduct ID: [${p.id}]`)}`}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="col-span-3 py-2 border-r border-slate-100 dark:border-slate-800 hover:bg-[#25D366] text-slate-900 dark:text-white hover:text-white text-[11px] font-bold uppercase flex justify-center items-center gap-1.5 transition-colors group/wa"
                   >
                     <span>WhatsApp</span>
                   </a>
                   <button className="col-span-1 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500 flex justify-center items-center transition-colors">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                     </svg>
                   </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Bar - Aligned to global padding */}
      <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-4 mt-1">
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
