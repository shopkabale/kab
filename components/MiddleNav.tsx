"use client";

import { useState } from "react";
import Link from "next/link";

export default function MiddleNav() {
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  return (
    <>
      {/* Horizontal Nav Bar */}
      <div className="flex justify-center gap-3 overflow-x-auto py-4 no-scrollbar px-4 w-full max-w-[1200px] mx-auto">
        <button 
          onClick={() => setIsCategoryModalOpen(true)}
          className="px-6 py-3 bg-slate-800 dark:bg-slate-200 text-white dark:text-black rounded-full text-sm font-bold whitespace-nowrap shadow-md transition-transform active:scale-95"
        >
          Categories
        </button>
        <button className="px-6 py-3 bg-slate-800 dark:bg-slate-200 text-white dark:text-black rounded-full text-sm font-bold whitespace-nowrap shadow-md transition-transform active:scale-95">
          AI
        </button>
        <button className="px-6 py-3 bg-slate-800 dark:bg-slate-200 text-white dark:text-black rounded-full text-sm font-bold whitespace-nowrap shadow-md transition-transform active:scale-95">
          Sell
        </button>
      </div>

      {/* Categories Bottom Sheet / Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 transition-opacity">
          <div className="bg-[#1a1a1a] w-full sm:w-[400px] rounded-t-3xl sm:rounded-3xl p-6 text-white animate-slide-up">
            <div className="w-12 h-1 bg-slate-600 rounded-full mx-auto mb-6"></div>
            <h3 className="text-center text-xl font-bold mb-6">Categories</h3>
            
            <div className="flex flex-col gap-4 text-lg">
              <Link 
                href="/officialStore" 
                onClick={() => setIsCategoryModalOpen(false)}
                className="hover:text-[#D97706] transition-colors py-2 border-b border-slate-800"
              >
                Official Store
              </Link>
              <Link 
                href="/category/student_item" 
                onClick={() => setIsCategoryModalOpen(false)}
                className="hover:text-[#D97706] transition-colors py-2 border-b border-slate-800"
              >
                Student market
              </Link>
              <Link 
                href="/category/electronics" 
                onClick={() => setIsCategoryModalOpen(false)}
                className="hover:text-[#D97706] transition-colors py-2 border-b border-slate-800"
              >
                Electronics
              </Link>
              <Link 
                href="/category/agriculture" 
                onClick={() => setIsCategoryModalOpen(false)}
                className="hover:text-[#D97706] transition-colors py-2"
              >
                Agriculture
              </Link>
            </div>

            <button 
              onClick={() => setIsCategoryModalOpen(false)}
              className="mt-8 w-full py-3 bg-slate-800 rounded-xl font-bold hover:bg-slate-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
