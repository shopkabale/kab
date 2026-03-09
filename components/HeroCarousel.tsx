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
        // Slightly taller to accommodate the zoomed-in images perfectly
        className="h-[220px] md:h-[400px] w-full bg-[#fbbf24]" 
      >
        {slides.map((slide, i) => (
          // UPGRADED: Increased horizontal padding (px-8 md:px-16) to push text inward
          <SwiperSlide key={i} className="flex relative items-center justify-between px-8 md:px-16 py-6 md:py-12 overflow-hidden">

            {/* TEXT CONTENT (Left side) */}
            <div className="relative z-20 max-w-[55%] md:max-w-lg text-slate-900">
              <h2 className="text-2xl md:text-5xl lg:text-6xl font-black mb-2 md:mb-4 leading-[1.1] tracking-tight drop-shadow-sm">
                {slide.title}
              </h2>
              <p className="text-[11px] md:text-lg mb-5 font-medium opacity-90 hidden sm:block max-w-sm">
                {slide.subtitle}
              </p>
              {/* UPGRADED: Thicker button with a hover scale effect for a premium feel */}
              <Link href={slide.href} className="inline-block bg-slate-900 text-white px-6 py-2.5 md:px-10 md:py-4 rounded-full font-bold text-[10px] md:text-sm uppercase shadow-xl hover:bg-slate-800 hover:scale-105 transition-all duration-300">
                {slide.btnText}
              </Link>
            </div>

            {/* IMAGE CONTENT (Right side) */}
            {/* UPGRADED: Brought inward (right-0 md:right-8) and made taller to pop out of the bottom */}
            <div className="absolute right-0 md:right-8 bottom-[-5%] md:bottom-[-10%] h-[105%] md:h-[120%] w-[60%] md:w-[50%] flex items-end justify-center z-10 pointer-events-none">
               {/* UPGRADED: Added scale-110/125 to zoom the image, and drop-shadow-2xl to make it float */}
               <div className="w-full h-full relative transform scale-110 md:scale-125 origin-bottom-right">
                  <Image 
                    src={slide.image} 
                    alt={slide.title} 
                    fill 
                    className="object-contain object-bottom drop-shadow-2xl"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
               </div>
            </div>

            {/* GRADIENT OVERLAY */}
            {/* UPGRADED: Constrained width to 75% so it protects the text but leaves the right-side image vibrant */}
            <div className="absolute top-0 left-0 bottom-0 w-[75%] bg-gradient-to-r from-[#fbbf24] via-[#fbbf24]/90 to-transparent z-0 pointer-events-none"></div>
            
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
