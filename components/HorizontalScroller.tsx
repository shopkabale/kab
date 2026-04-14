"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { optimizeImage } from "@/lib/utils";
import { trackSelectItem } from "@/lib/analytics";
import { useTheme } from "@/components/ThemeProvider"; // IMPORT THEME PROVIDER

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

  const theme = useTheme(); // GET CURRENT DAY THEME

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
    <div className="w-full overflow-hidden relative select-none">

      {/* FIXED DYNAMIC HEADER: Removed max-w to let it span full width, matched padding with other components */}
      <div className={`w-full ${theme.bg} ${theme.border} px-4 md:px-8 py-2 sm:py-3 mb-2 flex justify-between items-center transition-colors duration-500`}>
        <div className="flex flex-col">
          <h2 className={`text-base md:text-lg lg:text-xl font-black ${theme.text} capitalize tracking-tight transition-colors duration-500`}>
            {title}
          </h2>
          {subtitle && (
            <p className={`text-[10px] sm:text-xs ${theme.text} opacity-80 font-bold tracking-wide mt-0.5`}>
              {subtitle}
            </p>
          )}
        </div>
        {viewAllLink && (
          <Link href={viewAllLink} className={`${theme.highlight} hover:opacity-70 text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-widest flex items-center gap-1 transition-all outline-none whitespace-nowrap`}>
            View All
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
          </Link>
        )}
      </div>

      {/* SCROLL/GRID CONTAINER: Removed max-w, added responsive padding */}
      <div className="w-full px-4 md:px-8">
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          // Flex on mobile for scrolling, Grid on desktop (md and up) for full display
          className="flex md:grid gap-3 md:gap-4 lg:gap-5 overflow-x-auto md:overflow-visible snap-x md:snap-none no-scrollbar pb-2 md:pb-0 w-full md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 items-stretch outline-none"
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
              // Fixed width on mobile, full width of grid cell on desktop
              <div key={p.id} className={`snap-start md:snap-align-none shrink-0 md:shrink w-[150px] sm:w-[190px] md:w-full group flex flex-col bg-white dark:bg-[#151515] rounded-sm overflow-hidden shadow-sm dark:border dark:border-slate-800 transition-all hover:shadow-md relative ${isSold ? 'opacity-80 grayscale-[20%]' : ''}`}>
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
                  <div className="relative aspect-square w-full bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
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

                  <div className="p-2 sm:p-3 flex flex-col flex-grow">
                    <div className="h-[36px] sm:h-[42px] mb-1 flex flex-col justify-start">
                      <h3 className="text-xs sm:text-sm md:text-base font-medium text-gray-500 dark:text-gray-400 line-clamp-2 leading-snug transition-colors duration-200 group-hover:text-[#D97706] dark:group-hover:text-[#D97706]">
                        {displayTitle}
                      </h3>
                    </div>

                    <div className="mt-auto pt-1 flex flex-col">
                      <span className={`text-sm sm:text-base md:text-lg font-black transition-colors duration-200 ${isSold ? 'text-slate-500' : 'text-black dark:text-white group-hover:text-[#D97706] dark:group-hover:text-[#D97706]'}`}>
                        UGX {Number(p.price).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}

          {viewAllLink && (
            // Flex logic updated here to match product cards
            <div className="snap-start md:snap-align-none shrink-0 md:shrink w-[150px] sm:w-[190px] md:w-full flex flex-col bg-slate-50 dark:bg-[#111] rounded-sm border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-[#D97706] transition-colors group">
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

      {/* md:hidden added here to remove the scroll progress bar entirely on desktop grids */}
      <div className={`w-full mt-1 md:hidden transition-opacity duration-300 ${isScrolling ? 'opacity-100' : 'opacity-0'}`}>
        <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 relative overflow-hidden">
          {/* DYNAMIC THEMED PROGRESS DASH */}
          <div 
            className={`absolute top-0 h-full w-[15%] sm:w-[10%] ${theme.bg} rounded-full transition-all duration-75 ease-out`} 
            style={{ 
              left: `calc(${scrollRatio} * (100% - var(--dash-width)))`,
              '--dash-width': '15%'
            } as React.CSSProperties} 
          />
        </div>
      </div>
    </div>
  );
}
