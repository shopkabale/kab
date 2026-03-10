"use client";

import { useEffect, useState } from "react";

const messages = [
  "Need a website for your business?",
  "We build affordable websites.",
];

export default function WebsiteBanner({ onClose }: { onClose: () => void }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full bg-black text-white z-[60] flex items-center justify-between px-4 h-8 text-xs">

      {/* ROTATING TEXT */}
      <span key={index} className="animate-dropIn">
        {messages[index]}
      </span>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-3">
        <a
          href="https://wa.me/256759997376"
          target="_blank"
          className="bg-white text-black px-3 py-[2px] rounded text-xs"
        >
          Contact
        </a>

        <button onClick={onClose}>✕</button>
      </div>
    </div>
  );
}