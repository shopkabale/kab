"use client";

import { useTheme } from "@/components/ThemeProvider";

export default function ShopWithConfidenceBanner() {
  const theme = useTheme();

  return (
    <div className="w-full">
      {/* MODERN UI CARD: Deep premium background, full width, sharp corners */}
      <section className="relative py-8 sm:py-10 px-4 overflow-hidden w-full bg-slate-900 shadow-xl flex flex-col items-center gap-4">

        {/* AMBIENT GLOW: The color of the day glowing softly from the top */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[80%] sm:w-[400px] h-[300px] rounded-full blur-[80px] opacity-30 ${theme.bg} pointer-events-none transition-colors duration-700 -translate-y-1/2`} />

        {/* Themed Security/Trust Icon */}
        <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full ${theme.bg} shadow-lg mb-1 transition-colors duration-500`}>
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>

        <div className="relative z-10 text-center max-w-lg">
          <h2 className="text-lg sm:text-xl font-black text-white tracking-wide mb-2">
            Shop With 100% Confidence
          </h2>
          <p className="text-xs sm:text-sm font-medium text-slate-300 leading-relaxed">
            Look for what you need, order it, and <span className="text-white font-bold bg-white/10 px-1.5 py-0.5 rounded-md border border-white/10">pay ONLY after checking</span> if it is the exact product you ordered.
          </p>
        </div>

        {/* Frosted Glass Warning Button */}
        <a 
          href="tel:+256759997376" 
          className="relative z-10 flex items-center justify-center gap-2 text-[11px] sm:text-xs font-bold bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 text-white px-5 py-3 rounded-full transition-all shadow-sm w-full sm:w-auto mt-2 active:scale-95"
        >
          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Tap to call (0759997376) to report a scam or undelivery
        </a>
      </section>
    </div>
  );
}
