"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth(); 
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  // 🌟 NEW: Track if the mobile menu drawer is open
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  // 🌟 NEW: Listen for the mobile menu opening/closing broadcast from Navbar
  useEffect(() => {
    const handleMenuState = (e: any) => setIsMenuOpen(e.detail);
    window.addEventListener("mobileMenuState", handleMenuState);
    return () => window.removeEventListener("mobileMenuState", handleMenuState);
  }, []);

  // 3. Base navigation items
  const baseNavItems = [
    { label: "Home", href: "/" },
    { label: "Sell", href: "/sell" },
    { label: "Profile", href: "/profile" },
  ];

  // 4. Dynamically add the Admin item if the user is an admin
  const navItems = isAdmin
    ? [...baseNavItems, { label: "Admin", href: "/admin" }]
    : baseNavItems;

  return (
    {/* 🌟 NEW: Updated logic -> isVisible && !isMenuOpen */}
    <div className={`fixed bottom-0 left-0 w-full bg-white dark:bg-[#0a0a0a] border-t border-slate-200 dark:border-slate-800 z-50 transition-transform duration-300 xl:hidden ${isVisible && !isMenuOpen ? "translate-y-0" : "translate-y-full"}`}>
      <div className="flex justify-around items-center h-16 px-2 pb-safe">
        {navItems.map((item) => {
          // Check if the current route matches the tab
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));

          // The shared styling and content for both Link and <a> tags
          const content = (
            <div className="flex flex-col items-center justify-center h-full relative w-full">
              {/* Text Label (Increased size to text-xs) */}
              <span 
                className={`text-xs uppercase tracking-widest transition-all duration-300 ${
                  isActive 
                    ? "font-black text-[#D97706]" 
                    : "font-bold text-slate-500 dark:text-slate-400"
                }`}
              >
                {item.label}
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
            <Link key={item.label} href={item.href} className={className}>
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
