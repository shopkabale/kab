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

            // Parse stock safely (defaults to 1 if not set)
            const currentStock = parseInt(p.stock?.toString() || "1", 10);
            
            // 🔥 The subtle "Ready for delivery" psychological append
            const titleStr = p.title || p.name || 'Product';
            const isShortTitle = titleStr.length <= 24;
            const displayTitle = (!isSold && isShortTitle) ? `${titleStr} (Ready for delivery)` : titleStr;

            return (
              <div key={p.id} className={`snap-start shrink-0 w-[150px] sm:w-[190px] group flex flex-col bg-white dark:bg-[#151515] rounded-sm overflow-hidden shadow-sm dark:border dark:border-slate-800 transition-all hover:shadow-md h-auto relative ${isSold ? 'opacity-80 grayscale-[20%]' : ''}`}>
                <Link href={`/product/${p.publicId || p.id}`} className="flex flex-col flex-grow relative outline-none">
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
                      <div className={`absolute bottom-0 left-0 ${isApproved ? 'bg-emerald-600' : 'bg-[#D97706]'} text-white text-[8px] font-bold px-1.5 py-1 leading-none rounded-tr-sm z-10 tracking-widest uppercase shadow-sm`}>
                         {isApproved ? 'Approved Quality' : 'Official Product'}
                      </div>
                    )}
                  </div>

                  <div className="p-2 sm:p-3 flex flex-col flex-grow">
                    {/* TITLE AREA */}
                    <div className="h-[36px] sm:h-[42px] mb-1 flex flex-col justify-start">
                      <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 line-clamp-2 leading-snug transition-colors duration-200 group-hover:text-[#D97706] dark:group-hover:text-[#D97706]">
                        {displayTitle}
                      </h3>
                    </div>

                    <div className="mt-auto pt-1 flex flex-col">
                      {/* BOLD BLACK PRICE (Turns Orange on hover) */}
                      <span className={`text-sm sm:text-base font-black transition-colors duration-200 ${isSold ? 'text-slate-500' : 'text-black dark:text-white group-hover:text-[#D97706] dark:group-hover:text-[#D97706]'}`}>
                        UGX {Number(p.price).toLocaleString()}
                      </span>

                      {/* TRAFFIC LIGHT STOCK INDICATOR */}
                      {!isSold && (
                        <div className="mt-0.5">
                          {currentStock >= 6 && (
                            <span className="text-emerald-500 dark:text-emerald-400 text-[10px] font-bold">
                              In Stock (6+)
                            </span>
                          )}
                          {currentStock >= 3 && currentStock <= 5 && (
                            <span className="text-amber-500 dark:text-amber-400 text-[10px] font-bold">
                              Only {currentStock} left
                            </span>
                          )}
                          {currentStock >= 1 && currentStock <= 2 && (
                            <span className="text-red-500 dark:text-red-400 text-[10px] font-bold">
                              Only {currentStock} left
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>

                {/* FULL WIDTH CTA */}
                <div className="border-t border-slate-100 dark:border-slate-800 bg-gray-50 dark:bg-[#1a1a1a]">
                  {isSold ? (
                    <div className="w-full py-2 px-2 sm:px-3 text-slate-400 text-[11px] font-bold uppercase flex items-center justify-between">
                      <span>Unavailable</span>
                    </div>
                  ) : (
                    // 🔥 Changed justify-center to justify-between to snap text left and icon right
                    <a 
                      href={`https://wa.me/256740373021?text=${encodeURIComponent(`Hi! I am interested in this item on Kabale Online: *${titleStr}*\n\nProduct ID: [${p.id}]`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-2 sm:px-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-[11px] font-black uppercase flex items-center justify-between transition-colors duration-200 outline-none group-hover:text-[#D97706] dark:group-hover:text-[#D97706]"
                    >
                      <span>Chat with Seller</span>
                      <svg className="w-4 h-4 fill-current text-[#25D366] shrink-0" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.012c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                      </svg>
                    </a>
                  )}
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
              left: `calc(${scrollRatio} * (100% - var(--dash-width)))`,
              '--dash-width': '15%'
            } as React.CSSProperties} 
          />
        </div>
      </div>
    </div>
  );
}
