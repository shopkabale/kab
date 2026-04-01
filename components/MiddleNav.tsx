"use client";

import { useState } from "react";
import Link from "next/link";

export default function MiddleNav() {
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Function to trigger the AI Chat Widget from your FloatingHelpButton
  const openAiWidget = () => {
    window.dispatchEvent(new Event("open-ai-widget"));
  };

  return (
    <>
      {/* CONNECTED RECTANGLES NAV BAR */}
      <div className="w-full max-w-[1200px] mx-auto px-4 py-4">
        <div className="flex w-full md:max-w-[800px] mx-auto border-2 border-slate-900 dark:border-white rounded-md overflow-hidden bg-white dark:bg-[#111] shadow-sm">

          <button 
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex-1 py-3.5 px-2 flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border-r-2 border-slate-900 dark:border-white text-slate-900 dark:text-white font-black text-xs sm:text-sm uppercase tracking-wide"
          >
            {/* Combined Hamburger & Search Icon */}
            <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h8m-8 6h16m-3-4a3 3 0 11-6 0 3 3 0 016 0zm1.5 1.5L20 17" />
            </svg>
            <span>Categories</span>
          </button>

          <button 
            onClick={openAiWidget}
            className="flex-1 py-3.5 px-2 flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border-r-2 border-slate-900 dark:border-white text-slate-900 dark:text-white font-black text-xs sm:text-sm uppercase tracking-wide"
          >
            <span>Need help?</span>
          </button>

          <Link 
            href="/sell"
            className="flex-1 py-3.5 px-2 flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-900 dark:text-white font-black text-xs sm:text-sm uppercase tracking-wide"
          >
            <span>Sell</span>
          </Link>

        </div>
      </div>

      {/* CATEGORIES BOTTOM SHEET / MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 transition-opacity">
          <div className="bg-[#1a1a1a] w-full sm:w-[400px] rounded-t-3xl sm:rounded-3xl p-6 text-white animate-slide-up">
            <div className="w-12 h-1 bg-slate-600 rounded-full mx-auto mb-6"></div>
            <h3 className="text-center text-xl font-bold mb-6">Categories</h3>

            <div className="flex flex-col gap-4 text-lg">
              <Link href="/officialStore" onClick={() => setIsCategoryModalOpen(false)} className="hover:text-[#D97706] transition-colors py-2 border-b border-slate-800">
                Official Store
              </Link>
              <Link href="/ladies" onClick={() => setIsCategoryModalOpen(false)} className="hover:text-[#D97706] transition-colors py-2 border-b border-slate-800">
                Ladies' Picks 💖
              </Link>
              <Link href="/category/student_item" onClick={() => setIsCategoryModalOpen(false)} className="hover:text-[#D97706] transition-colors py-2 border-b border-slate-800">
                Student market
              </Link>
              <Link href="/category/electronics" onClick={() => setIsCategoryModalOpen(false)} className="hover:text-[#D97706] transition-colors py-2 border-b border-slate-800">
                Electronics
              </Link>
              <Link href="/category/agriculture" onClick={() => setIsCategoryModalOpen(false)} className="hover:text-[#D97706] transition-colors py-2">
                Agriculture
              </Link>
            </div>

            <button onClick={() => setIsCategoryModalOpen(false)} className="mt-8 w-full py-3 bg-slate-800 rounded-xl font-bold hover:bg-slate-700 transition-colors">
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
