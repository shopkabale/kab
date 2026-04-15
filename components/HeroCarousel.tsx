"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
import Image from "next/image";
import Link from "next/link";

export default function HeroCarousel({ products }: { products: any[] }) {
  if (!products || products.length === 0) return null;

  // Premium themes with pre-defined Tailwind classes to ensure the gradient compiler works perfectly
  const slideThemes = [
    { bg: "bg-slate-900", fade: "from-slate-900" },
    { bg: "bg-indigo-950", fade: "from-indigo-950" },
    { bg: "bg-zinc-900", fade: "from-zinc-900" },
    { bg: "bg-stone-950", fade: "from-stone-950" },
  ];

  return (
    <div className="w-full bg-transparent mb-4 select-none">
      <Swiper
        modules={[Autoplay, Pagination, EffectFade]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        loop={products.length > 1}
        pagination={{ 
          clickable: true, 
          bulletActiveClass: 'swiper-pagination-bullet-active bg-[#D97706] w-6 rounded-full',
          bulletClass: 'swiper-pagination-bullet bg-white/30 hover:bg-white/60 w-2 h-2 inline-block rounded-full mx-1 cursor-pointer transition-all duration-300'
        }}
        slidesPerView={1}
        spaceBetween={0}
        className="w-full rounded-md shadow-sm overflow-hidden"
      >
        {products.map((product, index) => {
          const theme = slideThemes[index % slideThemes.length];
          const title = product.name || product.title || "Exclusive Deal";
          const price = Number(product.price).toLocaleString();
          const description = product.description || "Premium quality items delivered right to your door.";
          const image = product.images?.[0] ? product.images[0] : "";

          return (
            <SwiperSlide key={product.id}>
              <Link href={`/product/${product.publicId || product.id}`} className="block w-full outline-none group">
                
                {/* Fixed Heights for all screens */}
                <div className={`relative w-full h-[220px] sm:h-[280px] md:h-[350px] lg:h-[400px] xl:h-[420px] ${theme.bg} overflow-hidden flex`}>
                  
                  {/* LEFT CONTENT: Text & Info */}
                  <div className="w-[60%] md:w-[50%] h-full flex flex-col justify-center px-4 sm:px-8 md:px-12 relative z-20 text-white">
                    
                    {/* Hot Deal Label */}
                    <div className="mb-2 sm:mb-3 transform transition-transform duration-500 group-hover:translate-x-1">
                      <span className="bg-[#D97706] text-white text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-widest px-2 sm:px-3 py-1 rounded-sm shadow-md inline-block">
                        Hot Deal
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-black leading-tight sm:leading-none mb-2 line-clamp-1 sm:line-clamp-2 drop-shadow-lg tracking-tight">
                      {title}
                    </h3>

                    {/* Description - Strictly One Line */}
                    <p className="text-white/70 text-[10px] sm:text-xs md:text-sm mb-4 sm:mb-6 line-clamp-1 max-w-[90%] font-medium tracking-wide">
                      {description}
                    </p>

                    {/* Price Block */}
                    <div className="flex flex-col transform transition-transform duration-500 group-hover:translate-x-1">
                      <div className="flex items-baseline gap-1 text-[#D97706] drop-shadow-md">
                        <span className="text-xs sm:text-sm md:text-lg font-bold uppercase tracking-widest">UGX</span>
                        <span className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter">
                          {price}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT IMAGE: Mapped to exact edges with Zoom logic */}
                  <div className="absolute inset-0 w-full h-full z-0 overflow-hidden flex justify-end">
                    
                    {/* Seamless Gradient Blend */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${theme.fade} via-${theme.bg}/80 md:via-${theme.bg}/40 to-transparent z-10 w-[70%]`} />
                    
                    <div className="relative w-[60%] md:w-[65%] h-full transition-transform duration-[1500ms] ease-out group-hover:scale-110 group-hover:rotate-1 origin-center">
                      {image && (
                        <Image 
                          src={image} 
                          alt={title} 
                          fill 
                          // object-cover forces the image to fill its bounding box edge-to-edge
                          className="object-cover object-center"
                          sizes="(max-width: 768px) 60vw, 65vw"
                          priority
                        />
                      )}
                    </div>
                  </div>

                  {/* SHOP NOW BUTTON - Tucked into bottom right */}
                  <div className="absolute bottom-0 right-0 z-30">
                     <button className="bg-white text-slate-900 text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-widest px-5 py-3 sm:px-8 sm:py-5 rounded-tl-2xl hover:bg-[#D97706] hover:text-white transition-all duration-300 shadow-2xl flex items-center gap-2 group-hover:pr-6 sm:group-hover:pr-10">
                       Shop Now
                       <svg className="w-3 h-3 md:w-4 md:h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
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
          left: 4% !important;
          text-align: left !important;
          width: auto !important;
          z-index: 25;
        }
        @media (min-width: 768px) {
          .swiper-pagination {
            bottom: 24px !important;
            padding-left: 2rem;
          }
        }
      `}</style>
    </div>
  );
}
