"use client";

import { useEffect, useState } from "react";

const messages = [
  "🚀 Need a stunning website for your business?",
  "⚡ We build ultra-fast, affordable platforms.",
  "💡 Turn your ideas into reality today!"
];

export default function WebsiteBanner({ onClose }: { onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [animationKey, setAnimationKey] = useState(0); // Used to re-trigger the animation

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
      setAnimationKey((prev) => prev + 1); // Forces the text animation to restart
    }, 4000); // 4 seconds gives time to read and enjoy the animation

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* INLINE ANIMATION STYLES (No extra CSS files needed!) */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shiftGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes elasticDropIn {
          0% { transform: translateY(-150%) scale(0.9); opacity: 0; }
          60% { transform: translateY(15%) scale(1.05); opacity: 1; }
          80% { transform: translateY(-5%) scale(0.98); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes buttonShine {
          0% { left: -100%; }
          20% { left: 100%; }
          100% { left: 100%; }
        }
        .animate-shift-bg {
          background-size: 200% 200%;
          animation: shiftGradient 4s ease infinite;
        }
        .animate-elastic-text {
          animation: elasticDropIn 0.7s cubic-bezier(0.25, 1, 0.5, 1.2) forwards;
          display: inline-block;
        }
        .btn-shine-effect {
          position: relative;
          overflow: hidden;
        }
        .btn-shine-effect::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%);
          transform: skewX(-25deg);
          animation: buttonShine 3s infinite;
        }
      `}} />

      {/* BANNER WRAPPER: Shifting vibrant gradient (Brand Orange + Amber + Rose) */}
      <div className="fixed top-0 left-0 w-full z-[60] h-10 sm:h-11 flex items-center justify-center bg-gradient-to-r from-[#FF6A00] via-[#ff3b00] to-[#ffb100] animate-shift-bg shadow-md border-b border-orange-400/50">

        {/* CENTER GROUP */}
        <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm max-w-[90%] sm:max-w-full">
          
          {/* ANIMATED TEXT */}
          <span 
            key={animationKey} 
            className="font-bold text-white text-shadow-sm animate-elastic-text drop-shadow-md tracking-wide"
          >
            {messages[index]}
          </span>

          {/* PULSING & SHINING BUTTON */}
          <a
            href="https://wa.me/256759997376"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-shine-effect bg-[#1A1A1A] hover:bg-black text-white px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            Contact Us
          </a>
        </div>

        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute right-2 sm:right-4 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center bg-black/10 hover:bg-black/20 rounded-full text-white text-xs font-bold transition-colors"
          aria-label="Close banner"
        >
          ✕
        </button>

      </div>
    </>
  );
}
