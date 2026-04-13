"use client";

import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";

export default function SellCtaBanner() {
  const theme = useTheme();

  return (
    <section className={`relative py-8 md:py-10 overflow-hidden w-full ${theme.bg} ${theme.border} border-y shadow-sm mt-4 transition-colors duration-500`}>
      <div className="relative z-10 w-full max-w-[900px] mx-auto px-4 flex flex-col items-center text-center">
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/10 ${theme.text} text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-4`}>
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${theme.text} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${theme.text}`}></span>
          </span>
          Kabale Seller Network
        </div>

        <h2 className={`text-3xl sm:text-4xl md:text-5xl font-black mb-3 ${theme.text} tracking-tight leading-tight`}>
          Turn your items into <span className="bg-white text-slate-900 px-2 rounded-lg">cash instantly.</span>
        </h2>

        <p className={`text-sm md:text-base ${theme.text} opacity-90 mb-6 leading-relaxed font-medium max-w-xl mx-auto`}>
          Reach thousands of buyers across Kabale.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto justify-center">
          <Link href="/sell" className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-900 font-black text-sm md:text-base rounded-xl transition-all shadow-md hover:scale-105 w-full sm:w-auto">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 4.5v15m7.5-7.5h-15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Post an Item to Sell
          </Link>
          <a href="https://wa.me/256759997376?text=Hello,%20I%20need%20support%20with%20Kabale%20Online" target="_blank" rel="noopener noreferrer" className={`flex items-center justify-center gap-2 px-6 py-3 bg-black/10 hover:bg-black/20 ${theme.text} font-bold text-sm md:text-base rounded-xl transition-all w-full sm:w-auto`}>
            <svg className="w-4 h-4 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp Support
          </a>
        </div>
      </div>
    </section>
  );
}
