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
      image: "/hero-main.png" // ADD YOUR IMAGE TO /public FOLDER
    },
    {
      title: "Students Shopping Made Easy",
      subtitle: "Textbooks, hostel gear, and campus essentials.",
      btnText: "STUDENT MARKET",
      href: "/category/student_item",
      image: "/hero-student.png" // ADD YOUR IMAGE TO /public FOLDER
    },
    {
      title: "Quality Gadgets & Electronics",
      subtitle: "Phones, laptops, and accessories delivered.",
      btnText: "SHOP ELECTRONICS",
      href: "/category/electronics",
      image: "/hero-electronics.png" // ADD YOUR IMAGE TO /public FOLDER
    },
    {
      title: "Fresh Local Produce",
      subtitle: "Farm to table. Support Kabale agriculture.",
      btnText: "SHOP FOOD",
      href: "/category/agriculture",
      image: "/hero-agric.png" // ADD YOUR IMAGE TO /public FOLDER
    }
  ];

  return (
    // FULL WIDTH ON MOBILE: -mx-4 pulls it to the edges of the screen
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 sm:rounded-2xl overflow-hidden shadow-sm mb-6">
      <Swiper
        modules={[Autoplay, Pagination]}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        className="h-[200px] md:h-[350px] w-full bg-[#fbbf24]" // Base Yellow Color
      >
        {slides.map((slide, i) => (
          <SwiperSlide key={i} className="flex relative items-center justify-between p-6 md:p-12 overflow-hidden">
            
            {/* Text Content (Left side) */}
            <div className="relative z-10 max-w-[60%] md:max-w-md text-slate-900">
              <h2 className="text-xl md:text-5xl font-black mb-1 md:mb-3 leading-tight tracking-tight">
                {slide.title}
              </h2>
              <p className="text-[10px] md:text-lg mb-4 font-medium opacity-90 hidden sm:block">
                {slide.subtitle}
              </p>
              <Link href={slide.href} className="inline-block bg-slate-900 text-white px-5 py-2 md:px-8 md:py-3 rounded-full font-bold text-[10px] md:text-sm uppercase shadow-md hover:bg-slate-800 transition-colors mt-2">
                {slide.btnText}
              </Link>
            </div>

            {/* Image (Right side) */}
            <div className="absolute right-[-10%] md:right-10 bottom-0 h-[90%] w-[55%] md:w-[40%] flex items-end justify-center">
               <div className="w-full h-full relative">
                  <Image 
                    src={slide.image} 
                    alt={slide.title} 
                    fill 
                    className="object-contain object-bottom"
                    onError={(e) => {
                      // Fallback: hides the broken image icon until you add the actual files
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
               </div>
            </div>
            
            {/* Subtle Gradient Overlay so text is always readable over the yellow */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#fbbf24] via-[#fbbf24]/90 to-transparent z-0"></div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
