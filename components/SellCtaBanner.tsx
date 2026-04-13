"use client";

import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";

export default function SellCtaBanner() {
  const theme = useTheme();

  return (
    <div className="px-2 sm:px-4 py-4 w-full max-w-[1200px] mx-auto">
      {/* 🔥 MODERN UI CARD 
        Instead of a solid wall of color, we use a premium dark card with rounded corners.
      */}
      <section className="relative py-12 md:py-16 overflow-hidden w-full bg-slate-900 rounded-[32px] shadow-2xl">
        
        {/* 🔥 THE AMBIENT GLOW: This takes the day's color and turns it into a soft light behind the text */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] sm:w-[600px] h-[600px] rounded-full blur-[100px] opacity-40 ${theme.bg} pointer-events-none transition-colors duration-700`} />

        <div className="relative z-10 w-full max-w-[900px] mx-auto px-4 flex flex-col items-center text-center">
          
          {/* Top Pill - Glass effect */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-6 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${theme.bg} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${theme.bg}`}></span>
            </span>
            Kabale Seller Network
          </div>

          {/* Title - Popping out with a slightly tilted highlight block */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-5 text-white tracking-tight leading-tight">
            Turn your items into <br className="sm:hidden" />
            <span className="inline-block mt-2 sm:mt-0 px-4 py-1 rounded-xl bg-white text-slate-900 shadow-lg transform -rotate-1">
              cash instantly.
            </span>
          </h2>

          <p className="text-sm md:text-base text-slate-300 mb-8 leading-relaxed font-medium max-w-xl mx-auto">
            Join hundreds of locals making money every day. Reach thousands of buyers across Kabale with zero upfront fees.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto justify-center">
            
            {/* 🔥 PRIMARY BUTTON: Uses the exact day's color for maximum clickability */}
            <Link 
              href="/sell" 
              className={`flex items-center justify-center gap-2 px-8 py-3.5 ${theme.bg} ${theme.text} font-black text-sm md:text-base rounded-xl transition-all shadow-lg hover:scale-105 hover:shadow-xl w-full sm:w-auto`}
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 4.5v15m7.5-7.5h-15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Start Selling Now
            </Link>
            
            {/* Secondary Button - Frosted Glass effect */}
            <a 
              href="https://wa.me/256759997376?text=Hello,%20I%20need%20support%20with%20Kabale%20Online" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center justify-center gap-2 px-8 py-3.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-sm md:text-base rounded-xl transition-all backdrop-blur-md w-full sm:w-auto"
            >
              <svg className="w-5 h-5 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp Support
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
