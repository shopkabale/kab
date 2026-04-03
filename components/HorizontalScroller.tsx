"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { optimizeImage } from "@/lib/utils";

export default function HorizontalScroller({ title, products, viewAllLink }: { title: string, products: any[], viewAllLink?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [scrollRatio, setScrollRatio] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    const maxScroll = scrollWidth - clientWidth;

    if (maxScroll <= 0) {
      setScrollRatio(0);
      return;
    }

    // Calculate position ratio from 0 to 1
    setScrollRatio(scrollLeft / maxScroll);

    // Show the indicator
    setIsScrolling(true);

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 1000);
  };

  useEffect(() => {
    handleScroll();
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [products]);

  const checkIsNew = (p: any) => {
    const pDate = p.createdAt?.seconds ? p.createdAt.seconds * 1000 : new Date(p.createdAt || 0).getTime();
    return pDate > 0 && (Date.now() - pDate) < (7 * 24 * 60 * 60 * 1000); 
  };

  if (!products || products.length === 0) return null;

  return (
    <div className="w-full overflow-hidden mb-4 relative select-none">
      {/* HEADER */}
      <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-4 mb-3 flex justify-between items-end">
        <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
          {title}
        </h2>
        {viewAllLink && (
          <Link href={viewAllLink} className="text-[#D97706] hover:text-amber-600 text-xs sm:text-sm font-bold uppercase tracking-widest flex items-center gap-1 transition-colors outline-none">
            View All
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
          </Link>
        )}
      </div>

      {/* SCROLL CONTAINER */}
      <div className="w-full max-w-[1200px] mx-auto">
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-2 overflow-x-auto snap-x no-scrollbar px-3 sm:px-4 pb-4 w-full items-stretch outline-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((p) => {
            const optimizedImage = p.images?.[0] ? optimizeImage(p.images[0]) : null;
            const isJustPosted = checkIsNew(p);
            const isSold = p.status === "sold";
            const isApproved = p.isApprovedQuality;
            const isOfficial = p.isOfficialStore || p.isAdminUpload;

            return (
              <div key={p.id} className={`snap-start shrink-0 w-[150px] sm:w-[190px] group flex flex-col bg-white dark:bg-[#151515] rounded-sm overflow-hidden shadow-sm dark:border dark:border-slate-800 transition-all hover:shadow-md h-auto relative ${isSold ? 'opacity-80 grayscale-[20%]' : ''}`}>
                <Link href={`/product/${p.publicId || p.id}`} className="flex flex-col flex-grow relative outline-none">
                  <div className="relative aspect-square w-full bg-slate-50 dark:bg-slate-900">
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

                    {isSold && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 dark:bg-black/40 backdrop-blur-[2px]">
                         <span className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] sm:text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-sm shadow-lg transform -rotate-6">
                           Sold Out
                         </span>
                      </div>
                    )}

                    {!isSold && isJustPosted && (
                      <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-sm flex items-center gap-1 z-10">
                         <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                         New
                      </div>
                    )}

                    {!isSold && (isApproved || isOfficial) && (
                      <div className={`absolute bottom-0 left-0 ${isApproved ? 'bg-emerald-600' : 'bg-[#D97706]'} text-white text-[8px] font-bold px-1.5 py-1 leading-none rounded-tr-sm z-10 tracking-widest uppercase`}>
                         {isApproved ? 'Approved Quality' : 'Official Product'}
                      </div>
                    )}
                  </div>

                  <div className="p-2 sm:p-3 flex flex-col flex-grow">
                    <h3 className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug mb-1 group-hover:text-[#D97706] transition-colors h-[34px] sm:h-[40px]">
                      {p.title || p.name}
                    </h3>
                    <div className="mt-auto pt-1">
                      <span className={`text-sm sm:text-base font-black ${isSold ? 'text-slate-500' : 'text-[#D97706] dark:text-yellow-500'}`}>
                        UGX {Number(p.price).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Link>

                <div className="grid grid-cols-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111]">
                   {isSold ? (
                     <div className="col-span-3 py-2 px-2 sm:px-3 border-r border-slate-100 dark:border-slate-800 text-slate-400 text-[11px] font-bold uppercase flex items-center">
                       Unavailable
                     </div>
                   ) : (
                     <a 
                       href={`https://wa.me/256740373021?text=${encodeURIComponent(`Hi! I am interested in this item: *${p.title || p.name}*`)}`}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="col-span-3 py-2 px-2 sm:px-3 border-r border-slate-100 dark:border-slate-800 hover:bg-[#25D366] text-slate-900 dark:text-white hover:text-white text-[11px] font-bold uppercase flex items-center gap-1.5 transition-colors outline-none"
                     >
                       <span>WhatsApp</span>
                     </a>
                   )}
                   <button className="col-span-1 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500 flex justify-center items-center transition-colors outline-none">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                   </button>
                </div>
              </div>
            );
          })}

          {viewAllLink && (
            <div className="snap-start shrink-0 w-[150px] sm:w-[190px] flex flex-col bg-slate-50 dark:bg-[#111] rounded-sm border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-[#D97706] transition-colors group">
              <Link href={viewAllLink} className="flex flex-col items-center justify-center w-full h-full text-slate-500 hover:text-[#D97706] p-4 min-h-[220px] outline-none">
                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform mb-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                </div>
                <span className="text-sm font-black uppercase tracking-wider">View All</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* FIXED PROGRESS INDICATOR */}
      <div className={`w-full mt-2 transition-opacity duration-300 ${isScrolling ? 'opacity-100' : 'opacity-0'}`}>
        <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 relative overflow-hidden">
          <div 
            className="absolute top-0 h-full w-[15%] sm:w-[10%] bg-[#D97706] rounded-full transition-all duration-75 ease-out" 
            style={{ 
              // Moves the dash exactly across the available space. 
              // It subtracts its own width (10% on sm, 15% on mobile) so it stops flush at the right edge.
              left: `calc(${scrollRatio} * (100% - var(--dash-width)))`,
              '--dash-width': '15%' // You can adjust this to match the w-[...] class above
            } as React.CSSProperties} 
          />
        </div>
      </div>
    </div>
  );
}
