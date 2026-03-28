"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function GlobalLoader() {
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 1. Hide the loader when the new URL finishes loading
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname, searchParams]);

  // 2. Intercept clicks on internal links to show the loader instantly
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");

      if (!anchor) return;

      const href = anchor.getAttribute("href");
      
      if (
        href &&
        href.startsWith("/") &&
        anchor.target !== "_blank" &&
        href !== pathname
      ) {
        setIsNavigating(true);
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname]);

  if (!isNavigating) return null;

  return (
    // Completely transparent background
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-transparent pointer-events-none transition-opacity duration-300">
      
      {/* Custom Keyframe Animation for Kinetic Spin & Zoom */}
      <style>{`
        @keyframes kineticSpin {
          0% { 
            transform: scale(0.6) rotate(0deg); 
            opacity: 0.7;
          }
          50% { 
            /* ZOOM IN: Only rotates 90 degrees here, making the spin SLOW */
            transform: scale(1.2) rotate(90deg); 
            opacity: 1;
          }
          100% { 
            /* ZOOM OUT: Has to rush the remaining 270 degrees, making the spin FAST */
            transform: scale(0.6) rotate(360deg); 
            opacity: 0.7;
          }
        }
        .animate-kinetic-spin {
          /* ease-in-out smooths out the speed transition so it feels like natural momentum */
          animation: kineticSpin 1.4s infinite ease-in-out;
        }
      `}</style>

      {/* The Animated "K" in a Circle SVG */}
      <svg 
        className="animate-kinetic-spin w-16 h-16 text-[#D97706] drop-shadow-md" 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* The Outer Circle */}
        <circle 
          cx="50" 
          cy="50" 
          r="42" 
          stroke="currentColor" 
          strokeWidth="7" 
          className="opacity-90"
        />
        {/* The Letter K */}
        <path 
          d="M38 28v44m0-22l20-22m-20 22l20 22" 
          stroke="currentColor" 
          strokeWidth="7" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
      </svg>
      
    </div>
  );
}
