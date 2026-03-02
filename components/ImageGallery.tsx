"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

interface ImageGalleryProps {
  images: string[];
  title: string;
}

export default function ImageGallery({ images, title }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false); // Controls the fullscreen popup
  
  // Mobile Swipe Refs
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Lock the website background from scrolling when the Lightbox is open
  useEffect(() => {
    if (isLightboxOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    // Cleanup function
    return () => { document.body.style.overflow = "unset"; };
  }, [isLightboxOpen]);

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
      setActiveIndex((prev) => prev + 1); // Swipe Left
    }
    if (distance < -50 && activeIndex > 0) {
      setActiveIndex((prev) => prev - 1); // Swipe Right
    }
    
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  // --- LIGHTBOX NAVIGATION ---
  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeIndex < images.length - 1) setActiveIndex(prev => prev + 1);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeIndex > 0) setActiveIndex(prev => prev - 1);
  };

  return (
    <div className="flex flex-col gap-4">
      
      {/* 1. Main Stage Image */}
      <div 
        className="relative aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 cursor-zoom-in group"
        onClick={() => setIsLightboxOpen(true)} // Opens the Lightbox!
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={images[activeIndex]}
          alt={`${title} - Image ${activeIndex + 1}`}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Expand Icon Hint (Shows on hover for desktop users) */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm text-slate-700 hidden md:block">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </div>

        {/* Mobile Counter Badge */}
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
              <Image src={img} alt={`Thumbnail ${idx + 1}`} fill className="object-cover" sizes="80px" loading={idx === 0 ? "eager" : "lazy"} />
            </button>
          ))}
        </div>
      )}

      {/* 3. THE FULLSCREEN LIGHTBOX OVERLAY */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)} // Closes when clicking the blurred background
        >
          {/* Close 'X' Button */}
          <button 
            className="absolute top-4 right-4 md:top-8 md:right-8 text-white/70 hover:text-white p-2 transition-colors z-[110] bg-black/50 hover:bg-black/80 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              setIsLightboxOpen(false);
            }}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          {/* Prev Arrow (Desktop) */}
          {images.length > 1 && activeIndex > 0 && (
            <button 
              className="absolute left-4 md:left-8 text-white/70 hover:text-white p-3 transition-colors z-[110] bg-black/50 hover:bg-black/80 rounded-full hidden sm:block"
              onClick={prevImage}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
          )}

          {/* Next Arrow (Desktop) */}
          {images.length > 1 && activeIndex < images.length - 1 && (
            <button 
              className="absolute right-4 md:right-8 text-white/70 hover:text-white p-3 transition-colors z-[110] bg-black/50 hover:bg-black/80 rounded-full hidden sm:block"
              onClick={nextImage}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          )}

          {/* Fullsize Image Container */}
          <div 
            className="relative w-full h-full max-w-6xl max-h-[85vh] m-4 cursor-default"
            onClick={(e) => e.stopPropagation()} // Prevents clicking the actual image from closing the lightbox
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Image
              src={images[activeIndex]}
              alt={`${title} - Fullscreen`}
              fill
              className="object-contain" // object-contain ensures the whole image fits on screen without cropping
              sizes="100vw"
              priority
            />
          </div>

          {/* Counter inside Lightbox */}
          {images.length > 1 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs tracking-widest font-bold px-4 py-2 rounded-full z-[110]">
              {activeIndex + 1} / {images.length}
            </div>
          )}
        </div>
      )}

    </div>
  );
}