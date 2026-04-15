import Link from "next/link";

export default function FilterPills() {
  const filters = [
    { label: "Under 50k", href: "/products?maxPrice=50000" },
    { label: "Top Rated", href: "/products?sort=rating" },
    { label: "Same Day Delivery", href: "/products?delivery=sameday" },
    { label: "Campus Deals", href: "/category/student_item" },
  ];

  return (
    // Outer wrapper is now fully transparent with no borders
    <div className="w-full bg-transparent pb-3 px-4 mb-2 select-none">
      
      {/* md:justify-center dynamically centers the items on larger screens. 
        On mobile, it defaults to flex-start and allows horizontal scrolling.
      */}
      <div className="flex justify-start md:justify-center overflow-x-auto no-scrollbar gap-2 sm:gap-3 pb-1 w-full" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {filters.map((filter) => (
          <Link 
            key={filter.label} 
            href={filter.href}
            // Pills themselves use a solid white background to pop against the global blue gradient
            className="whitespace-nowrap px-4 py-2 bg-white hover:bg-slate-50 dark:bg-[#151515] dark:hover:bg-[#1a1a1a] text-slate-700 dark:text-slate-300 hover:text-[#D97706] dark:hover:text-[#D97706] text-[11px] sm:text-xs font-bold rounded-full border border-slate-200 dark:border-slate-800 transition-colors shadow-sm outline-none"
          >
            {filter.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
