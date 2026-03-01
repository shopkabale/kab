import type { Metadata } from "next";
import { AuthProvider } from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
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
      <body>
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}