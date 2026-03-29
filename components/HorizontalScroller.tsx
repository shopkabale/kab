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
    <div className="w-full overflow-hidden mb-6">
      <div className="w-full max-w-7xl mx-auto px-4 mb-4">
        <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
          {title}
        </h2>
      </div>
      
      {/* Scrollable Container */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-2 sm:gap-4 overflow-x-auto snap-x no-scrollbar px-4 pb-4 w-full items-stretch"
      >
        {products.map((p) => {
          const optimizedImage = p.images?.[0] ? optimizeImage(p.images[0]) : null;
          const isJustPosted = checkIsNew(p);

          return (
            <div key={p.id} className="snap-start shrink-0 w-[160px] sm:w-[220px] group flex flex-col bg-white dark:bg-[#151515] rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-lg transition-all h-full relative">

              <Link href={`/product/${p.publicId || p.id}`} className="flex flex-col flex-grow">
                {/* Image Area */}
                <div className="relative aspect-[4/5] rounded-t-lg overflow-hidden bg-slate-100 dark:bg-slate-900">
                  {optimizedImage ? (
                    <Image 
                      src={optimizedImage} 
                      alt={p.title || p.name || 'Product'} 
                      fill 
                      sizes="(max-width: 768px) 50vw, 20vw" 
                      className="object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="m-auto flex items-center justify-center h-full text-[10px] font-bold text-slate-400 uppercase">No Image</div>
                  )}

                  {/* Conditional "Just Posted" Overlay */}
                  {isJustPosted && (
                    <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                       <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                       New
                    </div>
                  )}
                </div>

                {/* Details Area */}
                <div className="p-2.5 flex flex-col flex-grow">
                  {/* 🔥 ADDED: h-[36px] forces this to ALWAYS be exactly 2 lines tall */}
                  <h3 className="text-[13px] md:text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-tight mb-1.5 group-hover:text-[#D97706] transition-colors h-[36px]">
                    {p.title || p.name}
                  </h3>
                  <div className="mt-auto">
                    <span className="text-[15px] md:text-base font-black text-[#D97706] dark:text-yellow-500">
                      UGX {Number(p.price).toLocaleString()}
                    </span>
                  </div>
                </div>
              </Link>

              {/* Bottom Quick Actions */}
              <div className="grid grid-cols-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#111] mt-auto">
                 <a 
                   href={`https://wa.me/256740373021?text=${encodeURIComponent(`Hi! I am interested in this item on Kabale Online: *${p.title || p.name}*\n\nProduct ID: [${p.id}]`)}`}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="col-span-3 py-2.5 border-r border-slate-200 dark:border-slate-800 bg-white hover:bg-[#25D366] dark:bg-[#151515] text-slate-900 dark:text-white hover:text-white text-[11px] font-black uppercase flex justify-center items-center gap-1.5 transition-colors group/wa"
                 >
                   <svg className="hidden sm:block w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#25D366] group-hover/wa:text-white transition-colors shrink-0" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                   </svg>
                   <span>WhatsApp</span>
                 </a>
                 <button className="col-span-1 py-2.5 bg-white dark:bg-[#151515] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500 flex justify-center items-center transition-colors">
                   <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                 </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="max-w-7xl mx-auto px-4 mt-2">
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
