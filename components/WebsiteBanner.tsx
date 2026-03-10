"use client";

import { useState, useEffect } from "react";

export default function WebsiteBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hidden = localStorage.getItem("hideWebsiteBanner");
    if (!hidden) setVisible(true);
  }, []);

  const closeBanner = () => {
    localStorage.setItem("hideWebsiteBanner", "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="w-full bg-black text-white flex items-center justify-between px-3 py-2 animate-slideDown">
      
      <div className="text-xs leading-tight">
        <p>Need a website for your business?</p>
        <p>We build affordable websites.</p>
      </div>

      <div className="flex items-center gap-2">
        <a
          href="/contact"
          className="bg-white text-black px-3 py-1 rounded text-xs font-medium"
        >
          Contact us
        </a>

        <button onClick={closeBanner} className="text-white text-sm">
          ✕
        </button>
      </div>

    </div>
  );
}