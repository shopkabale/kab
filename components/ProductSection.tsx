"use client";

import Link from "next/link";
import Image from "next/image";
import { optimizeImage } from "@/lib/utils";
import { trackSelectItem } from "@/lib/analytics"; 
import { useTheme } from "@/components/ThemeProvider"; // 🔥 IMPORT THEME PROVIDER

export default function ProductSection({ 
  title, 
  subtitle, // 🔥 ADDED SUBTITLE PROP
  products, 
  hideTitle 
}: { 
  title?: string, 
  subtitle?: string, 
  products: any[], 
  hideTitle?: boolean 
}) {
  const theme = useTheme(); // 🔥 GET CURRENT DAY THEME

  if (!products || products.length === 0) return null;

  // Helper to dynamically check if an item is less than 7 days old
  const checkIsNew = (p: any) => {
    const pDate = p.createdAt?.seconds ? p.createdAt.seconds * 1000 : new Date(p.createdAt || 0).getTime();
    return pDate > 0 && (Date.now() - pDate) < (7 * 24 * 60 * 60 * 1000); 
  };

  return (
    // ✅ Let parent control spacing
    <div className="w-full">

      {/* 🔥 DYNAMIC THEMED HEADER WITH SUBTITLE */}
      {!hideTitle && title && (
        <div className={`w-full ${theme.bg} ${theme.border} px-3 sm:px-4 py-2 sm:py-3 mb-2 flex items-center justify-between transition-colors duration-500`}>
          <div className="flex flex-col">
            <h2 className={`text-base md:text-lg font-black ${theme.text} capitalize tracking-tight transition-colors duration-500`}>
              {title}
            </h2>
            {subtitle && (
              <p className={`text-[10px] sm:text-xs ${theme.text} opacity-90 font-bold tracking-wide mt-0.5`}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ✅ Perfect consistent Jumia gap */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
        {products.map((p) => {
          const optimizedImage = p.images?.[0] ? optimizeImage(p.images[0]) : null;
          const isJustPosted = checkIsNew(p);
          const isSold = p.status === "sold";

          // Badge Logic
          const isApproved = p.isApprovedQuality;
          const isOfficial = p.isOfficialStore || p.isAdminUpload;

          // The subtle "Ready for delivery" psychological append
          const titleStr = p.title || p.name || 'Product';
          const isShortTitle = titleStr.length <= 24;
          const displayTitle = (!isSold && isShortTitle) ? `${titleStr} (Ready for delivery)` : titleStr;

          return (
            // Added opacity-80 if sold to subtly fade the card
            <div key={p.id} className={`group flex flex-col bg-white dark:bg-[#151515] rounded-sm overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 dark:border dark:border-slate-800 h-full relative ${isSold ? 'opacity-80 grayscale-[20%]' : ''}`}>

              <Link 
                href={`/product/${p.publicId || p.id}`} 
                className="flex flex-col flex-grow relative pointer-events-auto outline-none"
                onClick={() => {
                  trackSelectItem({
                    id: p.id,
                    name: titleStr, 
                    price: Number(p.price) || 0,
                    category: p.category || "general",
                  });
                }}
              >
                {/* Image Area: Strict square for uniform alignment */}
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
                    <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-sm flex items-center gap-1 z-10">
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
                  <div className="h-[36px] sm:h-[42px] mb-1 flex flex-col justify-start">
                    <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 line-clamp-2 leading-snug transition-colors duration-200 group-hover:text-[#D97706] dark:group-hover:text-[#D97706]">
                      {displayTitle}
                    </h3>
                  </div>

                  <div className="mt-auto pt-1 flex flex-col">
                    <span className={`text-sm sm:text-base font-black transition-colors duration-200 ${isSold ? 'text-slate-500' : 'text-black dark:text-white group-hover:text-[#D97706] dark:group-hover:text-[#D97706]'}`}>
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
  )
}
