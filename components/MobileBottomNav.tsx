"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileBottomNav() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // If we scroll down more than 10px, hide it. If we scroll up, show it.
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Don't show bottom nav on desktop
  return (
    <div className={`md:hidden fixed bottom-0 left-0 w-full bg-slate-900 text-slate-400 z-40 transition-transform duration-300 ease-in-out border-t border-slate-800 pb-safe ${isVisible ? "translate-y-0" : "translate-y-full"}`}>
      <div className="flex items-center justify-around h-16 px-2">
        
        <Link href="/" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${pathname === "/" ? "text-[#D97706]" : "hover:text-white"}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          <span className="text-[10px] font-bold">Shop</span>
        </Link>

        <Link href="/products" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${pathname === "/products" ? "text-[#D97706]" : "hover:text-white"}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
          <span className="text-[10px] font-bold">Categories</span>
        </Link>

        {/* Sell Button (Standout Center) */}
        <Link href="/sell" className="relative flex flex-col items-center justify-center w-full h-full">
          <div className="absolute -top-5 bg-[#D97706] text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg shadow-amber-900/50 border-4 border-slate-900">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
          </div>
          <span className="text-[10px] font-bold mt-7 text-white">Sell</span>
        </Link>

        <Link href="/requests" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${pathname === "/requests" ? "text-[#D97706]" : "hover:text-white"}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          <span className="text-[10px] font-bold">Requests</span>
        </Link>

        <Link href="/profile" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${pathname === "/profile" ? "text-[#D97706]" : "hover:text-white"}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          <span className="text-[10px] font-bold">Account</span>
        </Link>

      </div>
    </div>
  );
}
