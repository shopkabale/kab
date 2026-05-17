"use client";

import Link from "next/link";
import ProductCard from "./ProductCard"; // Adjust path if your ProductCard is elsewhere

export default function ProductSection({ 
  title, 
  subtitle, 
  products, 
  hideTitle,
  viewAllLink
}: { 
  title?: string, 
  subtitle?: string, 
  products: any[], 
  hideTitle?: boolean,
  viewAllLink?: string
}) {
  if (!products || products.length === 0) return null;

  return (
    <section className="w-full bg-white dark:bg-[#151515] rounded-md shadow-sm border border-slate-200 dark:border-slate-800 mb-4 overflow-hidden select-none">

      {/* HEADER AREA */}
      {!hideTitle && title && (
        <div className="flex justify-between items-center p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col">
            <h2 style={{ color: '#1A1A1A' }} className="text-base sm:text-lg md:text-xl font-bold dark:text-white capitalize tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p style={{ color: '#6B6B6B' }} className="text-[10px] sm:text-xs font-medium mt-0.5 dark:text-slate-400">
                {subtitle}
              </p>
            )}
          </div>

          {/* VIEW ALL LINK */}
          {viewAllLink && (
            <Link href={viewAllLink} className="text-sm font-semibold text-[#FF6A00] hover:underline flex items-center gap-1 whitespace-nowrap outline-none">
              See All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      )}

      {/* VERTICAL GRID AREA */}
      <div className="p-3 sm:p-4">
        {/* The grid layout manages the columns automatically based on screen size */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
      
    </section>
  );
}
