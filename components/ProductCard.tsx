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

  // Check if the price is 0 (Negotiable)
  const isNegotiable = Number(product.price) === 0;

  const titleStr = product.title || product.name || 'Product';

  // 2. Short Title Logic
  const isShortTitle = titleStr.length <= 32;
  const displayTitle = (!isSold && isShortTitle) 
    ? `${titleStr} (Free delivery available)` 
    : titleStr;

  // ==========================================
  // 🔥 DYNAMIC STOCK BAR LOGIC
  // ==========================================
  // Safely grab stock. If it doesn't exist, assume it's full (10)
  const rawStock = product.stock !== undefined && product.stock !== null ? Number(product.stock) : 10;
  const safeStock = isNaN(rawStock) ? 10 : Math.max(0, rawStock);
  const maxStock = 10;
  
  // Calculate width (capped at 100%)
  const stockWidth = Math.min(100, (safeStock / maxStock) * 100);

  // Determine Color based on your exact logic
  let stockColorClass = "bg-green-500"; // 7 - 10
  if (safeStock <= 6) stockColorClass = "bg-amber-500"; // 4 - 6
  if (safeStock <= 3) stockColorClass = "bg-red-500"; // 1 - 3

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
        <div className="relative aspect-square w-full bg-slate-50 dark:bg-[#0a0a0a] overflow-hidden border-b border-slate-100 dark:border-slate-800/60">
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

          {/* New Arrival Badge */}
          {!isSold && isJustPosted && (
            <div className="absolute top-0 left-0 bg-slate-900/90 backdrop-blur-sm text-white text-[8px] sm:text-[9px] font-bold px-2 py-1 rounded-br-lg flex items-center gap-1 z-10">
               <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
               NEW
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

          {/* Wrapper to push bottom items to the bottom of the card */}
          <div className="mt-auto flex flex-col gap-3">
            
            {/* 🔥 NEW: VISUAL STOCK BAR */}
            {!isSold && (
              <div className="flex flex-col gap-1.5 w-full">
                <div className="w-full h-[5px] bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ease-out ${stockColorClass}`} 
                    style={{ width: `${stockWidth}%` }}
                  />
                </div>
                <span className="text-[9.5px] font-bold text-slate-500 dark:text-slate-400 tracking-wide">
                  {safeStock > 0 ? `Only ${safeStock} item${safeStock !== 1 ? 's' : ''} left` : 'Out of stock'}
                </span>
              </div>
            )}

            {/* Price Line */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
              <span className={`text-sm sm:text-base font-black ${isSold ? 'text-slate-400 line-through' : isNegotiable ? 'text-[#FF6A00]' : 'text-slate-900 dark:text-white group-hover:text-[#FF6A00]'} transition-colors`}>
                {isNegotiable ? "Negotiable" : `UGX ${Number(product.price).toLocaleString()}`}
              </span>

              {/* View Button Icon */}
              {!isSold && (
                <div className="w-6 h-6 rounded-full bg-orange-50 dark:bg-orange-500/10 text-[#FF6A00] flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                </div>
              )}
            </div>
            
          </div>
        </div>
      </Link>
    </div>
  );
}
