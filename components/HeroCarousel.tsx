"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider"; // IMPORT THEME PROVIDER

export default function HeroCarousel({ products }: { products: any[] }) {
  const theme = useTheme(); // GET CURRENT DAY THEME

  // If no products are toggled as 'isHero', hide the carousel completely
  if (!products || products.length === 0) return null;

  // We keep the premium dark background colors for the cards to make the product images pop
  const bgColors = [
    "bg-[#1A1A1A]", // Deep Black
    "bg-slate-900", // Navy Blue
    "bg-[#3f1d0b]", // Dark Amber/Brown
  ];

  return (
    <div className="w-full bg-white dark:bg-[#111]">
      {/* Removed max-width and added responsive horizontal padding for full stretch */}
      <div className="w-full px-4 md:px-8 pt-3 pb-5">
        <div className="flex justify-between items-end mb-3">
          {/* THEMED TITLE: Uses bg-clip to paint the text in the exact color of the day */}
          <h2 className={`text-lg md:text-xl font-black ${theme.bg} bg-clip-text text-transparent tracking-tight transition-colors duration-500`}>
            #SpecialForYou
          </h2>
        </div>

        <Swiper
          modules={[Autoplay, Pagination]}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          pagination={{ clickable: true, dynamicBullets: true }}
          className="pb-8 drop-shadow-xl"
          breakpoints={{
            // Mobile screens: Show 1 card with a slight peek of the next
            320: {
              slidesPerView: 1.05,
              spaceBetween: 15,
            },
            // Large mobile: Show slightly more of the next card
            640: {
              slidesPerView: 1.2,
              spaceBetween: 20,
            },
            // Tablets: Show 1.5 cards
            768: {
              slidesPerView: 1.5,
              spaceBetween: 20,
            },
            // Desktop: Show exactly 2 large hero cards
            1024: {
              slidesPerView: 2,
              spaceBetween: 24,
            },
            // Large Desktop: Maintain exactly 2 cards with slightly more breathing room
            1280: {
              slidesPerView: 2,
              spaceBetween: 32,
            }
          }}
        >
          {products.map((product, index) => {
            const bgColor = bgColors[index % bgColors.length];
            const title = product.name || product.title || "Special Item";
            const price = Number(product.price).toLocaleString();
            const image = product.images?.[0] ? product.images[0] : "";

            return (
              <SwiperSlide key={product.id}>
                <Link href={`/product/${product.publicId || product.id}`} className="block outline-none">
                  {/* Increased heights for large screens to accommodate the wider aspect ratio */}
                  <div className={`${bgColor} rounded-[24px] p-5 md:p-8 lg:p-10 h-[200px] sm:h-[240px] lg:h-[320px] xl:h-[360px] relative overflow-hidden flex flex-col justify-center`}>

                    {/* Content Left Side */}
                    <div className="relative z-20 w-[60%] lg:w-[50%]">
                      <span className="inline-block bg-white text-slate-900 text-[10px] md:text-xs font-black px-3 md:px-4 py-1 md:py-1.5 rounded-full mb-2 md:mb-5 shadow-sm">
                        Top Pick
                      </span>

                      {/* Dynamic Product Name */}
                      <h3 className="text-white text-sm sm:text-base md:text-2xl lg:text-3xl font-bold leading-snug mb-3 md:mb-6 line-clamp-2">
                        {title}
                      </h3>

                      {/* Dynamic Price Area */}
                      <div className="flex flex-col">
                        <span className="text-[10px] md:text-sm text-slate-300 font-bold uppercase tracking-wider mb-0.5 md:mb-1">
                          For as low as
                        </span>
                        <div className="text-white flex items-baseline">
                          {/* THEMED CURRENCY SYMBOL */}
                          <span className={`text-sm md:text-lg font-bold mr-1.5 ${theme.bg} bg-clip-text text-transparent transition-colors duration-500`}>
                            UGX
                          </span>
                          <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-none">{price}</span>
                        </div>
                      </div>
                    </div>

                    {/* Image Right Side */}
                    <div className="absolute right-0 top-0 w-[45%] lg:w-[55%] h-full z-0">
                      {/* Gradient fade so the image blends into the background nicely */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/20 to-transparent z-10" />
                      {image && (
                        <Image 
                          src={image} 
                          alt={title} 
                          fill 
                          className="object-cover opacity-90"
                          sizes="(max-width: 1024px) 100vw, 50vw"
                        />
                      )}
                    </div>

                    {/* THEMED ACTION BUTTON: Uses the daily background AND the perfectly contrasting text color */}
                    <button className={`absolute bottom-4 right-4 md:bottom-8 md:right-8 lg:bottom-10 lg:right-10 ${theme.bg} ${theme.text} text-[11px] md:text-sm font-black uppercase tracking-wide px-4 py-2 md:px-8 md:py-4 rounded-xl z-20 shadow-lg active:scale-95 transition-all duration-500`}>
                      Shop Now
                    </button>

                  </div>
                </Link>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </div>
  );
}
