"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useCart } from "@/context/CartContext";
import { 
  Home, 
  LayoutGrid, 
  ShoppingCart, 
  User, 
  ShieldAlert, 
  Package,
  Bed,
  Laptop,
  Leaf,
  Sparkles,
  Wrench
} from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth(); 
  const { cartCount } = useCart();

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const isAdmin = user?.role === "admin";

  // Hide entirely on admin routes
  if (pathname?.startsWith("/admin")) return null;

  // 1. Admin Session Cookie Management
  useEffect(() => {
    if (isAdmin) {
      document.cookie = "kabale_admin_session=true; path=/; max-age=86400; secure; samesite=strict";
    } else {
      document.cookie = "kabale_admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  }, [isAdmin]);

  // 2. Handle Scroll Behavior
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsVisible(currentScrollY < lastScrollY || currentScrollY < 50);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // 3. Mobile Menu Listener
  useEffect(() => {
    const handleMenuState = (e: any) => setIsMenuOpen(e.detail);
    window.addEventListener("mobileMenuState", handleMenuState);
    return () => window.removeEventListener("mobileMenuState", handleMenuState);
  }, []);

  // 4. Navigation Items
  const baseNavItems = [
    { label: "Home", href: "/", Icon: Home },
    { label: "Categories", isTrigger: true, Icon: LayoutGrid }, 
    { label: "Cart", href: "/cart", Icon: ShoppingCart },
    { label: "Profile", href: "/profile", Icon: User },
  ];

  const navItems = isAdmin
    ? [...baseNavItems, { label: "Admin", href: "/admin", Icon: ShieldAlert }]
    : baseNavItems;

  // 5. The 6 Frontend Category Buckets
  const categoryLinks = [
    { label: "Mega Bundles & Packs", href: "/category/mega-bundles", Icon: Package },
    { label: "Campus Life & Study Gear", href: "/category/campus-life", Icon: Bed },
    { label: "Tech, Gadgets & Appliances", href: "/category/tech-appliances", Icon: Laptop },
    { label: "Farm Fresh & Groceries", href: "/category/food-groceries", Icon: Leaf },
    { label: "Beauty, Health & Fashion", href: "/category/beauty-fashion", Icon: Sparkles },
    { label: "Expert Repairs & Services", href: "/category/repairs-services", Icon: Wrench }
  ];

  return (
    <>
      {/* BOTTOM NAVIGATION BAR */}
      <div 
        className={`fixed bottom-0 left-0 w-full bg-white dark:bg-[#0a0a0a] border-t border-slate-200 dark:border-slate-800 z-50 transition-transform duration-300 xl:hidden ${
          isVisible && !isMenuOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex justify-around items-center h-16 px-2 pb-safe">
          {navItems.map(({ label, href, isTrigger, Icon }) => {
            const isActive = !isTrigger && (pathname === href || (href !== "/" && pathname?.startsWith(href || "")));

            const content = (
              <div className="flex flex-col items-center justify-center h-full relative w-full gap-1">
                {/* SVG Icon */}
                <div className="relative">
                  <Icon 
                    size={22} 
                    strokeWidth={isActive ? 2.5 : 2} 
                    className={`transition-colors duration-300 ${
                      isActive ? "text-[#D97706]" : "text-slate-500 dark:text-slate-400"
                    }`} 
                  />

                  {/* Cart Badge */}
                  {label === "Cart" && cartCount > 0 && (
                    <span className="absolute -top-2 -right-3 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white dark:border-[#0a0a0a] shadow-sm leading-none">
                      {cartCount}
                    </span>
                  )}
                </div>

                {/* Text Label */}
                <span 
                  className={`text-[10px] uppercase tracking-wider transition-all duration-300 ${
                    isActive ? "font-black text-[#D97706]" : "font-bold text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {label}
                </span>

                {/* Animated Underline Indicator */}
                <div 
                  className={`absolute bottom-0 h-[3px] bg-[#D97706] rounded-t-full transition-all duration-300 ease-out ${
                    isActive ? "w-8 opacity-100" : "w-0 opacity-0"
                  }`}
                />
              </div>
            );

            const className = "flex flex-col items-center justify-center w-full h-full pt-1 pb-2 group";

            if (isTrigger) {
              return (
                <button key={label} onClick={() => setIsCategoryModalOpen(true)} className={className}>
                  {content}
                </button>
              );
            }

            if (label === "Admin") {
              return (
                <a key={label} href={href} className={className}>
                  {content}
                </a>
              );
            }

            return (
              <Link key={label} href={href || "#"} className={className}>
                {content}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ORIGINAL SLIDE-UP CATEGORIES MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-[#1a1a1a] w-full sm:w-[400px] rounded-t-3xl sm:rounded-3xl p-6 text-white animate-slide-up border border-slate-800 shadow-2xl">
            
            {/* Drag Handle */}
            <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-6"></div>
            
            {/* Title */}
            <h3 className="text-center text-xl font-bold mb-6 tracking-wide">Categories</h3>

            {/* Categories List */}
            <div className="flex flex-col gap-2 text-lg font-medium">
              {categoryLinks.map(({ label, href, Icon }) => (
                <Link 
                  key={label}
                  href={href} 
                  onClick={() => setIsCategoryModalOpen(false)} 
                  className="flex items-center gap-4 hover:text-[#D97706] transition-colors py-3 px-2 rounded-lg hover:bg-slate-800/50"
                >
                  <Icon className="text-slate-400" size={20} />
                  {label}
                </Link>
              ))}
            </div>

            {/* Close Button */}
            <button 
              onClick={() => setIsCategoryModalOpen(false)} 
              className="mt-8 w-full py-3.5 bg-slate-800 rounded-xl font-bold hover:bg-slate-700 active:scale-[0.98] transition-all text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
