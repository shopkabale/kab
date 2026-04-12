"use client";

import { useState } from "react";
import { FaWhatsapp } from "react-icons/fa";

export default function AboutKabaleOnline() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="bg-white dark:bg-[#1a1a1a] px-4 py-6 border-y border-slate-200 dark:border-slate-800 mt-2">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2 leading-tight">
          Welcome to Kabale Online, your ultimate local shopping destination!
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-2">
          We offer a reliable, affordable, and convenient way to get everything you need delivered straight to your doorstep, anywhere in Kabale and the Kigezi region. From the latest electronics and campus essentials to fresh agricultural produce and trending fashion, we make online shopping safe and enjoyable.
        </p>

        <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              <strong className="text-slate-800 dark:text-slate-200">Shop with 100% Confidence:</strong> Our platform is built on trust. With our strict verification network, you only pay when you receive your exact order. We bridge the gap between trusted local vendors, farmers, and buyers, ensuring high-quality products at unbeatable prices.
            </p>
            
            <div className="bg-[#25D366]/5 p-4 rounded-xl border border-[#25D366]/20">
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

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[#D97706] text-sm font-bold mt-2 hover:underline focus:outline-none flex items-center gap-1"
        >
          {isExpanded ? "Show Less" : "Show More"}
        </button>
      </div>
    </section>
  );
}
