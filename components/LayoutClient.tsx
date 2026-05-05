"use client";

import { Suspense } from "react";
import { AuthProvider } from "@/components/AuthProvider";
import { CartProvider } from "@/context/CartContext"; 
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

          {/* NAVBAR */}
          <Navbar />

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
