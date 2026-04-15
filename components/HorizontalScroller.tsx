"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { optimizeImage } from "@/lib/utils";
import { trackSelectItem } from "@/lib/analytics";

export default function HorizontalScroller({ 
  title, 
  subtitle, 
  products, 
  viewAllLink 
}: { 
  title: string, 
  subtitle?: string, 
  products: any[], 
  viewAllLink?: string 
}) {
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

    setScrollRatio(scrollLeft / maxScroll);
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
    // The clean "White Island" container
    <section className="bg-white dark:bg-[#151515] rounded-md shadow-sm border border-slate-200 dark:border-slate-800 mb-4 overflow-hidden select-none">

      {/* CLEAN MINIMALIST HEADER */}
      <div className="flex justify-between items-center p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-col">
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-800 dark:text-white capitalize tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        {/* View All Link */}
        {viewAllLink && (
          <Link href={viewAllLink} className="text-sm font-semibold text-[#D97706] hover:underline flex items-center gap-1 whitespace-nowrap outline-none">
            See All
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </Link>
        )}
      </div>

      {/* SCROLL/GRID CONTAINER */}
      <div className="p-3 sm:p-4">
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex md:grid gap-2 sm:gap-4 overflow-x-auto md:overflow-visible snap-x md:snap-none no-scrollbar pb-2 md:pb-0 w-full md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 items-stretch outline-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((p) => {
            const optimizedImage = p.images?.[0] ? optimizeImage(p.images[0]) : null;
            const isJustPosted = checkIsNew(p);
            const isSold = p.status === "sold";
            const isApproved = p.isApprovedQuality;
            const isOfficial = p.isOfficialStore || p.isAdminUpload;

            const titleStr = p.title || p.name || 'Product';
            const isShortTitle = titleStr.length <= 24;
            const displayTitle = (!isSold && isShortTitle) ? `${titleStr} (Ready for delivery)` : titleStr;

            return (
              <div key={p.id} className={`snap-start md:snap-align-none shrink-0 md:shrink w-[140px] sm:w-[170px] md:w-full group flex flex-col transition-all hover:shadow-md rounded-md p-1 sm:p-2 relative ${isSold ? 'opacity-80 grayscale-[20%]' : ''}`}>
                <Link 
                  href={`/product/${p.publicId || p.id}`} 
                  className="flex flex-col flex-grow relative outline-none"
                  onClick={() => {
                    trackSelectItem({
                      id: p.id,
                      name: titleStr, 
                      price: Number(p.price) || 0,
                      category: p.category || "general",
                    });
                  }}
                >
                  <div className="relative aspect-square w-full bg-slate-50 dark:bg-slate-900 rounded-sm overflow-hidden mb-2">
                    {optimizedImage ? (
                      <Image 
                        src={optimizedImage} 
                        alt={titleStr} 
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
                      <div className={`absolute bottom-0 left-0 ${isApproved ? 'bg-emerald-600' : 'bg-[#D97706]'} text-white text-[8px] md:text-[9px] font-bold px-1.5 py-1 leading-none rounded-tr-sm z-10 tracking-widest uppercase shadow-sm`}>
                         {isApproved ? 'Approved Quality' : 'Official Product'}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col flex-grow">
                    <div className="h-[36px] sm:h-[42px] mb-1 flex flex-col justify-start">
                      <h3 className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 line-clamp-2 leading-snug transition-colors duration-200 group-hover:text-[#D97706]">
                        {displayTitle}
                      </h3>
                    </div>

                    <div className="mt-auto pt-1 flex flex-col">
                      <span className={`text-sm sm:text-base font-black transition-colors duration-200 ${isSold ? 'text-slate-500' : 'text-slate-900 dark:text-white group-hover:text-[#D97706]'}`}>
                        UGX {Number(p.price).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}

          {/* md:hidden added here to hide the extra view all card on desktop layouts */}
          {viewAllLink && (
            <div className="snap-start shrink-0 w-[140px] sm:w-[170px] md:hidden flex flex-col bg-slate-50 dark:bg-[#111] rounded-md border border-dashed border-slate-200 dark:border-slate-800 hover:border-[#D97706] transition-colors group p-1 sm:p-2">
              <Link href={viewAllLink} className="flex flex-col items-center justify-center w-full h-full text-slate-500 hover:text-[#D97706] min-h-[200px] outline-none">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                </div>
                <span className="text-xs font-black uppercase tracking-wider">View All</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE SCROLL PROGRESS INDICATOR */}
      <div className={`w-full mt-1 md:hidden transition-opacity duration-300 ${isScrolling ? 'opacity-100' : 'opacity-0'}`}>
        <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
          <div 
            className="absolute top-0 h-full w-[15%] sm:w-[10%] bg-[#D97706] rounded-full transition-all duration-75 ease-out" 
            style={{ 
              left: `calc(${scrollRatio} * (100% - var(--dash-width)))`,
              '--dash-width': '15%'
            } as React.CSSProperties} 
          />
        </div>
      </div>
    </section>
  );
}
