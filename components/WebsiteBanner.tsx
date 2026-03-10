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
}, 3000); // 3 seconds

return () => clearInterval(interval);

}, []);

return (
<div className="fixed top-0 left-0 w-full bg-black text-white z-[60] h-8 flex items-center justify-center">

  {/* CENTER GROUP (TEXT + BUTTON) */}
  <div className="flex items-center gap-6 text-xs">
    <span key={index} className="animate-dropIn">
      {messages[index]}
    </span>

    <a
      href="https://wa.me/256759997376"
      target="_blank"
      className="bg-white text-black px-3 py-[2px] rounded text-xs font-semibold"
    >
      Contact
    </a>
  </div>

  {/* CLOSE BUTTON */}
  <button
    onClick={onClose}
    className="absolute right-4 text-white text-xs hover:text-gray-300"
  >
    ✕
  </button>

</div>

);
}