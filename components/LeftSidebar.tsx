"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/components/AuthProvider";
import { 
  Trash2, 
  ShieldCheck, 
  ChevronRight, 
  ShoppingBag,
  PlusCircle,
  User,
  Wallet,
  GraduationCap,
  Flame,
  Sparkles,
  Monitor,
  Sprout,
  Shirt,
  Sofa,
  Store,
  Filter,
  XCircle
} from "lucide-react";

// Reusable Navigation Arrays
const categories = [
  { name: "Student Market", href: "/category/student_item", icon: GraduationCap },
  { name: "Official Store", href: "/officialStore", icon: Store },
  { name: "Ladies' Picks", href: "/ladies", icon: Shirt },
  { name: "Electronics", href: "/category/electronics", icon: Monitor },
  { name: "Agriculture", href: "/category/agriculture", icon: Sprout },
  { name: "Fashion & Apparel", href: "/category/fashion", icon: ShoppingBag },
  { name: "Home & Furniture", href: "/category/home", icon: Sofa },
];

const quickShopLinks = [
  { name: "Gadgets < 50k", href: "/category/electronics?max=50000", icon: Wallet },
  { name: "Student Gear < 100k", href: "/category/student_item?max=100000", icon: Wallet },
];

function LeftSidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { cart, removeFromCart, cartTotal } = useCart();
  const { user, signIn } = useAuth();

  // Extract query parameters for UI feedback
  const maxPrice = searchParams.get("max");
  const sortType = searchParams.get("sort");
  const hasActiveFilters = maxPrice || sortType;

  // Dynamically generate Smart Browse links based on current path
  const browseSmartLinks = [
    { name: "Top Rated / Popular", href: `${pathname}?sort=popular`, icon: Flame },
    { name: "New Arrivals", href: `${pathname}?sort=new`, icon: Sparkles },
  ];

  return (
    <div className="w-full flex flex-col gap-4 select-none">
      
      {/* 1. AUTH / WELCOME CARD */}
      <div className="bg-white dark:bg-[#151515] border border-slate-200 dark:border-slate-800 rounded-md shadow-sm p-4 flex items-center gap-3 transition-colors">
        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 overflow-hidden">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
          ) : (
            <User className="w-5 h-5 text-slate-400 dark:text-slate-500" />
          )}
        </div>
        <div className="flex flex-col flex-grow min-w-0">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">
            Welcome
          </span>
          {user ? (
            <span className="text-sm font-black text-slate-900 dark:text-white truncate">
              {user.displayName || "Shopper"}
            </span>
          ) : (
            <button 
              onClick={signIn} 
              className="text-sm font-black text-[#D97706] hover:text-amber-500 transition-colors text-left outline-none truncate"
            >
              Hello, Sign In
            </button>
          )}
        </div>
      </div>

      {/* 2. ACTIVE FILTERS FEEDBACK (Conditionally Rendered) */}
      {hasActiveFilters && (
        <div className="bg-amber-50 dark:bg-[#D97706]/10 border border-[#D97706]/30 rounded-md p-3 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-black text-[#D97706] uppercase tracking-[0.1em] flex items-center gap-1.5">
              <Filter className="w-3 h-3" />
              Active Filters
            </h3>
            <Link 
              href={pathname} 
              className="text-slate-400 hover:text-red-500 transition-colors"
              title="Clear all filters"
            >
              <XCircle className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex flex-col gap-1">
            {maxPrice && (
              <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                Under <span className="font-bold text-[#D97706]">UGX {Number(maxPrice).toLocaleString()}</span>
              </p>
            )}
            {sortType && (
              <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 capitalize">
                Sorted by: <span className="font-bold text-[#D97706]">{sortType}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* 3. QUICK SHOP & BROWSE SMART CARD */}
      <div className="bg-white dark:bg-[#151515] border border-slate-200 dark:border-slate-800 rounded-md shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
            Quick Shop
          </h3>
        </div>
        <div className="flex flex-col py-2">
          {quickShopLinks.map((link) => {
            const isExactMatch = searchParams.get("max") === new URLSearchParams(link.href.split('?')[1]).get("max");
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`px-4 py-2 text-[12px] font-semibold transition-all flex items-center gap-3 group outline-none ${
                  isExactMatch 
                    ? "text-[#D97706] bg-amber-50 dark:bg-[#D97706]/10 border-l-2 border-[#D97706]" 
                    : "text-slate-600 dark:text-slate-300 hover:text-[#D97706] hover:bg-slate-50 dark:hover:bg-slate-800 border-l-2 border-transparent"
                }`}
              >
                <link.icon className="w-4 h-4 text-slate-400 group-hover:text-[#D97706] transition-colors" />
                <span className="truncate">{link.name}</span>
              </Link>
            )
          })}
        </div>

        <div className="px-4 py-2 border-y border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
            Smart Browse
          </h3>
        </div>
        <div className="flex flex-col py-2">
           {browseSmartLinks.map((link) => {
            const isActiveSort = searchParams.get("sort") === new URLSearchParams(link.href.split('?')[1]).get("sort");
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`px-4 py-2 text-[12px] font-semibold transition-all flex items-center gap-3 group outline-none ${
                  isActiveSort 
                    ? "text-[#D97706] bg-amber-50 dark:bg-[#D97706]/10 border-l-2 border-[#D97706]" 
                    : "text-slate-600 dark:text-slate-300 hover:text-[#D97706] hover:bg-slate-50 dark:hover:bg-slate-800 border-l-2 border-transparent"
                }`}
              >
                <link.icon className="w-4 h-4 text-slate-400 group-hover:text-[#D97706] transition-colors" />
                <span className="truncate">{link.name}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* 4. MAIN CATEGORIES CARD */}
      <div className="bg-white dark:bg-[#151515] border border-slate-200 dark:border-slate-800 rounded-md shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
            Categories
          </h3>
        </div>
        <nav className="flex flex-col py-2">
          {categories.map((cat) => {
            const isActive = pathname === cat.href;
            return (
              <Link
                key={cat.name}
                href={cat.href}
                className={`px-4 py-2.5 text-sm font-semibold transition-all flex items-center justify-between group outline-none ${
                  isActive 
                    ? "text-[#D97706] bg-amber-50 dark:bg-[#D97706]/10 border-r-4 border-[#D97706]" 
                    : "text-slate-600 dark:text-slate-300 hover:text-[#D97706] hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <cat.icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? "text-[#D97706]" : "text-slate-400 group-hover:text-[#D97706]"}`} />
                  <span className="truncate">{cat.name}</span>
                </div>
                <ChevronRight className={`w-3 h-3 shrink-0 transition-transform ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-hover:translate-x-1"}`} />
              </Link>
            );
          })}
        </nav>
      </div>

      {/* 5. PERMANENT MINI CART CARD */}
      <div className="bg-white dark:bg-[#151515] border border-slate-200 dark:border-slate-800 rounded-md shadow-sm overflow-hidden transition-all">
         <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
          <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
            Shopping Cart
          </h3>
          {cart.length > 0 && (
            <span className="bg-[#D97706] text-white text-[10px] font-black px-2 py-0.5 rounded-sm shadow-sm">
              {cart.length}
            </span>
          )}
        </div>
        <div className="p-4">
          {cart.length === 0 ? (
            <div className="text-center py-6 flex flex-col items-center">
              <ShoppingBag className="w-8 h-8 text-slate-200 dark:text-slate-700 mb-3" />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em]">Cart is Empty</p>
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="flex flex-col gap-3 max-h-[200px] overflow-y-auto no-scrollbar mb-4 pr-1">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-3 items-center group relative bg-white dark:bg-[#151515] hover:bg-slate-50 dark:hover:bg-slate-900 p-1 -mx-1 rounded-md transition-colors">
                    <div className="w-10 h-10 bg-slate-50 dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="max-h-full object-contain p-0.5" />
                      ) : (
                        <ShoppingBag className="w-4 h-4 text-slate-300" />
                      )}
                    </div>
                    <div className="flex flex-col flex-grow min-w-0 pr-6">
                      <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">{item.title}</p>
                      <p className="text-[10px] font-black text-[#D97706] tracking-tight">
                        UGX {item.price.toLocaleString()}
                      </p>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="absolute right-1 text-slate-300 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100 bg-white dark:bg-slate-900 rounded-full shadow-sm"
                      title="Remove Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">UGX {cartTotal.toLocaleString()}</span>
                </div>
                <Link href="/cart" className="w-full bg-[#D97706] hover:bg-amber-600 text-white text-[11px] font-black uppercase tracking-[0.2em] py-3.5 rounded-sm flex items-center justify-center transition-all shadow-sm active:scale-[0.98]">
                  Complete Order
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 6. MERCHANT CTA CARD */}
      <Link href="/sell" className="group bg-slate-900 dark:bg-black border border-slate-800 rounded-md shadow-lg overflow-hidden relative p-5 flex flex-col hover:border-[#D97706] transition-all outline-none">
        <div className="absolute -right-2 -top-2 opacity-10 group-hover:opacity-20 transition-opacity">
          <PlusCircle className="w-20 h-20 text-white" />
        </div>
        <h3 className="text-xs font-black text-white mb-2 uppercase tracking-[0.1em]">Become a Seller</h3>
        <p className="text-[11px] text-slate-400 font-medium mb-4 leading-relaxed">
          Reach thousands of local buyers instantly.
        </p>
        <div className="flex items-center gap-2 text-[10px] font-black text-[#D97706] uppercase tracking-widest transition-colors group-hover:text-amber-400">
          Open Shop
          <PlusCircle className="w-3 h-3" />
        </div>
      </Link>

      {/* 7. PAYMENT SECURITY CARD */}
      <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-md p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-[#D97706] w-4 h-4 shrink-0" />
          <h3 className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Secure Portal</h3>
        </div>
        <div className="flex flex-col gap-2.5">
           <div className="flex items-center gap-1.5">
             <div className="h-4 w-6 rounded-sm bg-slate-200 dark:bg-slate-700 animate-ug-black"></div>
             <div className="h-4 w-6 rounded-sm bg-slate-200 dark:bg-slate-700 animate-ug-yellow"></div>
             <div className="h-4 w-6 rounded-sm bg-slate-200 dark:bg-slate-700 animate-ug-red"></div>
           </div>
           <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
             Encrypted Mobile Money checkout powered by <span className="text-slate-900 dark:text-white">Kabale Online Pay</span>.
           </p>
        </div>
      </div>

      <style jsx global>{`
        .animate-ug-black { animation: pulseBlack 2s infinite ease-in-out; }
        .animate-ug-yellow { animation: pulseYellow 2s infinite ease-in-out 0.3s; }
        .animate-ug-red { animation: pulseRed 2s infinite ease-in-out 0.6s; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        @keyframes pulseBlack {
          0%, 100% { background-color: #cbd5e1; }
          50% { background-color: #0f172a; }
        }
        @keyframes pulseYellow {
          0%, 100% { background-color: #cbd5e1; }
          50% { background-color: #eab308; }
        }
        @keyframes pulseRed {
          0%, 100% { background-color: #cbd5e1; }
          50% { background-color: #dc2626; }
        }

        @media (prefers-color-scheme: dark) {
          @keyframes pulseBlack {
            0%, 100% { background-color: #334155; }
            50% { background-color: #000000; }
          }
          @keyframes pulseYellow {
            0%, 100% { background-color: #334155; }
            50% { background-color: #eab308; }
          }
          @keyframes pulseRed {
            0%, 100% { background-color: #334155; }
            50% { background-color: #dc2626; }
          }
        }
      `}</style>
    </div>
  );
}

// Wrap in Suspense to prevent useSearchParams from de-opting the entire route to client-side rendering
export default function LeftSidebar() {
  return (
    <Suspense fallback={<div className="w-full h-[800px] bg-slate-50 dark:bg-slate-900/50 animate-pulse rounded-md" />}>
      <LeftSidebarContent />
    </Suspense>
  );
}
