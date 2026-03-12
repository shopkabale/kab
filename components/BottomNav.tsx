"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider"; // ✨ NEW: Using your custom hook!

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth(); // Safely grab the synced user from your context
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Since your backend now safely verifies the token and sets this role, we can trust it here!
  const isAdmin = user?.role === "admin";

  // Hide entirely on admin routes
  if (pathname?.startsWith("/admin")) return null;

  // 1. Set or destroy the Middleware cookie automatically
  useEffect(() => {
    if (isAdmin) {
      document.cookie = "kabale_admin_session=true; path=/; max-age=86400; secure; samesite=strict";
    } else {
      document.cookie = "kabale_admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  }, [isAdmin]);

  // 2. Handle Scroll behavior
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

  // 3. Base navigation items
  const baseNavItems = [
    { label: "Home", href: "/", icon: "🏠" },
    { label: "Shop", href: "/products", icon: "🛍️" },
    { label: "Sell", href: "/sell", icon: "➕" },
    { label: "Profile", href: "/profile", icon: "👤" },
  ];

  // 4. Dynamically add the Admin item
  const navItems = isAdmin
    ? [...baseNavItems, { label: "Admin", href: "/admin", icon: "🛡️" }]
    : baseNavItems;

  return (
    <div className={`fixed bottom-0 left-0 w-full bg-white dark:bg-[#0a0a0a] border-t border-slate-200 dark:border-slate-800 z-50 transition-transform duration-300 xl:hidden ${isVisible ? "translate-y-0" : "translate-y-full"}`}>
      <div className="flex justify-around items-center h-16 px-2 pb-safe">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
          return (
            <Link key={item.label} href={item.href} className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? "text-[#D97706]" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"}`}>
              <span className={`text-xl ${isActive ? "scale-110 transition-transform" : ""}`}>{item.icon}</span>
              <span className={`text-[10px] tracking-wide ${isActive ? "font-black" : "font-semibold"}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
