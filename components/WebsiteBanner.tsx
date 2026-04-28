"use client";

import { useState } from "react";

// The confidence-building trust signals
const trustSignals = [
  "🔒 100% Secure Escrow Payments via MTN & Airtel",
  "⚡ Fast Delivery Across Kabale & Kigezi",
  "🛡️ Buyer Protection Guarantee on All Orders",
  "✅ Verified Local Sellers & Official Brands",
  "⭐ Trusted by Campus Students & Residents"
];

export default function WebsiteBanner({ onClose }: { onClose: () => void }) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const handleClose = () => {
    setIsVisible(false);
    onClose();
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          display: flex;
          width: max-content;
          animation: marquee 25s linear infinite;
        }
        /* Pause the animation if the user hovers over it to read */
        .ticker-container:hover .animate-ticker {
          animation-play-state: paused;
        }
      `}} />

      {/* BANNER WRAPPER: Sleek Dark Mode style for "Breaking News" feel */}
      <div className="fixed top-0 left-0 w-full z-[60] h-8 sm:h-10 bg-[#1A1A1A] text-white flex items-center overflow-hidden border-b border-[#FF6A00]/30 ticker-container shadow-md">

        {/* SCROLLING CONTENT 
          We render the array TWICE side-by-side so the infinite loop is perfectly seamless.
        */}
        <div className="animate-ticker flex items-center">
          {[...trustSignals, ...trustSignals].map((signal, index) => (
            <div key={index} className="flex items-center whitespace-nowrap">
              <span className="text-[11px] sm:text-xs font-bold tracking-wide">
                {/* Highlight the first emoji/word using orange for pop */}
                <span className="text-[#FF6A00] mr-1">{signal.split(' ')[0]}</span>
                {signal.substring(signal.indexOf(' ') + 1)}
              </span>
              {/* Separator Dot */}
              <span className="mx-4 sm:mx-8 text-[#6B6B6B] text-xs">●</span>
            </div>
          ))}
        </div>

        {/* CLOSE BUTTON - Fixed to the right side */}
        <div className="absolute right-0 top-0 h-full px-2 sm:px-4 bg-gradient-to-l from-[#1A1A1A] via-[#1A1A1A] to-transparent flex items-center justify-end z-10">
          <button
            onClick={handleClose}
            className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center bg-white/10 hover:bg-[#FF6A00] rounded-full text-white text-[10px] sm:text-xs font-bold transition-colors"
            aria-label="Close banner"
          >
            ✕
          </button>
        </div>

      </div>
    </>
  );
}
