"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useCart } from "@/context/CartContext"; // 🔥 IMPORTED CART BRAIN

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth(); 
  const { cartCount } = useCart(); // 🔥 PULL CART COUNT
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Track if the mobile menu drawer is open
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Track if the Categories Modal is open
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const isAdmin = user?.role === "admin";

  // Hide entirely on admin routes
  if (pathname?.startsWith("/admin")) return null;

  // 1. Set or destroy the Middleware cookie automatically based on admin status
  useEffect(() => {
    if (isAdmin) {
      document.cookie = "kabale_admin_session=true; path=/; max-age=86400; secure; samesite=strict";
    } else {
      document.cookie = "kabale_admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  }, [isAdmin]);

  // 2. Handle Scroll behavior (hide when scrolling down, show when scrolling up)
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Listen for the mobile menu opening/closing broadcast from Navbar
  useEffect(() => {
    const handleMenuState = (e: any) => setIsMenuOpen(e.detail);
    window.addEventListener("mobileMenuState", handleMenuState);
    return () => window.removeEventListener("mobileMenuState", handleMenuState);
  }, []);

  // 🔥 3. Base navigation items (REPLACED DEALS WITH CART)
  const baseNavItems = [
    { label: "Home", href: "/" },
    { label: "Categories", isTrigger: true }, 
    { label: "Cart", href: "/cart" }, // <-- New Cart Tab
    { label: "Profile", href: "/profile" },
  ];

  // 4. Dynamically add the Admin item if the user is an admin
  const navItems = isAdmin
    ? [...baseNavItems, { label: "Admin", href: "/admin" }]
    : baseNavItems;

  return (
    <>
      <div className={`fixed bottom-0 left-0 w-full bg-white dark:bg-[#0a0a0a] border-t border-slate-200 dark:border-slate-800 z-50 transition-transform duration-300 xl:hidden ${isVisible && !isMenuOpen ? "translate-y-0" : "translate-y-full"}`}>
        <div className="flex justify-around items-center h-16 px-2 pb-safe">
          {navItems.map((item) => {
            // Check if the current route matches the tab (ignore for Categories trigger)
            const isActive = !item.isTrigger && (pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href || "")));

            // The shared styling and content
            const content = (
              <div className="flex flex-col items-center justify-center h-full relative w-full">
                {/* Text Label */}
                <span 
                  className={`text-xs uppercase tracking-widest transition-all duration-300 relative ${
                    isActive 
                      ? "font-black text-[#D97706]" 
                      : "font-bold text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {item.label}
                  
                  {/* 🔥 RED BADGE FOR CART ITEM */}
                  {item.label === "Cart" && cartCount > 0 && (
                    <span className="absolute -top-2.5 -right-4 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white dark:border-slate-900 shadow-sm">
                      {cartCount}
                    </span>
                  )}
                </span>

                {/* Animated Underline Indicator */}
                <div 
                  className={`absolute bottom-2.5 h-[3px] bg-[#D97706] rounded-full transition-all duration-300 ease-out ${
                    isActive ? "w-8 opacity-100" : "w-0 opacity-0"
                  }`}
                />
              </div>
            );

            const className = "flex flex-col items-center justify-center w-full h-full group";

            // If it's the Categories button, open the modal instead of linking
            if (item.isTrigger) {
              return (
                <button key={item.label} onClick={() => setIsCategoryModalOpen(true)} className={className}>
                  {content}
                </button>
              );
            }

            // Force a hard reload ONLY for the highly secure Admin button
            if (item.label === "Admin") {
              return (
                <a key={item.label} href={item.href} className={className}>
                  {content}
                </a>
              );
            }

            // Use normal, ultra-fast Next.js routing for the public pages
            return (
              <Link key={item.label} href={item.href || "#"} className={className}>
                {content}
              </Link>
            );
          })}
        </div>
      </div>

      {/* EXACT CATEGORIES BOTTOM SHEET / MODAL YOU PROVIDED */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 transition-opacity">
          <div className="bg-[#1a1a1a] w-full sm:w-[400px] rounded-t-3xl sm:rounded-3xl p-6 text-white animate-slide-up">
            <div className="w-12 h-1 bg-slate-600 rounded-full mx-auto mb-6"></div>
            <h3 className="text-center text-xl font-bold mb-6">Categories</h3>

            <div className="flex flex-col gap-4 text-lg">
              <Link href="/officialStore" onClick={() => setIsCategoryModalOpen(false)} className="hover:text-[#D97706] transition-colors py-2 border-b border-slate-800">
                Official Store
              </Link>
              <Link href="/ladies" onClick={() => setIsCategoryModalOpen(false)} className="hover:text-[#D97706] transition-colors py-2 border-b border-slate-800">
                Ladies' Picks 💖
              </Link>
              <Link href="/category/student_item" onClick={() => setIsCategoryModalOpen(false)} className="hover:text-[#D97706] transition-colors py-2 border-b border-slate-800">
                Student market
              </Link>
              <Link href="/category/electronics" onClick={() => setIsCategoryModalOpen(false)} className="hover:text-[#D97706] transition-colors py-2 border-b border-slate-800">
                Electronics
              </Link>
              <Link href="/category/agriculture" onClick={() => setIsCategoryModalOpen(false)} className="hover:text-[#D97706] transition-colors py-2">
                Agriculture
              </Link>
            </div>

            <button onClick={() => setIsCategoryModalOpen(false)} className="mt-8 w-full py-3 bg-slate-800 rounded-xl font-bold hover:bg-slate-700 transition-colors">
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
