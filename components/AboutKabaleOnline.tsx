"use client";

import { useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { useTheme } from "@/components/ThemeProvider"; // 🔥 IMPORT THEME PROVIDER

export default function AboutKabaleOnline() {
  const [isExpanded, setIsExpanded] = useState(false);
  const theme = useTheme(); // 🔥 GET CURRENT DAY THEME

  return (
    <section className="bg-white dark:bg-[#1a1a1a] px-4 py-8 border-y border-slate-200 dark:border-slate-800 mt-2">
      <div className="max-w-4xl mx-auto text-center">
        
        {/* 🔥 THEMED TITLE: Uses the bg-clip trick to turn the background color into text color */}
        <h2 className={`text-xl md:text-2xl font-black ${theme.bg} bg-clip-text text-transparent tracking-tight mb-4 leading-tight transition-colors duration-500`}>
          Welcome to Kabale Online, your ultimate online shopping destination!
        </h2>
        
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-2 text-left">
          We offer a reliable, affordable, and convenient way to get everything you need delivered straight to your doorstep, anywhere in Kabale and the Kigezi region. From the latest electronics and smartphones to fashion, daily groceries, and home essentials, we make online shopping easy, secure, and enjoyable.
        </p>

        <div className={`grid transition-all duration-300 ease-in-out text-left ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              <strong className="text-slate-800 dark:text-slate-200">Shop with 100% Confidence:</strong> Our platform is built on trust. With our strict verification network, you only pay when you receive your exact order. We bridge the gap between trusted local vendors, farmers, and buyers, ensuring high-quality products at unbeatable prices.
            </p>

            <div className="bg-[#25D366]/5 p-4 rounded-xl border border-[#25D366]/20 mt-4">
              <h3 className="text-[#25D366] font-bold flex items-center gap-2 mb-2">
                <FaWhatsapp className="text-lg" />
                Why Join Our WhatsApp Channel?
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
                Be the first to know! We post exclusive flash sales, restock alerts for high-demand items, and special localized deals directly to our channel. Stay ahead of the crowd and never miss out on the best bargains in town.
              </p>
              <a 
                href="https://whatsapp.com/channel/0029Vb7mKqmKGGGKqH0bvq2D" 
                target="_blank" 
                rel="noreferrer" 
                className="inline-flex bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-black px-5 py-2.5 rounded-lg transition-colors shadow-sm active:scale-95"
              >
                Join Channel Now
              </a>
            </div>
          </div>
        </div>

        {/* 🔥 THEMED BUTTON: perfectly matches the Jumia screenshot style */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`mt-4 text-base font-black ${theme.bg} bg-clip-text text-transparent hover:opacity-70 focus:outline-none transition-all duration-300`}
        >
          {isExpanded ? "Show Less" : "Show More"}
        </button>

      </div>
    </section>
  );
}
