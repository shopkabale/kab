"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import Link from "next/link";
import Image from "next/image";

export default function HeroCarousel() {
  const slides = [
    {
      title: "The better way to buy and sell in Kabale",
      subtitle: "Join the fastest growing marketplace.",
      btnText: "EXPLORE",
      href: "/products",
      image: "/hero-main.png" // MAKE SURE THESE ARE TRANSPARENT PNGs
    },
    {
      title: "Students Shopping Made Easy",
      subtitle: "Textbooks, hostel gear, and campus essentials.",
      btnText: "STUDENT MARKET",
      href: "/category/student_item",
      image: "/hero-student.png"
    },
    {
      title: "Quality Gadgets & Electronics",
      subtitle: "Phones, laptops, and accessories delivered.",
      btnText: "SHOP ELECTRONICS",
      href: "/category/electronics",
      image: "/hero-electronics.png"
    },
    {
      title: "Fresh Local Produce",
      subtitle: "Farm to table. Support Kabale agriculture.",
      btnText: "SHOP FOOD",
      href: "/category/agriculture",
      image: "/hero-agric.png"
    }
  ];

  return (
    // FULL WIDTH ON MOBILE: -mx-4 pulls it to the edges of the screen
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 sm:rounded-2xl overflow-hidden shadow-sm mb-6">
      <Swiper
        modules={[Autoplay, Pagination]}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        // Set the background color here so it's the SAME background for text and image
        className="h-[220px] md:h-[400px] w-full bg-[#fbbf24] transition-colors duration-500" 
      >
        {slides.map((slide, i) => (
          // We removed 'justify-between' so elements don't push apart
          <SwiperSlide key={i} className="flex relative items-center p-8 md:p-16 overflow-hidden">

            {/* TEXT CONTENT (Top layer, left side) */}
            <div className="relative z-20 max-w-[60%] md:max-w-xl text-slate-900 drop-shadow-sm">
              <h2 className="text-2xl md:text-5xl lg:text-6xl font-black mb-2 md:mb-4 leading-[1.1] tracking-tight">
                {slide.title}
              </h2>
              <p className="text-[11px] md:text-lg mb-5 font-medium opacity-90 hidden sm:block max-w-md">
                {slide.subtitle}
              </p>
              <Link href={slide.href} className="inline-block bg-slate-900 text-white px-6 py-2.5 md:px-10 md:py-4 rounded-full font-bold text-[10px] md:text-sm uppercase shadow-xl hover:bg-slate-800 hover:scale-105 transition-all duration-300">
                {slide.btnText}
              </Link>
            </div>

            {/* IMAGE CONTENT (Middle layer, right side) */}
            {/* The 'right-0' and 'bottom-0' make it sit perfectly in the corner */}
            <div className="absolute right-0 bottom-0 h-[100%] md:h-[110%] w-[60%] md:w-[50%] flex items-end justify-center z-10 pointer-events-none">
               {/* We added scale to zoom it in slightly, and origin-bottom-right to keep it pinned to the corner */}
               <div className="w-full h-full relative transform scale-105 md:scale-115 origin-bottom-right">
                  <Image 
                    src={slide.image} 
                    alt={slide.title} 
                    fill 
                    // object-bottom pins it, and object-contain ensures it doesn't stretch
                    className="object-contain object-bottom drop-shadow-2xl" 
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
               </div>
            </div>

            {/* SUBTLE GRADIENT OVERLAY (Bottom layer, only on left side) */}
            {/* This ensures text is readable if the image background is complex, without splitting the image away */}
            <div className="absolute top-0 left-0 bottom-0 w-[60%] bg-gradient-to-r from-[#fbbf24] via-[#fbbf24]/90 to-transparent z-0 pointer-events-none"></div>
            
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
