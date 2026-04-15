"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import Image from "next/image";
import Link from "next/link";

export default function HeroCarousel({ products }: { products: any[] }) {
  if (!products || products.length === 0) return null;

  return (
    // Completely transparent outer wrapper to let the root CSS gradient show through
    <div className="w-full bg-transparent mb-4 select-none">
      <Swiper
        modules={[Autoplay, Pagination]}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ 
          clickable: true, 
          // Customizing pagination to sit inside the banner like major e-commerce sites
          bulletActiveClass: 'swiper-pagination-bullet-active bg-[#D97706]',
          bulletClass: 'swiper-pagination-bullet bg-white/50 w-2.5 h-2.5 inline-block rounded-full mx-1 cursor-pointer transition-all'
        }}
        slidesPerView={1}
        spaceBetween={0}
        className="w-full rounded-md shadow-sm overflow-hidden"
      >
        {products.map((product) => {
          const title = product.name || product.title || "Special Item";
          const price = Number(product.price).toLocaleString();
          const image = product.images?.[0] ? product.images[0] : "";

          return (
            <SwiperSlide key={product.id}>
              <Link href={`/product/${product.publicId || product.id}`} className="block w-full outline-none">
                
                {/* The Billboard Canvas:
                  Uses a deep premium slate background. 
                  Heights scale aggressively from mobile up to desktop.
                */}
                <div className="relative w-full h-[220px] sm:h-[280px] md:h-[350px] lg:h-[400px] xl:h-[420px] bg-slate-900 group overflow-hidden">
                  
                  {/* Subtle Background Blur Effect using the product's own image */}
                  {image && (
                    <div className="absolute inset-0 z-0">
                      <Image 
                        src={image} 
                        alt="Background blur" 
                        fill 
                        className="object-cover opacity-20 blur-2xl scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-transparent"></div>
                    </div>
                  )}

                  <div className="absolute inset-0 flex items-center z-10 w-full h-full">
                    
                    {/* LEFT COLUMN: Text & Call to Action */}
                    <div className="w-[55%] md:w-1/2 h-full flex flex-col justify-center px-4 sm:px-8 md:px-12 lg:px-16 relative z-20">
                      
                      <span className="inline-block w-max bg-white/10 backdrop-blur-sm text-white text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-widest px-2 sm:px-3 py-1 rounded-sm mb-2 sm:mb-4 border border-white/20">
                        Top Pick
                      </span>

                      <h3 className="text-white text-sm sm:text-lg md:text-3xl lg:text-4xl xl:text-5xl font-black leading-tight sm:leading-snug mb-2 sm:mb-4 md:mb-6 line-clamp-2 md:line-clamp-3">
                        {title}
                      </h3>

                      <div className="flex flex-col mb-4 sm:mb-6 md:mb-8">
                        <span className="text-[9px] sm:text-[10px] md:text-sm text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                          Now Available
                        </span>
                        <div className="text-[#D97706] flex items-start">
                          <span className="text-[10px] sm:text-xs md:text-sm lg:text-lg font-bold mr-1 mt-0.5 sm:mt-1 md:mt-1.5">
                            UGX
                          </span>
                          <span className="text-xl sm:text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-black leading-none tracking-tight">
                            {price}
                          </span>
                        </div>
                      </div>

                      <button className="bg-[#D97706] text-white w-max px-4 py-2 sm:px-6 sm:py-2.5 md:px-8 md:py-3.5 rounded-sm text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-widest hover:bg-amber-600 transition-colors shadow-lg">
                        Shop Now
                      </button>

                    </div>

                    {/* RIGHT COLUMN: The Product Image */}
                    <div className="w-[45%] md:w-1/2 h-full relative z-10 p-4 sm:p-6 md:p-8 flex items-center justify-center">
                      {image ? (
                        <div className="relative w-full h-full max-h-[85%] group-hover:scale-105 transition-transform duration-700 ease-out">
                          <Image 
                            src={image} 
                            alt={title} 
                            fill 
                            className="object-contain drop-shadow-2xl"
                            sizes="(max-width: 768px) 50vw, 50vw"
                            priority
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-700 font-bold uppercase text-xs">
                          Image Pending
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              </Link>
            </SwiperSlide>
          );
        })}
      </Swiper>
      
      {/* Custom CSS injection to override Swiper's default pagination position 
        so the dots sit nicely inside the bottom of the image banner.
      */}
      <style jsx global>{`
        .swiper-pagination {
          bottom: 12px !important;
        }
        @media (min-width: 768px) {
          .swiper-pagination {
            bottom: 20px !important;
          }
        }
      `}</style>
    </div>
  );
}
