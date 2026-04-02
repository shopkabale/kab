import { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import LayoutClient from "@/components/LayoutClient";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

// VIEWPORT CONFIG
export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// SEO & PWA METADATA
export const metadata: Metadata = {
  title: "Kabale Online | The Better Way To Buy and Sell in Kabale and the Greater Kigezi Region",
  description:
    "Connect with students at Kabale University, local farmers, and verified vendors for safe, Cash-on-Delivery commerce.",
  keywords: [
    "Kabale",
    "Kabale University",
    "buy and sell",
    "Uganda",
    "marketplace",
    "student market",
    "agriculture",
  ],
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
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen bg-background text-slate-900 transition-colors">
        
        {/* CLIENT LAYOUT (handles banner, navbar, auth, etc.) */}
        <LayoutClient>
          {children}
        </LayoutClient>

        {/* Vercel Analytics */}
        <Analytics />

      </body>
    </html>
  );
}
