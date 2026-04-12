"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import Image from "next/image";

export default function HeroCarousel() {
  const promos = [
    {
      id: 1,
      tag: "Limited time!",
      title: "Get Special Offer",
      discountNum: "40",
      terms: "All Items Available | T&C Applied",
      image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80", // Replace with a transparent PNG of a model later
      color: "bg-[#1A1A1A]",
      btnColor: "bg-[#FF4A5A]",
    },
    {
      id: 2,
      tag: "Weekend Drop!",
      title: "Flash Sale Alert",
      discountNum: "25",
      terms: "Electronics & Tech | T&C Applied",
      image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&q=80",
      color: "bg-slate-900",
      btnColor: "bg-[#D97706]",
    }
  ];

  return (
    <div className="px-4 pt-3 pb-5 bg-white dark:bg-[#111]">
      <div className="flex justify-between items-end mb-3">
        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">#SpecialForYou</h2>
        <span className="text-xs font-bold text-red-500">See All</span>
      </div>

      <Swiper
        modules={[Autoplay, Pagination]}
        spaceBetween={15}
        slidesPerView={1.05}
        autoplay={{ delay: 4000, disableOnInteraction: false }}
        pagination={{ clickable: true, dynamicBullets: true }}
        className="pb-8 drop-shadow-xl"
      >
        {promos.map((promo) => (
          <SwiperSlide key={promo.id}>
            <div className={`${promo.color} rounded-[24px] p-5 h-[180px] sm:h-[200px] relative overflow-hidden flex flex-col justify-center`}>
              
              {/* Content Left Side */}
              <div className="relative z-20 w-[60%]">
                <span className="inline-block bg-white text-slate-900 text-[10px] font-black px-3 py-1 rounded-full mb-2">
                  {promo.tag}
                </span>
                <h3 className="text-white text-base sm:text-lg font-bold leading-tight mb-1">
                  {promo.title}
                </h3>
                <div className="text-white flex items-baseline mb-2">
                  <span className="text-lg font-medium mr-1">Up to</span>
                  <span className="text-5xl sm:text-6xl font-black leading-none">{promo.discountNum}</span>
                  <span className="text-red-500 text-xl font-black">%</span>
                </div>
                <p className="text-[8px] sm:text-[10px] text-slate-300 font-medium">
                  {promo.terms}
                </p>
              </div>

              {/* Image Right Side (Faded gradient to blend non-transparent images for now) */}
              <div className="absolute right-0 top-0 w-[50%] h-full z-0">
                <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A1A] via-transparent to-transparent z-10" />
                <Image 
                  src={promo.image} 
                  alt="Promo" 
                  fill 
                  className="object-cover opacity-80"
                />
              </div>

              {/* Claim CTA */}
              <button className={`absolute bottom-4 right-4 ${promo.btnColor} text-white text-sm font-bold px-5 py-2 rounded-xl z-20 shadow-lg active:scale-95 transition-transform`}>
                Claim
              </button>
              
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
