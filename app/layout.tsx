import type { Metadata } from "next";
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
        <main className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </body>
    </html>
  );
}