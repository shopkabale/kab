"use client";

import Link from "next/link";

export default function ThemedCategoryGrid() {
  const categories = [
    { 
      name: "Watches", 
      href: "/category/watches", 
      image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=500&q=80" // Sleek wristwatch
    },
    { 
      name: "Phones & TVs", 
      href: "/category/phones-tvs", 
      image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&q=80" // Modern smartphone
    },
    { 
      name: "Sound Systems", 
      href: "/category/sound-systems", 
      image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500&q=80" // Premium speaker
    },
    { 
      name: "Accessories", 
      href: "/category/accessories", 
      image: "https://images.unsplash.com/photo-1572569438061-9d11fc7b14d5?w=500&q=80" // Earbuds / Tech accessories
    },
    { 
      name: "Appliances", 
      href: "/category/appliances", 
      image: "https://images.unsplash.com/photo-1588854337115-1c67d9247e4d?w=500&auto=format&fit=crop&q=80&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8YXBwbGlhbmNlfGVufDB8fDB8fHww" // Modern home appliances
    },
    { 
      name: "Other Products", 
      href: "/products", 
      image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=500&q=80" // Store/Lifestyle collection
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
