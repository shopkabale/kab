import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingHelpButton from "@/components/FloatingHelpButton";
import BottomNav from "@/components/BottomNav"; // 1. IMPORT ADDED
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

// 1. VIEWPORT CONFIG
export const viewport: Viewport = {
  themeColor: "#0f172a", 
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// 2. SEO & PWA METADATA
export const metadata: Metadata = {
  title: "Kabale Online | The Better Way To Buy and Sell in Kabale and the Greater Kigezi Region",
  description: "Connect with students at Kabale University, local farmers, and verified vendors for safe, Cash-on-Delivery commerce.",
  keywords: ["Kabale", "Kabale University", "buy and sell", "Uganda", "marketplace", "student market", "agriculture"],
  manifest: "/manifest.json", 
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kabale Online",
  },
  openGraph: {
    title: "Kabale Online | The Better Way To Buy and Sell in Kabale and the Greater Kigezi Region",
    description: "Buy and sell locally in Kabale with strictly Cash on Delivery.",
    url: "https://www.kabaleonline.com",
    siteName: "Kabale Online",
    images: [
      {
        url: "/og-image.jpg", 
        width: 1200,
        height: 630,
        alt: "Kabale Online Marketplace",
      },
    ],
    locale: "en_UG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kabale Online Marketplace",
    description: "The Better Way To Buy and Sell in Kabale and the Greater Kigezi Region",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* 2. Added dark:bg-[#0a0a0a] and dark:text-slate-100 for automatic dark mode */}
      <body className="flex flex-col min-h-screen bg-background dark:bg-[#0a0a0a] text-slate-900 dark:text-slate-100 transition-colors">
        <AuthProvider>
          <Navbar />
          
          {/* 3. Updated pb-12 to pb-24 to make room for the Bottom Nav */}
          <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-24 w-full">
            {children}
          </main>
          
          <Footer />

          {/* 4. INJECTED BOTTOM NAV */}
          <BottomNav />

          <FloatingHelpButton />
        </AuthProvider>

        <Analytics />
      </body>
    </html>
  );
}
