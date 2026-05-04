"use client";

import { useState, useEffect, Suspense } from "react";
import { AuthProvider } from "@/components/AuthProvider";
import { CartProvider } from "@/context/CartContext"; 
import WebsiteBanner from "@/components/WebsiteBanner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import GlobalLoader from "@/components/GlobalLoader";

// 🚀 IMPORT SILENT REFERRAL TRACKER
import ReferralTracker from "@/components/ReferralTracker";

// IMPORT GTM NEXT.JS LIBRARY AND YOUR ID
import { GoogleTagManager } from '@next/third-parties/google';
import { GTM_ID } from "@/lib/analytics";

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  // Track if the user explicitly clicked the "X" to close the banner forever
  const [isClosedManually, setIsClosedManually] = useState(false);

  // Track scroll visibility state for the banner
  const [showBannerOnScroll, setShowBannerOnScroll] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window === "undefined") return;

      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight;

      // Show if they are at the very top (so it's visible on first load)
      const isAtTop = scrollY < 20;

      // Show if they reached the absolute bottom 
      // (We use a 50px buffer because mobile browsers like iOS Safari have a scroll "bounce")
      const isAtBottom = Math.ceil(scrollY + windowHeight) >= fullHeight - 50;

      // Update state: Show ONLY at the top or bottom
      setShowBannerOnScroll(isAtTop || isAtBottom);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    // Run it once on mount just in case they load halfway down the page
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Final visibility depends on scroll position AND if they haven't manually dismissed it
  const isBannerVisible = showBannerOnScroll && !isClosedManually;

  return (
    <>
      {/* INJECT GTM GLOBALLY ONLY IF ID EXISTS */}
      {GTM_ID && <GoogleTagManager gtmId={GTM_ID} />}

      <AuthProvider>
        {/* WRAPPED THE APP IN THE CART PROVIDER */}
        <CartProvider>
          {/* The Suspense boundary fixes the useSearchParams build crash */}
          <Suspense fallback={null}>
            <GlobalLoader />
            {/* 🚀 INJECTED HERE: Safely tracks ?ref=ABCDE in the background */}
            <ReferralTracker />
          </Suspense>

          {/* FIXED WEBSITE BANNER */}
          {isBannerVisible && (
            <WebsiteBanner onClose={() => setIsClosedManually(true)} />
          )}

          {/* NAVBAR (moves up and down smoothly depending on banner visibility) */}
          <Navbar bannerVisible={isBannerVisible} />

          {/* CONTENT WRAPPER */}
          {/* Completely transparent background to let globals.css gradient show through */}
          <div className="flex-grow pt-[140px] lg:pt-[90px] w-full transition-all flex flex-col min-h-screen bg-transparent dark:bg-transparent pb-10">

            {/* True full-width container. 
                Individual pages will handle their own max-widths, grids, and padding. 
                min-w-0 ensures child sliders do not break layout width.
            */}
            <main className="w-full flex-grow flex flex-col min-w-0">
              {children}
            </main>

          </div>

          {/* FOOTER */}
          <Footer />

          {/* MOBILE BOTTOM NAV */}
          <BottomNav />
        </CartProvider>
      </AuthProvider>
    </>
  );
}
