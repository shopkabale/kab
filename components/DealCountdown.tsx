"use client";

import { useState, useEffect } from "react";

export default function DealCountdown({ endTime }: { endTime: string }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const calculateTimeLeft = () => {
      const difference = new Date(endTime).getTime() - new Date().getTime();
      if (difference > 0) {
        setTimeLeft({
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  if (!isMounted) return null;

  return (
    <div className="flex items-center gap-1.5 text-white text-sm sm:text-base font-bold mt-3 sm:mt-0">
      <span className="text-xs font-medium mr-1 uppercase tracking-wider opacity-90">Time Left:</span>
      <div className="bg-black/20 px-2 py-1 rounded backdrop-blur-sm min-w-[32px] text-center shadow-inner">
        {String(timeLeft.hours).padStart(2, '0')}h
      </div>
      <span>:</span>
      <div className="bg-black/20 px-2 py-1 rounded backdrop-blur-sm min-w-[32px] text-center shadow-inner">
        {String(timeLeft.minutes).padStart(2, '0')}m
      </div>
      <span>:</span>
      <div className="bg-black/20 px-2 py-1 rounded backdrop-blur-sm min-w-[32px] text-center shadow-inner">
        {String(timeLeft.seconds).padStart(2, '0')}s
      </div>
    </div>
  );
}
