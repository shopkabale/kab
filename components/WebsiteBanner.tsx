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
<div className="fixed top-0 left-0 w-full bg-black text-white z-[60] h-8 flex items-center">

  {/* CENTERED ROTATING TEXT */}
  <div className="absolute left-1/2 -translate-x-1/2 text-xs text-center">
    <span key={index} className="animate-dropIn">
      {messages[index]}
    </span>
  </div>

  {/* RIGHT SIDE BUTTONS */}
  <div className="ml-auto flex items-center gap-3 pr-4">
    <a
      href="https://wa.me/256759997376"
      target="_blank"
      className="bg-white text-black px-3 py-[2px] rounded text-xs font-semibold"
    >
      Contact
    </a>

    <button
      onClick={onClose}
      className="text-white text-xs hover:text-gray-300"
    >
      ✕
    </button>
  </div>

</div>

);
}