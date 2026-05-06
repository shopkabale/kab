"use client";

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
  const checkIsNew = (p: any) => {
    const pDate = p.createdAt?.seconds ? p.createdAt.seconds * 1000 : new Date(p.createdAt || 0).getTime();
    return pDate > 0 && (Date.now() - pDate) < (7 * 24 * 60 * 60 * 1000); 
  };

  if (!products || products.length === 0) return null;

  return (
    <section className="w-full bg-white dark:bg-[#151515] rounded-md shadow-sm border border-slate-200 dark:border-slate-800 mb-4 overflow-hidden select-none">

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
          <Link href={viewAllLink} className="text-sm font-semibold text-[#FF6A00] hover:underline flex items-center gap-1 whitespace-nowrap outline-none">
            See All
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>

      {/* VERTICAL GRID CONTAINER (Capped at 6 items) */}
      <div className="p-3 sm:p-4">
        {/* 2 columns on mobile, 3 on tablet, 6 on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 pb-2">
          {products.slice(0, 6).map((p) => {
            const optimizedImage = p.images?.[0] ? optimizeImage(p.images[0]) : null;
            const isJustPosted = checkIsNew(p);
            const isSold = p.status === "sold";
            const isApproved = p.isApprovedQuality;
            const isOfficial = p.isOfficialStore || p.isAdminUpload;

            const titleStr = p.title || p.name || 'Product';
            const isShortTitle = titleStr.length <= 24;
            const displayTitle = (!isSold && isShortTitle) ? `${titleStr} (Ready)` : titleStr;

            return (
              // POLISHED CARDS: Full width of their grid cell, nicely rounded borders, premium shadow on hover
              <div 
                key={p.id} 
                className={`group w-full flex flex-col bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all hover:shadow-lg relative ${isSold ? 'opacity-80 grayscale-[20%]' : ''}`}
              >
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
                  {/* IMAGE AREA */}
                  <div className="relative aspect-square w-full bg-slate-100 dark:bg-slate-800 overflow-hidden border-b border-slate-100 dark:border-slate-800">
                    {optimizedImage ? (
                      <Image 
                        src={optimizedImage} 
                        alt={titleStr} 
                        fill 
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw" 
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
                      <div className={`absolute bottom-0 left-0 ${isApproved ? 'bg-emerald-600' : 'bg-[#FF6A00]'} text-white text-[8px] md:text-[9px] font-bold px-1.5 py-1 leading-none rounded-tr-md z-10 tracking-widest uppercase shadow-sm`}>
                         {isApproved ? 'Approved Quality' : 'Official Product'}
                      </div>
                    )}
                  </div>

                  {/* TEXT/DETAILS AREA */}
                  <div className="flex flex-col flex-grow p-3 sm:p-4 bg-white dark:bg-[#121212]">
                    <div className="mb-2 flex flex-col justify-start w-full">
                      {/* LIGHT GRAY & SINGLE LINE */}
                      <h3 className="text-xs sm:text-sm font-medium text-slate-400 dark:text-slate-500 truncate transition-colors duration-200 group-hover:text-[#FF6A00]">
                        {displayTitle}
                      </h3>
                    </div>

                    <div className="mt-auto pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col">
                      {/* GRAY PRICE */}
                      <span className={`text-sm sm:text-base font-black transition-colors duration-200 ${isSold ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-[#FF6A00]'}`}>
                        UGX {Number(p.price).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
