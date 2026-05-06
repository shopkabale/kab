"use client";

import Link from "next/link";

export default function ThemedCategoryGrid() {
  const categories = [
    { 
      name: "Mega Bundles", 
      href: "/category/mega-bundles", 
      image: "https://images.unsplash.com/photo-1513885045260-6b3086b24c17?w=500&q=80" // Wrapped boxes/shopping
    },
    { 
      name: "Campus Life", 
      href: "/category/campus-life", 
      image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80" // Backpack/study
    },
    { 
      name: "Tech & Gadgets", 
      href: "/category/tech-appliances", 
      image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&q=80" // Laptop/desk
    },
    { 
      name: "Farm Fresh", 
      href: "/category/food-groceries", 
      image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80" // Vegetables/basket
    },
    { 
      name: "Beauty & Fashion", 
      href: "/category/beauty-fashion", 
      image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&q=80" // Makeup/beauty
    },
    { 
      name: "Repairs & Services", 
      href: "/category/repairs-services", 
      image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=500&q=80" // Tools/technician
    },
  ];

  return (
    // Clean "White Island" container
    <section className="bg-transparent sm:bg-white sm:dark:bg-[#151515] sm:rounded-md sm:shadow-sm sm:border border-slate-200 dark:border-slate-800 p-2 sm:p-4 mb-4 select-none">

      {/* Centered Heading following UI Rules */}
      <h2 style={{ color: '#1A1A1A' }} className="text-xl sm:text-2xl font-bold dark:text-white text-center mb-4 sm:mb-6 tracking-tight">
        Browse by category
      </h2>

      {/* Mobile: 3 columns (creates 2 rows for 6 items). 
          Desktop (md and up): 6 columns (forces all 6 items into 1 single line).
      */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4 w-full">
        {categories.map((cat) => (
          <Link key={cat.name} href={cat.href} className="group flex flex-col items-center outline-none">

            {/* Rectangular Image Container */}
            {/* aspect-[4/3] ensures a perfect horizontal rectangle shape regardless of screen size */}
            <div className="w-full aspect-[4/3] bg-slate-50 dark:bg-slate-800 rounded-md overflow-hidden mb-2 sm:mb-3 relative shadow-sm group-hover:shadow-md transition-all duration-300 border border-slate-100 dark:border-slate-700">
              <img 
                src={cat.image} 
                alt={cat.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            <span style={{ color: '#6B6B6B' }} className="text-[11px] sm:text-xs md:text-sm font-medium dark:text-slate-400 group-hover:text-[#FF6A00] dark:group-hover:text-[#FF6A00] transition-colors text-center leading-tight px-1">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}