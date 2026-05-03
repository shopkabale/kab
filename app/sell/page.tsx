"use client";

import Link from "next/link";
import { FaWhatsapp, FaPhoneAlt, FaArrowLeft, FaShieldAlt } from "react-icons/fa";

export default function UploadRestrictedPage() {
  const adminPhone = "256759997376";
  const displayPhone = "0759 997 376";
  
  // Pre-fills a message so it's effortless for them to reach out
  const whatsappMessage = encodeURIComponent("Hello! I have some products I would like to sell on Kabale Online.");

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-5 font-sans selection:bg-amber-100">
      <div className="w-full max-w-sm text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* ICON */}
        <div className="w-20 h-20 bg-amber-50 border-4 border-amber-100/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
          <FaShieldAlt className="text-3xl text-[#D97706]" />
        </div>

        {/* HEADINGS */}
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-3 tracking-tight leading-tight">
          Public Uploads <br/> Disabled.
        </h1>
        <p className="text-slate-500 text-[14px] leading-relaxed mb-8 px-2 font-medium">
          To guarantee 100% quality and security for our buyers, products must now be verified and uploaded exclusively by the site administrators.
        </p>

        {/* ACTION BUTTONS */}
        <div className="flex flex-col gap-3 w-full mb-10">
          <a 
            href={`https://wa.me/${adminPhone}?text=${whatsappMessage}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-black py-4 rounded-2xl shadow-[0_8px_20px_rgb(37,211,102,0.25)] transition-all flex items-center justify-center gap-2 text-[15px] active:scale-[0.98]"
          >
            <FaWhatsapp className="text-[20px]" /> 
            Message Admin on WhatsApp
          </a>

          <a 
            href={`tel:+${adminPhone}`} 
            className="w-full bg-white border-2 border-slate-100 text-slate-700 hover:border-slate-200 hover:bg-slate-50 font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-[15px] active:scale-[0.98] shadow-sm"
          >
            <FaPhoneAlt className="text-[14px] text-slate-400" /> 
            Call Admin ({displayPhone})
          </a>
        </div>

        {/* BACK LINK */}
        <Link 
          href="/profile" 
          className="inline-flex items-center gap-2 text-slate-400 font-bold text-[11px] hover:text-slate-900 transition-colors uppercase tracking-widest"
        >
          <FaArrowLeft /> Return to Dashboard
        </Link>
        
      </div>
    </div>
  );
}
