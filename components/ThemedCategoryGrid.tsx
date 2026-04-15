"use client";

import Link from "next/link";

export default function ThemedCategoryGrid() {
  const categories = [
    { name: "Verified Premium", href: "/officialStore", image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500&q=80" },
    { name: "Her Glow Up", href: "/ladies", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&q=80" },
    { name: "Tech & Gadgets", href: "/category/electronics", image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&q=80" },
    { name: "Campus Survival", href: "/category/student_item", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80" },
    { name: "Farm Fresh", href: "/category/agriculture", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80" },
    { name: "Just Dropped", href: "/products", image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=500&q=80" },
  ];

  return (
    // Clean white container, subtle shadow, no heavy theme colors
    <section className="bg-white dark:bg-[#151515] rounded-md shadow-sm border border-slate-200 dark:border-slate-800 p-4 mb-2">
      
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-4 w-full">
        {categories.map((cat) => (
          <Link key={cat.name} href={cat.href} className="group flex flex-col items-center outline-none">
            {/* Circular or soft-rounded images are better for categories than sharp squares */}
            <div className="w-[70px] h-[70px] md:w-[90px] md:h-[90px] bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden mb-3 relative shadow-sm group-hover:shadow-md transition-all duration-300 border border-slate-100 dark:border-slate-700">
              <img 
                src={cat.image} 
                alt={cat.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            
            <span className="text-[11px] sm:text-xs md:text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-[#D97706] transition-colors text-center leading-tight">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
