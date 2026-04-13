"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider"; // 🔥 IMPORT THEME PROVIDER

export default function HeroCarousel({ products }: { products: any[] }) {
  const theme = useTheme(); // 🔥 GET CURRENT DAY THEME

  // If no products are toggled as 'isHero', hide the carousel completely
  if (!products || products.length === 0) return null;

  // We keep the premium dark background colors for the cards to make the product images pop
  const bgColors = [
    "bg-[#1A1A1A]", // Deep Black
    "bg-slate-900", // Navy Blue
    "bg-[#3f1d0b]", // Dark Amber/Brown
  ];

  return (
    <div className="px-4 pt-3 pb-5 bg-white dark:bg-[#111]">
      <div className="flex justify-between items-end mb-3">
        {/* 🔥 THEMED TITLE: Uses bg-clip to paint the text in the exact color of the day */}
        <h2 className={`text-lg font-black ${theme.bg} bg-clip-text text-transparent tracking-tight transition-colors duration-500`}>
          #SpecialForYou
        </h2>
      </div>

      <Swiper
        modules={[Autoplay, Pagination]}
        spaceBetween={15}
        slidesPerView={1.05}
        autoplay={{ delay: 4000, disableOnInteraction: false }}
        pagination={{ clickable: true, dynamicBullets: true }}
        className="pb-8 drop-shadow-xl"
      >
        {products.map((product, index) => {
          const bgColor = bgColors[index % bgColors.length];
          const title = product.name || product.title || "Special Item";
          const price = Number(product.price).toLocaleString();
          const image = product.images?.[0] ? product.images[0] : "";

          return (
            <SwiperSlide key={product.id}>
              <Link href={`/product/${product.publicId || product.id}`} className="block outline-none">
                <div className={`${bgColor} rounded-[24px] p-5 h-[160px] sm:h-[180px] relative overflow-hidden flex flex-col justify-center`}>

                  {/* Content Left Side */}
                  <div className="relative z-20 w-[60%]">
                    <span className="inline-block bg-white text-slate-900 text-[10px] font-black px-3 py-1 rounded-full mb-2 shadow-sm">
                      Top Pick
                    </span>

                    {/* Dynamic Product Name */}
                    <h3 className="text-white text-sm sm:text-base font-bold leading-snug mb-3 line-clamp-2">
                      {title}
                    </h3>

                    {/* Dynamic Price Area */}
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider mb-0.5">
                        For as low as
                      </span>
                      <div className="text-white flex items-baseline">
                        {/* 🔥 THEMED CURRENCY SYMBOL */}
                        <span className={`text-sm font-bold mr-1 ${theme.bg} bg-clip-text text-transparent transition-colors duration-500`}>
                          UGX
                        </span>
                        <span className="text-3xl sm:text-4xl font-black leading-none">{price}</span>
                      </div>
                    </div>
                  </div>

                  {/* Image Right Side */}
                  <div className="absolute right-0 top-0 w-[45%] h-full z-0">
                    {/* Gradient fade so the image blends into the background nicely */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent z-10" />
                    {image && (
                      <Image 
                        src={image} 
                        alt={title} 
                        fill 
                        className="object-cover opacity-90"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                    )}
                  </div>

                  {/* 🔥 THEMED ACTION BUTTON: Uses the daily background AND the perfectly contrasting text color */}
                  <button className={`absolute bottom-4 right-4 ${theme.bg} ${theme.text} text-[11px] font-black uppercase tracking-wide px-4 py-2 rounded-xl z-20 shadow-lg active:scale-95 transition-all duration-500`}>
                    Shop Now
                  </button>

                </div>
              </Link>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}
