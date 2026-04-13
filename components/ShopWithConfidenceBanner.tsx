"use client";

import { useTheme } from "@/components/ThemeProvider";

export default function ShopWithConfidenceBanner() {
  const theme = useTheme();
  
  return (
    <section className={`${theme.bg} ${theme.border} border-y shadow-sm px-4 py-4 flex flex-col items-center gap-3 transition-colors duration-500`}>
      <div className="text-center max-w-lg">
        <h1 className={`text-sm sm:text-base font-black ${theme.text} tracking-wide mb-1`}>
          Shop With 100% Confidence
        </h1>
        <p className={`text-xs sm:text-sm font-medium ${theme.text} opacity-90`}>
          Look for what you need, order it, and <span className="bg-white/20 px-1 rounded font-black">pay ONLY after checking</span> if it is the exact product you ordered.
        </p>
      </div>
      <a href="tel:+256759997376" className="flex items-center justify-center gap-2 text-[11px] sm:text-xs font-bold bg-white text-slate-900 px-4 py-2 rounded-full transition-all shadow-sm hover:scale-105 active:scale-95">
        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        Tap to call (0759997376) to report a scam or undelivery
      </a>
    </section>
  );
}
