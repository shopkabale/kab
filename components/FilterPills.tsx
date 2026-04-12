import Link from "next/link";

export default function FilterPills() {
  const filters = [
    { label: "🔥 Under 50k", href: "/products?maxPrice=50000" },
    { label: "⭐ Top Rated", href: "/products?sort=rating" },
    { label: "⚡ Same Day Delivery", href: "/products?delivery=sameday" },
    { label: "🎓 Campus Deals", href: "/category/student_item" },
  ];

  return (
    <div className="w-full bg-white dark:bg-[#111] border-b border-slate-100 dark:border-slate-800 pb-3 px-4">
      <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1">
        {filters.map((filter) => (
          <Link 
            key={filter.label} 
            href={filter.href}
            className="whitespace-nowrap px-4 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-[11px] sm:text-xs font-bold rounded-full border border-slate-200 dark:border-slate-800 transition-colors shadow-sm"
          >
            {filter.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
