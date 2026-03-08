"use client";

import { useState, useEffect } from "react";

const messages = [
  { prefix: "Adding new", suffix: "Kabale vendors every day." },
  { prefix: "Adding new", suffix: "products everyday." },
  { prefix: "Check back tomorrow for", suffix: "new deals." },
  { prefix: "Check back tomorrow for", suffix: "cheaper deals." },
];

export default function AnnouncementBanner() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 3500); // Changes exactly every 3.5 seconds
    
    return () => clearInterval(timer);
  }, []);

  const { prefix, suffix } = messages[index];

  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-xs sm:text-sm font-bold mb-6 overflow-hidden shadow-sm">
      <span className="animate-pulse">🚀</span>
      <p className="flex gap-1">
        {/* The fixed prefix - GREEN */}
        <span className="text-emerald-600">{prefix}</span>
        
        {/* The sliding suffix - RED */}
        <span 
          key={suffix} 
          className="text-red-500 animate-in slide-in-from-bottom-2 fade-in duration-500"
        >
          {suffix}
        </span>
      </p>
    </div>
  );
}
