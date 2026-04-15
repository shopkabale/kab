"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import Image from "next/image";
import Link from "next/link";

export default function HeroCarousel({ products }: { products: any[] }) {
  if (!products || products.length === 0) return null;

  // Premium, solid gradients for a highly professional e-commerce feel
  const slideBackgrounds = [
    "bg-gradient-to-r from-[#0ea5e9] to-[#38bdf8]", // Sky Blue
    "bg-gradient-to-r from-[#8b5cf6] to-[#a855f7]", // Royal Purple
    "bg-gradient-to-r from-[#f97316] to-[#fb923c]", // Brand Orange
    "bg-gradient-to-r from-[#10b981] to-[#34d399]", // Emerald
  ];

  return (
    <div className="w-full bg-transparent select-none">
      <Swiper
        modules={[Autoplay, Pagination]}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ 
          clickable: true, 
          bulletActiveClass: 'swiper-pagination-bullet-active bg-white w-6 rounded-full',
          bulletClass: 'swiper-pagination-bullet bg-white/50 w-2 h-2 inline-block rounded-full mx-1 cursor-pointer transition-all duration-300'
        }}
        slidesPerView={1}
        spaceBetween={0}
        className="w-full rounded-md shadow-sm overflow-hidden"
      >
        {products.map((product, index) => {
          const bgClass = slideBackgrounds[index % slideBackgrounds.length];
          const title = product.name || product.title || "Exclusive Deal";
          const price = Number(product.price).toLocaleString();
          
          // Fallbacks for missing data
          const description = product.description || "Grab this amazing deal before stock runs out. Fast and secure delivery guaranteed.";
          const image = product.images?.[0] ? product.images[0] : "";
          
          // Simulated original price for the strikethrough effect
          const originalPrice = (Number(product.price) * 1.2).toLocaleString();

          return (
            <SwiperSlide key={product.id}>
              <Link href={`/product/${product.publicId || product.id}`} className="block w-full outline-none group">
                
                {/* Main Banner Canvas */}
                <div className={`relative w-full h-[220px] sm:h-[280px] md:h-[350px] lg:h-[400px] ${bgClass} overflow-hidden flex`}>
                  
                  {/* LEFT: Content Area */}
                  <div className="w-[55%] md:w-[50%] h-full flex flex-col justify-center px-4 sm:px-8 md:px-10 relative z-20 text-white">
                    
                    {/* Hot Deal Badge */}
                    <div className="mb-2 sm:mb-4">
                      <span className="bg-white text-slate-900 text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-widest px-2 sm:px-3 py-1 rounded-sm shadow-sm inline-block">
                        Hot Deal
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-2xl md:text-3xl lg:text-5xl font-black leading-tight mb-2 line-clamp-2 drop-shadow-md">
                      {title}
                    </h3>

                    <p className="hidden md:block text-white/90 text-sm mb-4 line-clamp-2 max-w-[90%]">
                      {description}
                    </p>

                    <div className="flex flex-col mb-6 md:mb-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] sm:text-xs text-white/70 line-through font-medium">
                          UGX {originalPrice}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1 bg-white text-slate-900 w-max px-3 py-1 md:px-4 md:py-2 rounded-sm shadow-lg">
                        <span className="text-xs font-bold">UGX</span>
                        <span className="text-lg sm:text-xl md:text-3xl font-black tracking-tight">{price}</span>
                      </div>
                    </div>

                    {/* Limited Time Offer */}
                    <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-8 md:left-10 flex flex-col pb-4 md:pb-0">
                      <span className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-white/90">
                        Limited time offer
                      </span>
                      <span className="text-[8px] sm:text-[9px] text-white/60">
                        T&Cs Apply
                      </span>
                    </div>
                  </div>

                  {/* RIGHT: Zoomed Image Area */}
                  <div className="w-[45%] md:w-[50%] h-full relative z-10 flex items-end justify-end">
                    {image && (
                      <div className="relative w-full h-[95%] transition-transform duration-700 ease-out group-hover:scale-105 origin-bottom-right">
                        <Image 
                          src={image} 
                          alt={title} 
                          fill 
                          className="object-contain object-bottom md:object-right-bottom drop-shadow-2xl pr-2 md:pr-8"
                          sizes="(max-width: 768px) 50vw, 50vw"
                          priority
                        />
                      </div>
                    )}
                  </div>

                  {/* SHOP NOW BUTTON */}
                  <div className="absolute bottom-0 right-0 z-30">
                     <button className="bg-slate-900 text-white text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-wider px-4 py-3 sm:px-6 sm:py-4 rounded-tl-xl hover:bg-black transition-colors shadow-2xl flex items-center gap-2">
                       Shop Now
                       <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                     </button>
                  </div>

                </div>
              </Link>
            </SwiperSlide>
          );
        })}
      </Swiper>
      
      <style jsx global>{`
        .swiper-pagination {
          bottom: 12px !important;
          left: 50% !important;
          transform: translateX(-50%);
          text-align: center;
          width: 100%;
          z-index: 25;
        }
        @media (min-width: 768px) {
          .swiper-pagination {
            bottom: 20px !important;
            text-align: left;
            padding-left: 2.5rem;
            left: 0 !important;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}
