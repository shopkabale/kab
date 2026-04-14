"use client";

import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";

export default function ThemedCategoryGrid() {
  const theme = useTheme();

  const categories = [
    { name: "Verified Premium", href: "/officialStore", image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500&q=80" },
    { name: "Her Glow Up", href: "/ladies", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&q=80" },
    { name: "Tech & Gadgets", href: "/category/electronics", image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&q=80" },
    { name: "Campus Survival", href: "/category/student_item", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80" },
    { name: "Farm Fresh", href: "/category/agriculture", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80" },
    { name: "Just Dropped", href: "/products", image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=500&q=80" },
  ];

  return (
    // DYNAMIC THEMED BACKGROUND & BORDER
    <section className={`${theme.bg} ${theme.border} border-y py-4 px-3 sm:px-4 mb-2 transition-colors duration-500`}>
      <div className="w-full text-center py-2 mb-1">
        <h2 className={`text-base md:text-lg font-black ${theme.text} capitalize tracking-tight transition-colors duration-500`}>
          Browse Our Top Collections
        </h2>
      </div>

      {/* Grid updated: 3 columns on mobile, expanding to 6 columns on large screens */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 max-w-6xl mx-auto mt-2">
        {categories.map((cat) => (
          <Link key={cat.name} href={cat.href} className="group flex flex-col outline-none">
            <div className="w-full aspect-square bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-1.5 relative shadow-sm group-hover:shadow-md transition-all duration-300">
              <img 
                src={cat.image} 
                alt={cat.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            {/* Base text uses the theme text, hovers to your brand orange */}
            <span className={`text-[10px] sm:text-xs md:text-sm font-bold ${theme.text} group-hover:text-[#D97706] transition-colors leading-snug text-center`}>
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
