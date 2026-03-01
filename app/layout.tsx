import type { Metadata } from "next";
import { AuthProvider } from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kabale Online | Marketplace",
  description: "Your local e-commerce platform for Electronics, Agriculture, and Student items in Kabale town.",
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
        </AuthProvider>
      </body>
    </html>
  );
}