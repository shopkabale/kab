"use client";

import Image from "next/image";
import Link from "next/link";
import { optimizeImage } from "@/lib/utils";
import { trackSelectItem } from "@/lib/analytics"; 

export default function ProductCard({ product }: { product: any }) {
  // 1. Helper Logic
  const checkIsNew = (p: any) => {
    const pDate = p.createdAt?.seconds ? p.createdAt.seconds * 1000 : new Date(p.createdAt || 0).getTime();
    return pDate > 0 && (Date.now() - pDate) < (7 * 24 * 60 * 60 * 1000); 
  };

  const optimizedImage = product.images?.[0] ? optimizeImage(product.images[0]) : null;
  const isJustPosted = checkIsNew(product);
  const isSold = product.status === "sold";
  const isApproved = product.isApprovedQuality;
  const isOfficial = product.isOfficialStore || product.isAdminUpload;
  
  const titleStr = product.title || product.name || 'Product';
  
  // 2. Short Title Logic
  // If the title is short enough (e.g., "iPhone 13 Pro"), it likely only takes up 1 line.
  // Appending this text fills the 2nd line nicely and acts as a great conversion booster.
  const isShortTitle = titleStr.length <= 22;
  const displayTitle = (!isSold && isShortTitle) 
    ? `${titleStr} (Free delivery available)` 
    : titleStr;

  return (
    <div 
      className={`group flex flex-col h-full bg-white dark:bg-[#121212] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-[#FF6A00]/40 relative ${isSold ? 'opacity-75 grayscale-[30%]' : ''}`}
    >
      <Link 
        href={`/product/${product.publicId || product.id}`} 
        className="flex flex-col h-full outline-none"
        onClick={() => {
          if (typeof trackSelectItem === "function") {
            trackSelectItem({
              id: product.id,
              name: titleStr, 
              price: Number(product.price) || 0,
              category: product.category || "electronics",
            });
          }
        }}
      >
        {/* ======================= */}
        {/* TOP: IMAGE & BADGES     */}
        {/* ======================= */}
        <div className="relative aspect-square w-full bg-slate-50 dark:bg-[#0a0a0a] overflow-hidden">
          {optimizedImage ? (
            <Image 
              src={optimizedImage} 
              alt={titleStr} 
              fill 
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw" 
              className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase">
              No Image
            </div>
          )}

          {/* Sold Out Overlay */}
          {isSold && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-[2px]">
               <span className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] sm:text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded shadow-lg transform -rotate-12">
                 Sold Out
               </span>
            </div>
          )}

          {/* New Arrival Badge (Shrunk down & tucked in corner) */}
          {!isSold && isJustPosted && (
            <div className="absolute top-1.5 left-1.5 bg-slate-900/90 backdrop-blur-sm text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-1 z-10 shadow-sm">
               <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
               NEW
            </div>
          )}

          {/* Trust Badges (Changed from a full-width bar to a tiny floating pill at the bottom) */}
          {!isSold && (isApproved || isOfficial) && (
            <div className={`absolute bottom-1.5 left-1.5 rounded-sm ${isApproved ? 'bg-emerald-600/95' : 'bg-[#FF6A00]/95'} backdrop-blur-sm text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 leading-none z-10 tracking-widest uppercase shadow-sm`}>
               {isApproved ? 'Verified Quality' : 'Official Store'}
            </div>
          )}
        </div>

        {/* ======================= */}
        {/* BOTTOM: TEXT & DETAILS  */}
        {/* ======================= */}
        <div className="flex flex-col flex-grow p-3 sm:p-4">
          
          {/* Category / Meta */}
          <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 truncate">
            {product.category?.replace('-', ' ') || 'Electronics'}
          </span>

          {/* Title with line-clamp */}
          <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-2 leading-tight mb-3 group-hover:text-[#FF6A00] transition-colors">
            {displayTitle}
          </h3>

          {/* Price (Pushed to bottom using mt-auto) */}
          <div className="mt-auto pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
            <span className={`text-sm sm:text-base font-black ${isSold ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white group-hover:text-[#FF6A00]'} transition-colors`}>
              UGX {Number(product.price).toLocaleString()}
            </span>
            
            {/* Subtle View Button Icon (Appears on hover) */}
            {!isSold && (
              <div className="w-6 h-6 rounded-full bg-orange-50 dark:bg-orange-500/10 text-[#FF6A00] flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
              </div>
            )}
          </div>
          
        </div>
      </Link>
    </div>
  );
}
