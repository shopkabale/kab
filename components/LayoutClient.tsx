"use client";

import { useState, useEffect, Suspense } from "react";
import { usePathname } from "next/navigation";
import { AuthProvider } from "@/components/AuthProvider";
import { CartProvider } from "@/context/CartContext"; 
import WebsiteBanner from "@/components/WebsiteBanner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingHelpButton from "@/components/FloatingHelpButton";
import BottomNav from "@/components/BottomNav";
import GlobalLoader from "@/components/GlobalLoader";
import LeftSidebar from "@/components/LeftSidebar"; 
import RightSidebar from "@/components/RightSidebar"; 

// IMPORT GTM NEXT.JS LIBRARY AND YOUR ID
import { GoogleTagManager } from '@next/third-parties/google';
import { GTM_ID } from "@/lib/analytics";

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Define which routes should get the 3-column shop layout
  const isShopRoute = 
    pathname === "/" ||
    pathname === "/products" || 
    pathname?.startsWith("/category") || 
    pathname === "/officialStore" ||
    pathname === "/ladies";

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
          </Suspense>

          {/* FIXED WEBSITE BANNER */}
          {isBannerVisible && (
            <WebsiteBanner onClose={() => setIsClosedManually(true)} />
          )}

          {/* NAVBAR (moves up and down smoothly depending on banner visibility) */}
          <Navbar bannerVisible={isBannerVisible} />

          {/* CONTENT WRAPPER */}
          {/* Completely transparent background to let globals.css gradient show through */}
          <div className="flex-grow pt-[140px] lg:pt-[90px] w-full transition-all flex flex-col min-h-screen bg-transparent dark:bg-transparent">

            {isShopRoute ? (
              /* === THE RESPONSIVE SHOP LAYOUT === */
              /* True full-width container with no horizontal padding or max-width constraints */
              <div className="w-full pb-10 flex-grow">

                {/* Mobile/Tablet/Small PCs: 1 column (flex-col) 
                  Big Screens (xl): Fluid 3-column grid (15% Left | 1fr Center | 15% Right)
                */}
                <div className="flex flex-col xl:grid xl:grid-cols-[15%_1fr_15%] gap-6 xl:gap-8">

                  {/* LEFT COLUMN (Filters & Categories) */}
                  <aside className="hidden xl:block w-full">
                    {/* sticky top handles the navbar height + padding */}
                    <div className="sticky top-[110px]">
                      <LeftSidebar />
                    </div>
                  </aside>

                  {/* CENTER COLUMN (Main Content) */}
                  {/* min-w-0 prevents child elements like sliders from breaking the CSS grid */}
                  <main className="w-full flex flex-col gap-6 min-w-0">
                    {children}
                  </main>

                  {/* RIGHT COLUMN (Cart Summary & Ads) */}
                  <aside className="hidden xl:block w-full">
                    <div className="sticky top-[110px]">
                      <RightSidebar />
                    </div>
                  </aside>

                </div>
              </div>
            ) : (
              /* === THE STANDARD FULL-WIDTH LAYOUT === */
              /* Used for checkout, login, profile, and other non-browsing pages */
              <main className="w-full flex-grow">
                {children}
              </main>
            )}

          </div>

          {/* FOOTER */}
          <Footer />

          {/* MOBILE BOTTOM NAV */}
          <BottomNav />

          {/* FLOATING HELP BUTTON */}
          <FloatingHelpButton />
        </CartProvider>
      </AuthProvider>
    </>
  );
}
