"use client";

import Link from "next/link";
import Image from "next/image";
import { optimizeImage } from "@/lib/utils";
import { trackSelectItem } from "@/lib/analytics";
import { MdVerifiedUser } from "react-icons/md";
import { Package } from "lucide-react";

interface BundleScrollerProps {
  title: string;
  subtitle?: string;
  products: any[];
  viewAllLink?: string;
}

export default function BundleScroller({ title, subtitle, products, viewAllLink }: BundleScrollerProps) {
  if (!products || products.length === 0) return null;

  return (
    <section className="w-full bg-white dark:bg-[#151515] rounded-md shadow-sm border border-slate-200 dark:border-slate-800 mb-4 overflow-hidden select-none">
      
      {/* HEADER */}
      <div className="flex justify-between items-center p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-col">
          <h2 style={{ color: '#1A1A1A' }} className="text-base sm:text-lg md:text-xl font-bold dark:text-white capitalize tracking-tight flex items-center gap-2">
            {title}
          </h2>
          {subtitle && (
            <p style={{ color: '#6B6B6B' }} className="text-[10px] sm:text-xs font-medium mt-0.5 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>

        {viewAllLink && (
          <Link href={viewAllLink} className="text-sm font-semibold text-[#FF6A00] hover:underline flex items-center gap-1 whitespace-nowrap outline-none">
            See All
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>

      {/* HORIZONTAL SCROLL CONTAINER */}
      <div className="p-3 sm:p-4 relative">
        <div className="flex overflow-x-auto gap-3 sm:gap-4 pb-4 snap-x snap-mandatory no-scrollbar">
          {products.map((p) => {
            const optimizedImage = p.images?.[0] ? optimizeImage(p.images[0]) : null;
            const titleStr = p.title || p.name || 'Mega Bundle';
            const isOfficial = p.isOfficialStore || p.isAdminUpload;

            return (
              <div 
                key={p.id} 
                className="group flex-none w-[200px] sm:w-[240px] snap-start bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col hover:shadow-lg transition-all relative"
              >
                <Link 
                  href={`/product/${p.publicId || p.id}`} 
                  className="flex flex-col flex-grow relative pointer-events-auto outline-none"
                  onClick={() => trackSelectItem({ id: p.id, name: titleStr, price: Number(p.price) || 0, category: "bundles" })}
                >
                  {/* WIDE IMAGE (Slim & Tall Portrait Aspect Ratio just like Services) */}
                  <div className="relative aspect-[3/4] w-full bg-slate-100 dark:bg-slate-800 overflow-hidden border-b border-slate-100 dark:border-slate-800">
                    {optimizedImage ? (
                      <Image 
                        src={optimizedImage} 
                        alt={titleStr} 
                        fill 
                        sizes="(max-width: 768px) 200px, 240px" 
                        // Changed to object-cover so bundle spreads fill the whole tall frame beautifully
                        className="object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-400 uppercase">No Image</div>
                    )}
                    
                    {/* BUNDLE BADGE */}
                    <div className="absolute top-2 left-2 bg-[#FF6A00]/90 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-1 rounded-md flex items-center gap-1 z-10 uppercase tracking-wide shadow-sm">
                       <Package className="w-3 h-3" />
                       Combo Pack
                    </div>
                  </div>

                  {/* BUNDLE DETAILS */}
                  <div className="p-3 sm:p-4 flex flex-col flex-grow bg-white dark:bg-[#121212]">
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-[10px] font-bold text-[#FF6A00] uppercase tracking-wider line-clamp-1 flex items-center gap-1">
                        {p.sellerName || "Official Store"} 
                        {isOfficial && <MdVerifiedUser className="text-blue-500 text-xs" />}
                      </span>
                    </div>

                    <h3 style={{ color: '#1A1A1A' }} className="text-sm font-bold dark:text-slate-200 line-clamp-2 leading-snug mb-3 group-hover:text-[#FF6A00] transition-colors">
                      {titleStr}
                    </h3>

                    <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex flex-col">
                        <span style={{ color: '#6B6B6B' }} className="text-[10px] uppercase font-bold dark:text-slate-500">Bundle Deal</span>
                        <span style={{ color: '#1A1A1A' }} className="text-sm font-black dark:text-white group-hover:text-[#FF6A00] transition-colors">
                          UGX {Number(p.price).toLocaleString()}
                        </span>
                      </div>
                      
                      <span className="bg-[#FF6A00] text-white text-[10px] font-bold px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity whitespace-nowrap">
                        Grab Deal
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
