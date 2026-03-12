"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth(); // Safely grab the synced user from your context
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Since your backend now safely verifies the token, we can trust the role here
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

  // 3. Base navigation items
  const baseNavItems = [
    { label: "Home", href: "/", icon: "🏠" },
    { label: "Shop", href: "/products", icon: "🛍️" },
    { label: "Sell", href: "/sell", icon: "➕" },
    { label: "Profile", href: "/profile", icon: "👤" },
  ];

  // 4. Dynamically add the Admin item if the user is an admin
  const navItems = isAdmin
    ? [...baseNavItems, { label: "Admin", href: "/admin", icon: "🛡️" }]
    : baseNavItems;

  return (
    <div className={`fixed bottom-0 left-0 w-full bg-white dark:bg-[#0a0a0a] border-t border-slate-200 dark:border-slate-800 z-50 transition-transform duration-300 xl:hidden ${isVisible ? "translate-y-0" : "translate-y-full"}`}>
      <div className="flex justify-around items-center h-16 px-2 pb-safe">
        {navItems.map((item) => {
          // Check if the current route matches the tab
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
          
          // The shared styling and content for both Link and <a> tags
          const content = (
            <>
              <span className={`text-xl ${isActive ? "scale-110 transition-transform" : ""}`}>{item.icon}</span>
              <span className={`text-[10px] tracking-wide ${isActive ? "font-black" : "font-semibold"}`}>{item.label}</span>
            </>
          );

          const className = `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? "text-[#D97706]" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"}`;

          // ✨ THE FIX: Force a hard reload ONLY for the highly secure Admin button
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
