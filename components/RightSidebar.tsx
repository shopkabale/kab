"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useTheme } from "@/components/ThemeProvider";

export default function RightSidebar() {
  const { cartCount } = useCart();
  const theme = useTheme();

  return (
    <div className="w-full flex flex-col gap-4 select-none">
      
      {/* CART SUMMARY WIDGET */}
      <div className="bg-white dark:bg-[#151515] rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#111] flex justify-between items-center">
          <h3 className={`text-sm font-black uppercase tracking-wider ${theme.text}`}>
            Your Cart
          </h3>
          <span className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {cartCount} {cartCount === 1 ? 'Item' : 'Items'}
          </span>
        </div>
        
        <div className="p-4 flex flex-col">
          {cartCount > 0 ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-[#D97706]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Ready to checkout?</span>
                  <span className="text-xs text-slate-500">Review your items</span>
                </div>
              </div>
              <Link 
                href="/cart"
                className="w-full flex items-center justify-center bg-[#D97706] text-white text-sm font-bold uppercase tracking-wide py-2.5 rounded hover:bg-amber-600 transition-colors shadow-sm"
              >
                Proceed to Cart
              </Link>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <svg className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              <p className="text-sm font-medium text-slate-500">Your cart is currently empty.</p>
            </div>
          )}
        </div>
      </div>

      {/* VENDOR ACQUISITION CTA */}
      <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm group cursor-pointer block">
        <Link href="/sell" className="block outline-none">
          <div className="absolute inset-0 bg-slate-900 dark:bg-black z-0"></div>
          {/* Subtle gradient overlay to match aesthetic */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#D97706]/20 to-transparent z-10 opacity-50 group-hover:opacity-100 transition-opacity"></div>
          
          <div className="relative z-20 p-5 flex flex-col items-start h-full">
            <span className="inline-block bg-[#D97706] text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-sm mb-3 shadow-sm">
              Sell With Us
            </span>
            <h3 className="text-lg font-black text-white leading-tight mb-2">
              Turn your unused items into cash.
            </h3>
            <p className="text-xs text-slate-300 mb-4 line-clamp-2">
              Reach thousands of buyers across Kabale University and the Kigezi region.
            </p>
            <span className="text-xs font-bold text-[#D97706] uppercase tracking-wider flex items-center gap-1 group-hover:text-amber-400 transition-colors mt-auto">
              Start Selling Today
              <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </span>
          </div>
        </Link>
      </div>

      {/* TRUST BADGES */}
      <div className="bg-slate-50 dark:bg-[#111] rounded-lg border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex items-center justify-center gap-4 text-slate-400 dark:text-slate-600">
          <div className="flex flex-col items-center gap-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            <span className="text-[9px] font-bold uppercase tracking-wider">Secure</span>
          </div>
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-800"></div>
          <div className="flex flex-col items-center gap-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-[9px] font-bold uppercase tracking-wider">24/7 Support</span>
          </div>
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-800"></div>
          <div className="flex flex-col items-center gap-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            <span className="text-[9px] font-bold uppercase tracking-wider">Payments</span>
          </div>
        </div>
      </div>

    </div>
  );
}
