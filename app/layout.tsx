import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingHelpButton from "@/components/FloatingHelpButton";
import { Analytics } from "@vercel/analytics/react"; // 1. Imported Vercel Analytics
import "./globals.css";

// 1. VIEWPORT CONFIG (Required for PWA mobile rendering)
export const viewport: Viewport = {
  themeColor: "#0f172a", // Matches your navbar/footer
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// 2. SEO & PWA METADATA
export const metadata: Metadata = {
  title: "Kabale Online | The Better Way To Buy and Sell in Kabale and the Greater Kigezi  Region ",
  description: "Connect with students at Kabale University, local farmers, and verified vendors for safe, Cash-on-Delivery commerce.",
  keywords: ["Kabale", "Kabale University", "buy and sell", "Uganda", "marketplace", "student market", "agriculture"],
  manifest: "/manifest.json", // Triggers the "Add to Home Screen" install prompt
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kabale Online",
  },
  openGraph: {
    title: "Kabale Online | The Better Way To Buy and Sell in Kabale and the Greater Kigezi  Region ",
    description: "Buy and sell locally in Kabale with strictly Cash on Delivery.",
    url: "https://www.okaynotice.com",
    siteName: "Kabale Online",
    images: [
      {
        url: "/og-image.jpg", // Create a 1200x630 image and put it in your /public folder
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
    description: "The Better Way To Buy and Sell in Kabale and the Greater Kigezi  Region ",
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
      <body className="flex flex-col min-h-screen bg-background text-slate-900">
        <AuthProvider>
          <Navbar />
          {/* pt-24 pushes content down so it's not hidden behind the fixed Navbar */}
          <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 w-full">
            {children}
          </main>
          <Footer />

          {/* Injected the floating button globally */}
          <FloatingHelpButton />
        </AuthProvider>

        {/* 2. Dropped the Analytics component at the end of the body */}
        <Analytics />
      </body>
    </html>
  );
}
