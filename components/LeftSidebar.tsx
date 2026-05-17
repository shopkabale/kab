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
  Flame,
  Sparkles,
  Store,
  Filter,
  XCircle,
  Watch,
  Smartphone,
  Speaker,
  Headphones,
  Plug,
  Package,
  Truck,
  Lock,
  PhoneCall,
  Award,
  Tag
} from "lucide-react";

// ==========================================
// UPDATED ELECTRONICS CATEGORIES
// ==========================================
const categories = [
  { name: "Verified Premium", href: "/officialStore", icon: Store },
  { name: "Watches", href: "/category/watches", icon: Watch },
  { name: "Phones & TVs", href: "/category/phones-tvs", icon: Smartphone },
  { name: "Sound Systems", href: "/category/sound-systems", icon: Speaker },
  { name: "Accessories", href: "/category/accessories", icon: Headphones },
  { name: "Appliances", href: "/category/appliances", icon: Plug },
  { name: "Other Products", href: "/category/other-products", icon: Package },
];

const quickShopLinks = [
  { name: "Accessories < 50k", href: "/category/accessories?max=50000", icon: Wallet },
  { name: "Phones & TVs < 500k", href: "/category/phones-tvs?max=500000", icon: Wallet },
];

const promotionalBanners = [
  { text: "Discover timeless watches", href: "/category/watches", icon: "⌚" },
  { text: "Upgrade to the latest phones", href: "/category/phones-tvs", icon: "📱" },
  { text: "Experience premium sound", href: "/category/sound-systems", icon: "🔊" },
  { text: "Shop essential accessories", href: "/category/accessories", icon: "🎧" },
  { text: "Upgrade your appliances", href: "/category/appliances", icon: "🔌" },
];

function LeftSidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { cart, removeFromCart, cartTotal } = useCart();
  const { user, signIn } = useAuth();

  const maxPrice = searchParams.get("max");
  const sortType = searchParams.get("sort");
  const hasActiveFilters = maxPrice || sortType;

  const basePath = pathname === '/' ? '/products' : pathname;

  const browseSmartLinks = [
    { name: "Top Rated / Popular", href: `${basePath}?sort=popular`, icon: Flame },
    { name: "New Arrivals", href: `${basePath}?sort=new`, icon: Sparkles },
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
          <span style={{ color: '#6B6B6B' }} className="text-[9px] font-black uppercase tracking-[0.2em] mb-0.5 dark:text-slate-400">
            Welcome
          </span>
          {user ? (
            <span style={{ color: '#1A1A1A' }} className="text-sm font-black dark:text-white truncate">
              {user.displayName || "Shopper"}
            </span>
          ) : (
            <button 
              onClick={signIn} 
              className="text-sm font-black text-[#FF6A00] hover:opacity-80 transition-colors text-left outline-none truncate"
            >
              Hello, Sign In
            </button>
          )}
        </div>
      </div>

      {/* 2. ACTIVE FILTERS FEEDBACK */}
      {hasActiveFilters && (
        <div className="bg-orange-50 dark:bg-[#FF6A00]/10 border border-[#FF6A00]/30 rounded-md p-3 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-black text-[#FF6A00] uppercase tracking-[0.1em] flex items-center gap-1.5">
              <Filter className="w-3 h-3" />
              Active Filters
            </h3>
            <Link 
              href={pathname || "/"} 
              className="text-slate-400 hover:text-red-500 transition-colors"
              title="Clear all filters"
            >
              <XCircle className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex flex-col gap-1">
            {maxPrice && (
              <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                Under <span className="font-bold text-[#FF6A00]">UGX {Number(maxPrice).toLocaleString()}</span>
              </p>
            )}
            {sortType && (
              <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 capitalize">
                Sorted by: <span className="font-bold text-[#FF6A00]">{sortType}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* 3. QUICK SHOP & BROWSE SMART CARD */}
      <div className="bg-white dark:bg-[#151515] border border-slate-200 dark:border-slate-800 rounded-md shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <h3 style={{ color: '#6B6B6B' }} className="text-[10px] font-black dark:text-slate-500 uppercase tracking-[0.15em]">
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
                    ? "text-[#FF6A00] bg-orange-50 dark:bg-[#FF6A00]/10 border-l-2 border-[#FF6A00]" 
                    : "text-[#6B6B6B] dark:text-slate-300 hover:text-[#FF6A00] hover:bg-slate-50 dark:hover:bg-slate-800 border-l-2 border-transparent"
                }`}
              >
                <link.icon className={`w-4 h-4 transition-colors ${isExactMatch ? 'text-[#FF6A00]' : 'text-slate-400 group-hover:text-[#FF6A00]'}`} />
                <span className="truncate">{link.name}</span>
              </Link>
            )
          })}
        </div>

        <div className="px-4 py-2 border-y border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <h3 style={{ color: '#6B6B6B' }} className="text-[10px] font-black dark:text-slate-500 uppercase tracking-[0.15em]">
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
                    ? "text-[#FF6A00] bg-orange-50 dark:bg-[#FF6A00]/10 border-l-2 border-[#FF6A00]" 
                    : "text-[#6B6B6B] dark:text-slate-300 hover:text-[#FF6A00] hover:bg-slate-50 dark:hover:bg-slate-800 border-l-2 border-transparent"
                }`}
              >
                <link.icon className={`w-4 h-4 transition-colors ${isActiveSort ? 'text-[#FF6A00]' : 'text-slate-400 group-hover:text-[#FF6A00]'}`} />
                <span className="truncate">{link.name}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* 4. MAIN CATEGORIES CARD */}
      <div className="bg-white dark:bg-[#151515] border border-slate-200 dark:border-slate-800 rounded-md shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <h3 style={{ color: '#6B6B6B' }} className="text-[10px] font-black dark:text-slate-500 uppercase tracking-[0.15em]">
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
                    ? "text-[#FF6A00] bg-orange-50 dark:bg-[#FF6A00]/10 border-r-4 border-[#FF6A00]" 
                    : "text-[#6B6B6B] dark:text-slate-300 hover:text-[#FF6A00] hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <cat.icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? "text-[#FF6A00]" : "text-slate-400 group-hover:text-[#FF6A00]"}`} />
                  <span className="truncate">{cat.name}</span>
                </div>
                <ChevronRight className={`w-3 h-3 shrink-0 transition-transform ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-hover:translate-x-1"}`} />
              </Link>
            );
          })}
        </nav>
      </div>

      {/* 5. PROMOTIONAL BANNERS */}
      <div className="bg-white dark:bg-[#151515] border border-slate-200 dark:border-slate-800 rounded-md shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <h3 style={{ color: '#6B6B6B' }} className="text-[10px] font-black dark:text-slate-500 uppercase tracking-[0.15em]">
            Top Offers
          </h3>
        </div>
        <div className="flex flex-col p-3 gap-2">
          {promotionalBanners.map((promo, idx) => (
            <Link 
              key={idx} 
              href={promo.href} 
              className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-800 hover:border-[#FF6A00] dark:hover:border-[#FF6A00] hover:shadow-sm transition-all group"
            >
              <span className="text-sm">{promo.icon}</span>
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 group-hover:text-[#FF6A00] transition-colors">
                {promo.text}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* 6. TRUST & BADGES CARD */}
      <div className="bg-white dark:bg-[#151515] border border-slate-200 dark:border-slate-800 rounded-md shadow-sm overflow-hidden p-4">
        <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1.5 text-center leading-tight">
          Trusted Electronics Center
        </h3>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium text-center mb-5 leading-relaxed">
          Trusted electronics store for quality gadgets at affordable prices.
        </p>

        <div className="grid grid-cols-2 gap-y-4 gap-x-2">
          <div className="flex flex-col items-center text-center gap-1.5">
            <Truck className="w-5 h-5 text-[#FF6A00]" strokeWidth={2.5} />
            <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 leading-tight">Fast<br/>Delivery</span>
          </div>
          <div className="flex flex-col items-center text-center gap-1.5">
            <Lock className="w-5 h-5 text-[#FF6A00]" strokeWidth={2.5} />
            <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 leading-tight">Secure<br/>Payments</span>
          </div>
          <div className="flex flex-col items-center text-center gap-1.5">
            <PhoneCall className="w-5 h-5 text-[#FF6A00]" strokeWidth={2.5} />
            <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 leading-tight">24/7<br/>Support</span>
          </div>
          <div className="flex flex-col items-center text-center gap-1.5">
            <ShieldCheck className="w-5 h-5 text-[#FF6A00]" strokeWidth={2.5} />
            <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 leading-tight">Verified<br/>Products</span>
          </div>
          <div className="flex flex-col items-center text-center gap-1.5">
            <Award className="w-5 h-5 text-[#FF6A00]" strokeWidth={2.5} />
            <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 leading-tight">Best<br/>Quality</span>
          </div>
          <div className="flex flex-col items-center text-center gap-1.5">
            <Tag className="w-5 h-5 text-[#FF6A00]" strokeWidth={2.5} />
            <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 leading-tight">Best<br/>Offers</span>
          </div>
        </div>
      </div>

      {/* 7. TOP BRANDS CARD */}
      <div className="bg-white dark:bg-[#151515] border border-slate-200 dark:border-slate-800 rounded-md shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <h3 style={{ color: '#6B6B6B' }} className="text-[10px] font-black dark:text-slate-500 uppercase tracking-[0.15em]">
            Top Brands
          </h3>
        </div>
        <div className="p-3 flex flex-wrap justify-center gap-2">
          {["Apple", "Samsung", "Tecno", "Oraimo", "Hisense", "JBL", "Sony", "LG", "Infinix"].map((brand) => (
            <span 
              key={brand} 
              className="text-[10px] font-bold px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-sm"
            >
              {brand}
            </span>
          ))}
        </div>
      </div>

      {/* 8. PERMANENT MINI CART CARD */}
      <div className="bg-white dark:bg-[#151515] border border-slate-200 dark:border-slate-800 rounded-md shadow-sm overflow-hidden transition-all">
         <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
          <h3 style={{ color: '#6B6B6B' }} className="text-[10px] font-black dark:text-slate-500 uppercase tracking-[0.15em]">
            Shopping Cart
          </h3>
          {cart.length > 0 && (
            <span className="bg-[#FF6A00] text-white text-[10px] font-black px-2 py-0.5 rounded-sm shadow-sm">
              {cart.length}
            </span>
          )}
        </div>
        <div className="p-4">
          {cart.length === 0 ? (
            <div className="text-center py-6 flex flex-col items-center">
              <ShoppingBag className="w-8 h-8 text-slate-200 dark:text-slate-700 mb-3" />
              <p style={{ color: '#6B6B6B' }} className="text-[10px] font-bold uppercase tracking-[0.1em]">Cart is Empty</p>
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
                      <p style={{ color: '#1A1A1A' }} className="text-[11px] font-bold dark:text-slate-200 truncate">{item.title}</p>
                      <p className="text-[10px] font-black text-[#FF6A00] tracking-tight">
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
                  <span style={{ color: '#6B6B6B' }} className="text-[10px] font-black uppercase tracking-widest">Total</span>
                  <span style={{ color: '#1A1A1A' }} className="text-sm font-black dark:text-white">UGX {cartTotal.toLocaleString()}</span>
                </div>
                <Link href="/cart" className="w-full bg-[#FF6A00] hover:opacity-90 text-white text-[11px] font-black uppercase tracking-[0.2em] py-3.5 rounded-sm flex items-center justify-center transition-all shadow-sm active:scale-[0.98]">
                  Complete Order
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 9. MERCHANT CTA CARD */}
      <Link href="/sell" className="group bg-slate-900 dark:bg-black border border-slate-800 rounded-md shadow-lg overflow-hidden relative p-5 flex flex-col hover:border-[#FF6A00] transition-all outline-none">
        <div className="absolute -right-2 -top-2 opacity-10 group-hover:opacity-20 transition-opacity">
          <PlusCircle className="w-20 h-20 text-white" />
        </div>
        <h3 className="text-xs font-black text-white mb-2 uppercase tracking-[0.1em]">Become a Seller</h3>
        <p className="text-[11px] text-slate-400 font-medium mb-4 leading-relaxed">
          Reach thousands of local buyers instantly.
        </p>
        <div className="flex items-center gap-2 text-[10px] font-black text-[#FF6A00] uppercase tracking-widest transition-colors group-hover:text-orange-400">
          Open Shop
          <PlusCircle className="w-3 h-3" />
        </div>
      </Link>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

// 🔥 CRITICAL FIX: Removed the `sticky top-4 self-start` from this wrapper! 
// This forces it to align completely flush with the top of the parent container 
// in app/page.tsx, eliminating that white space you saw above the Welcome card.
export default function LeftSidebar() {
  return (
    <div className="w-full">
      <Suspense fallback={<div className="w-full h-[800px] bg-slate-50 dark:bg-slate-900/50 animate-pulse rounded-md" />}>
        <LeftSidebarContent />
      </Suspense>
    </div>
  );
}
