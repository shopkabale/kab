"use client";

import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";

export default function PromoBanner() {
  const theme = useTheme();

  return (
    <section className="w-full max-w-[1400px] mx-auto px-4 select-none mb-8 sm:mb-12 mt-4">
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-r from-[#FF6A00] to-[#ff914d] flex flex-col md:flex-row items-center justify-between shadow-lg">
        
        {/* Left Side: Text & Call to Action */}
        <div className="w-full md:w-1/2 p-6 sm:p-10 z-20 text-white flex flex-col justify-center items-start md:items-start text-left">
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-widest mb-3">
            Limited Time Offer
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight mb-3">
            Upgrade Your Kitchen. <br />
            <span className="text-white/90">Save up to 40%</span>
          </h2>
          <p className="text-sm sm:text-base text-white/80 mb-6 max-w-sm font-medium">
            Shop top-brand blenders, microwaves, and fridges. Genuine appliances with local Kigezi warranties.
          </p>
          <Link 
            href="/category/appliances" 
            className="bg-white text-[#FF6A00] hover:bg-slate-50 transition-colors duration-300 font-black px-6 py-3 rounded-xl shadow-md active:scale-95"
          >
            Shop Appliances Now
          </Link>
        </div>

        {/* Right Side: Image with Decorative Elements */}
        <div className="w-full md:w-1/2 relative flex justify-end items-end min-h-[200px] md:min-h-[300px] bg-white/10 md:bg-transparent">
          {/* Decorative circle */}
          <div className="absolute top-1/2 right-10 -translate-y-1/2 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
          
          {/* Image Placeholder - use a transparent PNG of an appliance here */}
          <img 
            src="https://images.unsplash.com/photo-1585223237190-8451871f3a2d?w=800&auto=format&fit=crop&q=60" 
            alt="Kitchen Appliances Sale" 
            className="w-[80%] md:w-[90%] h-auto object-contain object-bottom drop-shadow-2xl translate-y-4 pr-4 md:pr-8 mix-blend-multiply md:mix-blend-normal"
          />
        </div>

      </div>
    </section>
  );
}
