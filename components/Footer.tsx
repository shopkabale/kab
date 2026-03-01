"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  // THE FIX: Hide this entire footer on admin pages!
  if (pathname?.startsWith("/admin")) {
    return null; 
  }

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand & Mission */}
          <div className="md:col-span-2">
            <Link href="/" className="text-2xl font-bold text-white mb-4 inline-block tracking-tight">
              Kabale<span className="text-primary">Online</span>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed mb-6">
              The Better Way to Inform Your Community. We connect students at Kabale University, local farmers, and verified vendors for safe, Cash-on-Delivery commerce within Kabale town.
            </p>
          </div>

          {/* Quick Links (Updated to dynamic category routes) */}
          <div>
            <h3 className="text-sm font-bold text-white tracking-wider uppercase mb-4">Marketplace</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/products" className="text-sm hover:text-primary transition-colors">All Items</Link>
              </li>
              <li>
                <Link href="/category/electronics" className="text-sm hover:text-primary transition-colors">Electronics</Link>
              </li>
              <li>
                <Link href="/category/agriculture" className="text-sm hover:text-primary transition-colors">Agriculture</Link>
              </li>
              <li>
                <Link href="/category/student_item" className="text-sm hover:text-primary transition-colors">Student Market</Link>
              </li>
            </ul>
          </div>

          {/* Support & Account */}
          <div>
            <h3 className="text-sm font-bold text-white tracking-wider uppercase mb-4">Account & Support</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/profile" className="text-sm hover:text-primary transition-colors">My Profile & Orders</Link>
              </li>
              <li>
                <Link href="/sell" className="text-sm hover:text-primary transition-colors">Post an Ad (Sell)</Link>
              </li>
              <li className="text-sm text-slate-500 mt-4">
                Strictly Cash on Delivery
              </li>
              <li className="text-sm text-slate-500">
                Kabale, Uganda
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">
            &copy; {currentYear} Kabale Online. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <p className="text-xs font-medium text-slate-400">
              Built for Kabale University & the local community.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}