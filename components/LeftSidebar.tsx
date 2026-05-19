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
  User, // Kept in imports just in case you need it later
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
// STRICT ELECTRONICS CATEGORIES
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
    <div className="w-full flex flex-col gap-6 select-none pb-8">

      {/* 1. AUTH / WELCOME CARD (UPDATED) */}
      <div className="bg-white dark:bg-[#151515] border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm p-5 flex flex-col transition-colors">
        <span style={{ color: '#6B6B6B' }} className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 dark:text-slate-400">
          Welcome,
        </span>
        
        {user ? (
          <span style={{ color: '#1A1A1A' }} className="text-xl font-black dark:text-white truncate">
            {/* 🔥 Grabs only the first name by splitting at the space */}
            {user.displayName ? user.displayName.split(' ')[0] : "Shopper"}
          </span>
        ) : (
          <button 
            onClick={signIn} 
            className="text-lg font-black text-[#FF6A00] hover:opacity-80 transition-colors text-left outline-none truncate"
          >
            Sign In
          </button>
        )}
      </div>

      {/* 2. SHOPPING CART */}
      <div className="bg-white dark:bg-[#151515] border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden transition-all">
         <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
          <h3 style={{ color: '#6B6B6B' }} className="text-[11px] font-black dark:text-slate-500 uppercase tracking-[0.15em]">
            Shopping Cart
          </h3>
          {cart.length > 0 && (
            <span className="bg-[#FF6A00] text-white text-[11px] font-black px-2.5 py-0.5 rounded-md shadow-sm">
              {cart.length}
            </span>
          )}
        </div>
        <div className="p-5">
          {cart.length === 0 ? (
            <div className="text-center py-8 flex flex-col items-center">
              <ShoppingBag className="w-10 h-10 text-slate-200 dark:text-slate-700 mb-4" />
              <p style={{ color: '#6B6B6B' }} className="text-[11px] font-bold uppercase tracking-[0.1em]">Cart is Empty</p>
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="flex flex-col gap-4 max-h-[250px] overflow-y-auto no-scrollbar mb-5 pr-1">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-3 items-center group relative bg-white dark:bg-[#151515] hover:bg-slate-50 dark:hover:bg-slate-900 p-1 -mx-1 rounded-md transition-colors">
                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-md border border-slate-100 dark:border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="max-h-full object-contain p-1" />
                      ) : (
                        <ShoppingBag className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                    <div className="flex flex-col flex-grow min-w-0 pr-6">
                      <p style={{ color: '#1A1A1A' }} className="text-xs font-bold dark:text-slate-200 truncate">{item.title}</p>
                      <p className="text-[11px] font-black text-[#FF6A00] tracking-tight mt-0.5">
                        UGX {item.price.toLocaleString()}
                      </p>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="absolute right-1 text-slate-300 hover:text-red-500 transition-colors p-1.5 opacity-0 group-hover:opacity-100 bg-white dark:bg-slate-900 rounded-full shadow-sm"
                      title="Remove Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-5">
                  <span style={{ color: '#6B6B6B' }} className="text-[11px] font-black uppercase tracking-widest">Total</span>
                  <span style={{ color: '#1A1A1A' }} className="text-base font-black dark:text-white">UGX {cartTotal.toLocaleString()}</span>
                </div>
                <Link href="/cart" className="w-full bg-[#FF6A00] hover:opacity-90 text-white text-xs font-black uppercase tracking-[0.2em] py-4 rounded-md flex items-center justify-center transition-all shadow-sm active:scale-[0.98]">
                  Complete Order
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. ACTIVE FILTERS FEEDBACK */}
      {hasActiveFilters && (
        <div className="bg-orange-50 dark:bg-[#FF6A00]/10 border border-[#FF6A00]/30 rounded-lg p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-black text-[#FF6A00] uppercase tracking-[0.1em] flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Active Filters
            </h3>
            <Link 
              href={pathname || "/"} 
              className="text-slate-400 hover:text-red-500 transition-colors"
              title="Clear all filters"
            >
              <XCircle className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex flex-col gap-1.5">
            {maxPrice && (
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Under <span className="font-bold text-[#FF6A00]">UGX {Number(maxPrice).toLocaleString()}</span>
              </p>
            )}
            {sortType && (
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300 capitalize">
                Sorted by: <span className="font-bold text-[#FF6A00]">{sortType}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* 4. QUICK SHOP & BROWSE SMART CARD */}
      <div className="bg-white dark:bg-[#151515] border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <h3 style={{ color: '#6B6B6B' }} className="text-[11px] font-black dark:text-slate-500 uppercase tracking-[0.15em]">
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
                className={`px-5 py-3 text-sm font-semibold transition-all flex items-center gap-4 group outline-none ${
                  isExactMatch 
                    ? "text-[#FF6A00] bg-orange-50 dark:bg-[#FF6A00]/10 border-l-[3px] border-[#FF6A00]" 
                    : "text-[#6B6B6B] dark:text-slate-300 hover:text-[#FF6A00] hover:bg-slate-50 dark:hover:bg-slate-800 border-l-[3px] border-transparent"
                }`}
              >
                <link.icon className={`w-4 h-4 transition-colors ${isExactMatch ? 'text-[#FF6A00]' : 'text-slate-400 group-hover:text-[#FF6A00]'}`} />
                <span className="truncate">{link.name}</span>
              </Link>
            )
          })}
        </div>

        <div className="px-5 py-4 border-y border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <h3 style={{ color: '#6B6B6B' }} className="text-[11px] font-black dark:text-slate-500 uppercase tracking-[0.15em]">
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
                className={`px-5 py-3 text-sm font-semibold transition-all flex items-center gap-4 group outline-none ${
                  isActiveSort 
                    ? "text-[#FF6A00] bg-orange-50 dark:bg-[#FF6A00]/10 border-l-[3px] border-[#FF6A00]" 
                    : "text-[#6B6B6B] dark:text-slate-300 hover:text-[#FF6A00] hover:bg-slate-50 dark:hover:bg-slate-800 border-l-[3px] border-transparent"
                }`}
              >
                <link.icon className={`w-4 h-4 transition-colors ${isActiveSort ? 'text-[#FF6A00]' : 'text-slate-400 group-hover:text-[#FF6A00]'}`} />
                <span className="truncate">{link.name}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* 5. MAIN CATEGORIES CARD */}
      <div className="bg-white dark:bg-[#151515] border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <h3 style={{ color: '#6B6B6B' }} className="text-[11px] font-black dark:text-slate-500 uppercase tracking-[0.15em]">
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
                className={`px-5 py-3.5 text-sm font-semibold transition-all flex items-center justify-between group outline-none ${
                  isActive 
                    ? "text-[#FF6A00] bg-orange-50 dark:bg-[#FF6A00]/10 border-r-4 border-[#FF6A00]" 
                    : "text-[#6B6B6B] dark:text-slate-300 hover:text-[#FF6A00] hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-4 truncate">
                  <cat.icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? "text-[#FF6A00]" : "text-slate-400 group-hover:text-[#FF6A00]"}`} />
                  <span className="truncate">{cat.name}</span>
                </div>
                <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-hover:translate-x-1"}`} />
              </Link>
            );
          })}
        </nav>
      </div>

      {/* 6. PROMOTIONAL BANNERS */}
      <div className="bg-white dark:bg-[#151515] border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <h3 style={{ color: '#6B6B6B' }} className="text-[11px] font-black dark:text-slate-500 uppercase tracking-[0.15em]">
            Promotional Offers
          </h3>
        </div>
        <div className="flex flex-col p-4 gap-3">
          {promotionalBanners.map((promo, idx) => (
            <Link 
              key={idx} 
              href={promo.href} 
              className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-md border border-slate-100 dark:border-slate-800 hover:border-[#FF6A00] dark:hover:border-[#FF6A00] hover:shadow-sm transition-all group"
            >
              <span className="text-xl shrink-0">{promo.icon}</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-[#FF6A00] transition-colors leading-snug">
                {promo.text}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* 7. TRUSTED ELECTRONICS CENTER */}
      <div className="bg-white dark:bg-[#151515] border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center text-center">
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2 leading-tight">
            Trusted Electronics Hub
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[200px]">
            Kabale Online delivers verified gadgets with reliable support.
          </p>
        </div>

        <div className="flex flex-col">
          <div className="flex items-start gap-4 px-5 py-4 border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
            <Truck className="w-5 h-5 text-[#FF6A00] shrink-0 mt-0.5" strokeWidth={2.5} />
            <div className="flex flex-col">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">Fast Delivery</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-snug">Swift and secure dispatch directly to your door anywhere in Kabale.</span>
            </div>
          </div>

          <div className="flex items-start gap-4 px-5 py-4 border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
            <Lock className="w-5 h-5 text-[#FF6A00] shrink-0 mt-0.5" strokeWidth={2.5} />
            <div className="flex flex-col">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">Secure Payments</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-snug">Pay securely via Mobile Money or choose to pay on arrival.</span>
            </div>
          </div>

          <div className="flex items-start gap-4 px-5 py-4 border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
            <PhoneCall className="w-5 h-5 text-[#FF6A00] shrink-0 mt-0.5" strokeWidth={2.5} />
            <div className="flex flex-col">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">24/7 Support</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-snug">Our friendly team is always available to help before and after purchase.</span>
            </div>
          </div>

          <div className="flex items-start gap-4 px-5 py-4 border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
            <ShieldCheck className="w-5 h-5 text-[#FF6A00] shrink-0 mt-0.5" strokeWidth={2.5} />
            <div className="flex flex-col">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">Verified Products</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-snug">100% genuine products sourced from trusted official vendors.</span>
            </div>
          </div>

          <div className="flex items-start gap-4 px-5 py-4 border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
            <Tag className="w-5 h-5 text-[#FF6A00] shrink-0 mt-0.5" strokeWidth={2.5} />
            <div className="flex flex-col">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">Best Offers</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-snug">We guarantee the most competitive tech prices in the region.</span>
            </div>
          </div>
        </div>
      </div>

      {/* 8. TOP BRANDS */}
      <div className="bg-white dark:bg-[#151515] border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <h3 style={{ color: '#6B6B6B' }} className="text-[11px] font-black dark:text-slate-500 uppercase tracking-[0.15em]">
            Official Brands
          </h3>
        </div>
        <div className="flex flex-col">
          {["Apple", "Samsung", "Tecno", "Oraimo", "Hisense", "JBL", "Sony", "LG", "Infinix"].map((brand) => (
            <Link 
              key={brand}
              href={`/search?q=${brand.toLowerCase()}`}
              className="flex justify-between items-center px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-900/30 hover:text-[#FF6A00] dark:hover:text-[#FF6A00] text-slate-700 dark:text-slate-300 transition-colors group"
            >
              <span className="text-sm font-bold tracking-wide">{brand}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#FF6A00] transition-colors" />
            </Link>
          ))}
        </div>
      </div>

      {/* 9. MERCHANT CTA CARD */}
      <Link href="/sell" className="group bg-slate-900 dark:bg-black border border-slate-800 rounded-lg shadow-lg overflow-hidden relative p-6 flex flex-col hover:border-[#FF6A00] transition-all outline-none mt-2">
        <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <PlusCircle className="w-24 h-24 text-white" />
        </div>
        <h3 className="text-sm font-black text-white mb-2 uppercase tracking-[0.1em]">Become a Seller</h3>
        <p className="text-xs text-slate-400 font-medium mb-5 leading-relaxed">
          Reach thousands of local buyers instantly.
        </p>
        <div className="flex items-center gap-2 text-[11px] font-black text-[#FF6A00] uppercase tracking-widest transition-colors group-hover:text-orange-400">
          Open Shop
          <PlusCircle className="w-4 h-4" />
        </div>
      </Link>

      {/* 10. PAYMENT SECURITY CARD */}
      <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-lg p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="text-[#FF6A00] w-5 h-5 shrink-0" />
          <h3 style={{ color: '#1A1A1A' }} className="text-[11px] font-black dark:text-slate-200 uppercase tracking-wider">Secure Portal</h3>
        </div>
        <div className="flex flex-col gap-3.5">
           <div className="flex items-center gap-2">
             <div className="h-5 w-8 rounded-sm bg-slate-200 dark:bg-slate-700 animate-ug-black"></div>
             <div className="h-5 w-8 rounded-sm bg-slate-200 dark:bg-slate-700 animate-ug-yellow"></div>
             <div className="h-5 w-8 rounded-sm bg-slate-200 dark:bg-slate-700 animate-ug-red"></div>
           </div>
           <p style={{ color: '#6B6B6B' }} className="text-xs dark:text-slate-400 font-semibold leading-relaxed">
             Encrypted Mobile Money checkout powered by <span style={{ color: '#1A1A1A' }} className="dark:text-white font-bold">Kabale Online Pay</span>.
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

export default function LeftSidebar() {
  return (
    <div className="w-full">
      <Suspense fallback={<div className="w-full h-[800px] bg-slate-50 dark:bg-slate-900/50 animate-pulse rounded-md" />}>
        <LeftSidebarContent />
      </Suspense>
    </div>
  );
}
