"use client";

import { useState, useEffect, Suspense } from "react";
import { AuthProvider } from "@/components/AuthProvider";
import WebsiteBanner from "@/components/WebsiteBanner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingHelpButton from "@/components/FloatingHelpButton";
import BottomNav from "@/components/BottomNav";
import GlobalLoader from "@/components/GlobalLoader";

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Track if the user explicitly clicked the "X" to close it forever
  const [isClosedManually, setIsClosedManually] = useState(false);

  // 2. Track scroll visibility state
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
    <AuthProvider>
      {/* 🔥 The Suspense boundary fixes the useSearchParams build crash */}
      <Suspense fallback={null}>
        <GlobalLoader />
      </Suspense>

      {/* FIXED WEBSITE BANNER */}
      {isBannerVisible && (
        <WebsiteBanner onClose={() => setIsClosedManually(true)} />
      )}

      {/* NAVBAR (moves up and down smoothly depending on banner visibility) */}
      <Navbar bannerVisible={isBannerVisible} />

      {/* MAIN CONTENT */}
      {/* 🔥 REMOVED: pb-8 from this tag to eliminate the extra bottom space */}

      <main className="flex-grow pt-[140px] lg:pt-[90px] w-full transition-all">


        {children}
      </main>

      {/* FOOTER */}
      <Footer />

      {/* MOBILE BOTTOM NAV */}
      <BottomNav />

      {/* FLOATING HELP BUTTON */}
      <FloatingHelpButton />
    </AuthProvider>
  );
}
