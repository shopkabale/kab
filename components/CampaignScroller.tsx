"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProductCard from "./ProductCard";
import { Zap, ArrowRight } from "lucide-react";

interface CampaignScrollerProps {
  title: string;
  endTime: string; // ISO string e.g., "2026-05-20T00:00:00Z"
  products: any[];
  campaignSlug: string; // e.g., "flash-sales"
}

export default function CampaignScroller({ title, endTime, products, campaignSlug }: CampaignScrollerProps) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isMounted, setIsMounted] = useState(false);

  // Live Countdown Timer Logic
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

  if (!products || products.length === 0) return null;

  return (
    <div className="w-full bg-white dark:bg-[#151515] rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 mb-6">
      
      {/* 🔴 THE CAMPAIGN HEADER */}
      <div className="bg-gradient-to-r from-[#FF6A00] to-[#e65f00] px-4 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        <div className="flex items-center gap-2 text-white">
          <Zap className="w-5 h-5 sm:w-6 sm:h-6 fill-white animate-pulse" />
          <h2 className="text-lg sm:text-xl font-black uppercase tracking-widest">
            {title}
          </h2>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-6">
          {/* Ticking Clock */}
          {isMounted && (
            <div className="flex items-center gap-1.5 text-white text-sm sm:text-base font-bold">
              <span className="text-xs font-medium mr-1 uppercase tracking-wider opacity-90">Time Left:</span>
              <div className="bg-black/20 px-2 py-1 rounded backdrop-blur-sm min-w-[32px] text-center">
                {String(timeLeft.hours).padStart(2, '0')}h
              </div>
              <span>:</span>
              <div className="bg-black/20 px-2 py-1 rounded backdrop-blur-sm min-w-[32px] text-center">
                {String(timeLeft.minutes).padStart(2, '0')}m
              </div>
              <span>:</span>
              <div className="bg-black/20 px-2 py-1 rounded backdrop-blur-sm min-w-[32px] text-center">
                {String(timeLeft.seconds).padStart(2, '0')}s
              </div>
            </div>
          )}

          {/* See All Link */}
          <Link 
            href={`/deals?campaign=${campaignSlug}`} 
            className="flex items-center gap-1 text-white text-xs font-bold uppercase tracking-widest hover:text-black transition-colors shrink-0"
          >
            See All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 🛍️ THE PRODUCTS */}
      <div className="p-3 sm:p-5 bg-slate-50 dark:bg-[#111]">
        <div className="flex overflow-x-auto gap-3 sm:gap-4 pb-4 snap-x snap-mandatory no-scrollbar">
          {products.map((product) => (
            <div key={product.id} className="flex-none w-[160px] sm:w-[200px] snap-start">
              {/* Reusing your exact ProductCard */}
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
