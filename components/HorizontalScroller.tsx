"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { optimizeImage } from "@/lib/utils";

// Added optional viewAllLink prop to support the new requirement
export default function HorizontalScroller({ title, products, viewAllLink }: { title: string, products: any[], viewAllLink?: string }) {
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

      {/* TITLE ALIGNED WITH GLOBAL LAYOUT + VIEW ALL LINK */}
      <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-4 mb-3 flex justify-between items-end">
        <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
          {title}
        </h2>
        {viewAllLink && (
          <Link href={viewAllLink} className="text-[#D97706] hover:text-amber-600 text-xs sm:text-sm font-bold uppercase tracking-widest flex items-center gap-1 transition-colors">
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
          className="flex gap-2 overflow-x-auto snap-x no-scrollbar px-3 sm:px-4 pb-4 w-full items-stretch"
        >
          {products.map((p) => {
            const optimizedImage = p.images?.[0] ? optimizeImage(p.images[0]) : null;
            const isJustPosted = checkIsNew(p);
            const isSold = p.status === "sold";

            // Badge Logic
            const isApproved = p.isApprovedQuality;
            const isOfficial = p.isOfficialStore || p.isAdminUpload;

            return (
              <div key={p.id} className={`snap-start shrink-0 w-[150px] sm:w-[190px] group flex flex-col bg-white dark:bg-[#151515] rounded-sm overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-none dark:border dark:border-slate-800 transition-shadow hover:shadow-md h-auto relative ${isSold ? 'opacity-80 grayscale-[20%]' : ''}`}>

                <Link href={`/product/${p.publicId || p.id}`} className="flex flex-col flex-grow relative pointer-events-auto">
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

                    {/* 🚫 SOLD OUT OVERLAY */}
                    {isSold && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 dark:bg-black/40 backdrop-blur-[2px]">
                         <span className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] sm:text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-sm shadow-lg transform -rotate-6">
                           Sold Out
                         </span>
                      </div>
                    )}

                    {/* Conditional "Just Posted" Overlay */}
                    {!isSold && isJustPosted && (
                      <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-sm flex items-center gap-1 shadow-sm z-10">
                         <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                         New
                      </div>
                    )}

                    {/* Trust Badges Overlay */}
                    {!isSold && isApproved ? (
                      <div className="absolute bottom-0 left-0 bg-emerald-600/95 backdrop-blur-sm text-white text-[8px] font-bold px-1.5 py-0.5 leading-none rounded-tr-sm flex items-center shadow-sm z-10 tracking-widest uppercase">
                         Approved Quality
                      </div>
                    ) : !isSold && isOfficial ? (
                      <div className="absolute bottom-0 left-0 bg-[#D97706]/95 backdrop-blur-sm text-white text-[8px] font-bold px-1.5 py-0.5 leading-none rounded-tr-sm flex items-center shadow-sm z-10 tracking-widest uppercase">
                         Official Product
                      </div>
                    ) : null}
                  </div>

                  {/* Details Area */}
                  <div className="p-2 sm:p-3 flex flex-col flex-grow bg-white dark:bg-[#151515]">
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

                {/* Bottom Quick Actions */}
                <div className="grid grid-cols-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111] mt-auto">
                   {isSold ? (
                     <div className="col-span-3 py-2 px-2 sm:px-3 border-r border-slate-100 dark:border-slate-800 text-slate-400 text-[11px] font-bold uppercase flex justify-start items-center cursor-not-allowed">
                       Unavailable
                     </div>
                   ) : (
                     <a 
                       href={`https://wa.me/256740373021?text=${encodeURIComponent(`Hi! I am interested in this item on Kabale Online: *${p.title || p.name}*\n\nProduct ID: [${p.id}]`)}`}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="col-span-3 py-2 px-2 sm:px-3 border-r border-slate-100 dark:border-slate-800 hover:bg-[#25D366] text-slate-900 dark:text-white hover:text-white text-[11px] font-bold uppercase flex justify-start items-center gap-1.5 transition-colors group/wa"
                     >
                       <span>WhatsApp</span>
                     </a>
                   )}
                   <button className="col-span-1 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500 flex justify-center items-center transition-colors">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                     </svg>
                   </button>
                </div>
              </div>
            );
          })}

          {/* VIEW ALL CARD (Appended at the very end of the scroller) */}
          {viewAllLink && (
            <div className="snap-start shrink-0 w-[150px] sm:w-[190px] flex flex-col bg-slate-50 dark:bg-[#111] rounded-sm border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-[#D97706] dark:hover:border-[#D97706] transition-colors group h-auto">
              <Link href={viewAllLink} className="flex flex-col items-center justify-center w-full h-full text-slate-500 hover:text-[#D97706] p-4 min-h-[220px]">
                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform mb-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                </div>
                <span className="text-sm font-black uppercase tracking-wider text-center">View All</span>
              </Link>
            </div>
          )}

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
