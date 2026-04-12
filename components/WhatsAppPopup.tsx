"use client";

import { useState, useEffect } from "react";
import { FaWhatsapp } from "react-icons/fa";

export default function WhatsAppPopup() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasDismissed = localStorage.getItem("kabaleWaDismissed");
    if (!hasDismissed) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 4000); // Pops up after 4 seconds
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem("kabaleWaDismissed", "true");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-[340px] bg-white dark:bg-slate-900 rounded-[24px] shadow-2xl z-[100] border border-slate-200 dark:border-slate-800 p-5 animate-in slide-in-from-bottom-5 fade-in duration-500">
      
      <button 
        onClick={handleClose} 
        className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-50 dark:bg-slate-800 w-7 h-7 rounded-full flex items-center justify-center font-bold"
      >
        ✕
      </button>

      <div className="flex gap-4 items-start pr-6">
        <div className="w-12 h-12 bg-[#25D366]/10 rounded-full flex items-center justify-center flex-shrink-0 text-[#25D366] text-2xl shadow-inner">
          <FaWhatsapp />
        </div>
        <div>
          <h4 className="font-black text-slate-900 dark:text-white text-sm mb-1 tracking-tight">Stay Updated</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed font-medium">
            Join our WhatsApp Channel for new arrivals, exclusive offers & restocks.
          </p>
          <a 
            href="https://whatsapp.com/channel/0029Vb7mKqmKGGGKqH0bvq2D" 
            target="_blank" 
            rel="noreferrer" 
            onClick={handleClose} 
            className="inline-flex items-center justify-center w-full bg-[#25D366] text-white text-xs font-black px-4 py-2.5 rounded-xl active:scale-95 transition-transform shadow-md hover:bg-[#20bd5a]"
          >
            Join Channel Now
          </a>
        </div>
      </div>
    </div>
  );
}
