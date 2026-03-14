"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function VendorDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // The navigation links for the store admin
  const navItems = [
    { name: "Overview", href: "/vendor/dashboard", icon: "📊" },
    { name: "My Products", href: "/vendor/products", icon: "📦" },
    { name: "Orders", href: "/vendor/orders", icon: "🛒" },
    { name: "Store Settings", href: "/vendor/settings", icon: "⚙️" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* Mobile Header & Menu Toggle */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center z-20">
        <div className="font-bold text-lg flex items-center gap-2">
          <span className="text-amber-500">🏪</span> Store Admin
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          {isMobileMenuOpen ? "✖️" : "☰"}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside 
        className={`${
          isMobileMenuOpen ? "block" : "hidden"
        } md:block w-full md:w-64 bg-slate-900 text-slate-300 flex-shrink-0 border-r border-slate-800 md:min-h-screen z-10`}
      >
        <div className="p-6 hidden md:block border-b border-slate-800">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <span className="text-amber-500">🏪</span> Store Admin
          </h2>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            // Check if the current route matches the link
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)} // Close menu on mobile click
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-amber-500 text-slate-900 font-bold shadow-md"
                    : "hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
          
          {/* Back to main site link */}
          <div className="pt-8 mt-8 border-t border-slate-800">
            <Link 
              href="/"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <span>⬅️</span> Back to Marketplace
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
        {children}
      </main>

    </div>
  );
}
