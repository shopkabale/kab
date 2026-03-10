"use client";

import { useState } from "react";
import { AuthProvider } from "@/components/AuthProvider";
import WebsiteBanner from "@/components/WebsiteBanner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingHelpButton from "@/components/FloatingHelpButton";
import BottomNav from "@/components/BottomNav";

export default function LayoutClient({
children,
}: {
children: React.ReactNode;
}) {
const [showBanner, setShowBanner] = useState(true);

return (
<AuthProvider>

  {/* FIXED WEBSITE BANNER */}
  {showBanner && (
    <WebsiteBanner onClose={() => setShowBanner(false)} />
  )}

  {/* NAVBAR (moves depending on banner visibility) */}
  <Navbar bannerVisible={showBanner} />

  {/* MAIN CONTENT */}
  <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 w-full">
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