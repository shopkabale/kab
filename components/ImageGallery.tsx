"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface ImageGalleryProps {
  images: string[];
  title: string;
}

export default function ImageGallery({ images, title }: ImageGalleryProps) {
  // Using an index instead of the image string makes swiping easier
  const [activeIndex, setActiveIndex] = useState(0);
  
  // Desktop Zoom State
  const [zoomCoords, setZoomCoords] = useState({ x: 0, y: 0 });
  const [isZoomed, setIsZoomed] = useState(false);
  
  // Mobile Swipe Refs
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-200 shadow-sm">
        <div className="text-center">
          <span className="text-4xl block mb-2">📷</span>
          <span className="text-sm font-medium">No Image Available</span>
        </div>
      </div>
    );
  }

  // --- DESKTOP ZOOM LOGIC ---
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomCoords({ x, y });
  };

  // --- MOBILE SWIPE LOGIC ---
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    
    if (distance > 50 && activeIndex < images.length - 1) {
      setActiveIndex((prev) => prev + 1); // Swipe Left -> Next Image
    }
    if (distance < -50 && activeIndex > 0) {
      setActiveIndex((prev) => prev - 1); // Swipe Right -> Prev Image
    }
    
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  return (
    <div className="flex flex-col gap-4">
      
      {/* 1. Main Stage Image (Lighthouse Style) */}
      <div 
        className="relative aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 cursor-crosshair group"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={images[activeIndex]}
          alt={`${title} - Image ${activeIndex + 1}`}
          fill
          priority // Preloads the first image for blazing fast LCP
          sizes="(max-width: 768px) 100vw, 50vw"
          className={`object-cover transition-transform duration-200 ease-out ${isZoomed ? "scale-[1.75]" : "scale-100"}`}
          style={isZoomed ? { transformOrigin: `${zoomCoords.x}% ${zoomCoords.y}%` } : { transformOrigin: "center" }}
        />

        {/* Mobile Image Counter Badge */}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-slate-900/70 backdrop-blur-md text-white text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full md:hidden shadow-lg z-10">
            {activeIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* 2. Scrollable Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all snap-start ${
                activeIndex === idx 
                  ? "border-primary shadow-md opacity-100 ring-2 ring-primary/20 ring-offset-1" 
                  : "border-transparent opacity-50 hover:opacity-100 hover:border-slate-300"
              }`}
            >
              <Image 
                src={img} 
                alt={`${title} thumbnail ${idx + 1}`} 
                fill 
                className="object-cover" 
                sizes="80px" 
                loading={idx === 0 ? "eager" : "lazy"} // Lazy loads thumbnails
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}