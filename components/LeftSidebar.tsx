"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";

export default function LeftSidebar() {
  const pathname = usePathname();
  const theme = useTheme();

  const categories = [
    { name: "Student Market", href: "/category/student_item" },
    { name: "Official Store", href: "/officialStore" },
    { name: "Ladies' Picks", href: "/ladies" },
    { name: "Electronics", href: "/category/electronics" },
    { name: "Agriculture", href: "/category/agriculture" },
    { name: "Fashion & Apparel", href: "/category/fashion" },
    { name: "Home & Furniture", href: "/category/home" },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <div className="w-full flex flex-col gap-4 select-none">
      
      {/* CATEGORIES WIDGET */}
      <div className="bg-white dark:bg-[#151515] rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#111]">
          <h3 className={`text-sm font-black uppercase tracking-wider ${theme.text}`}>
            Categories
          </h3>
        </div>
        <div className="flex flex-col py-2">
          {categories.map((cat) => (
            <Link 
              key={cat.name} 
              href={cat.href}
              className={`px-4 py-2 text-sm font-medium transition-colors flex items-center justify-between group ${
                isActive(cat.href) 
                  ? "text-[#D97706] bg-amber-50/50 dark:bg-[#D97706]/10 border-l-2 border-[#D97706]" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1a1a1a] hover:text-[#D97706] border-l-2 border-transparent"
              }`}
            >
              {cat.name}
              <svg className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ${isActive(cat.href) ? 'opacity-100' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </Link>
          ))}
        </div>
      </div>

      {/* PRICE FILTER WIDGET */}
      <div className="bg-white dark:bg-[#151515] rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#111]">
          <h3 className={`text-sm font-black uppercase tracking-wider ${theme.text}`}>
            Price Range (UGX)
          </h3>
        </div>
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              placeholder="Min" 
              className="w-full bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded px-3 py-2 outline-none focus:border-[#D97706] transition-colors"
            />
            <span className="text-slate-400">-</span>
            <input 
              type="number" 
              placeholder="Max" 
              className="w-full bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded px-3 py-2 outline-none focus:border-[#D97706] transition-colors"
            />
          </div>
          <button className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold uppercase tracking-wider py-2.5 rounded hover:bg-[#D97706] dark:hover:bg-[#D97706] dark:hover:text-white transition-colors">
            Apply Filter
          </button>
        </div>
      </div>

      {/* CONDITION FILTER WIDGET */}
      <div className="bg-white dark:bg-[#151515] rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#111]">
          <h3 className={`text-sm font-black uppercase tracking-wider ${theme.text}`}>
            Condition
          </h3>
        </div>
        <div className="p-4 flex flex-col gap-2.5">
          {["Brand New", "Refurbished", "Used - Like New", "Used - Fair"].map((condition) => (
            <label key={condition} className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center">
                <input type="checkbox" className="peer w-4 h-4 appearance-none border border-slate-300 dark:border-slate-600 rounded-sm checked:bg-[#D97706] checked:border-[#D97706] transition-colors cursor-pointer" />
                <svg className="absolute w-3 h-3 text-white left-0.5 top-0.5 opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                {condition}
              </span>
            </label>
          ))}
        </div>
      </div>

    </div>
  );
}
