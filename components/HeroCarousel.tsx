"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import Image from "next/image";
import Link from "next/link";

export default function HeroSection({ products }: { products: any[] }) {
  // Ensure we only take exactly 4 items for this layout
  if (!products || products.length === 0) return null;
  const displayItems = products.slice(0, 4);

  // Apple-style color palettes for the 4 items
  const themes = [
    { bg: "bg-slate-900", text: "text-white", subText: "text-gray-400" },        // 1. Dark Main
    { bg: "bg-[#F5F5F7]", text: "text-gray-900", subText: "text-gray-500" },     // 2. Light Gray Wide
    { bg: "bg-[#E8F0FE]", text: "text-gray-900", subText: "text-gray-600" },     // 3. Soft Blue Square
    { bg: "bg-[#FFF4E5]", text: "text-gray-900", subText: "text-gray-600" },     // 4. Soft Orange Square
  ];

  return (
    <section className="w-full mb-8 select-none">
      
      {/* =========================================
          MOBILE VIEW: SWIPER.JS (APPLE STYLE)
          ========================================= */}
      <div className="md:hidden w-full px-4 pb-8">
        <Swiper
          modules={[Autoplay, Pagination]}
          speed={800}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          loop={displayItems.length > 1}
          pagination={{ 
            clickable: true, 
            bulletActiveClass: 'swiper-pagination-bullet-active bg-[#D97706] w-6 rounded-full',
            bulletClass: 'swiper-pagination-bullet bg-gray-300 hover:bg-gray-400 w-2 h-2 inline-block rounded-full mx-1 cursor-pointer transition-all duration-300'
          }}
          slidesPerView={1}
          spaceBetween={16}
          className="w-full !pb-10" // Padding bottom for the pagination dots
        >
          {displayItems.map((product, index) => {
            const theme = themes[index];
            const title = product.name || product.title || "Exclusive Deal";
            const price = Number(product.price).toLocaleString();
            const image = product.images?.[0] || "";

            return (
              <SwiperSlide key={product.id || index}>
                <Link 
                  href={`/product/${product.publicId || product.id}`} 
                  className={`block w-full h-[450px] rounded-[2rem] overflow-hidden relative flex flex-col ${theme.bg} shadow-sm border border-black/5 group outline-none`}
                >
                  {/* Text Top */}
                  <div className="px-6 pt-8 z-10 flex flex-col items-start relative">
                    <span className="text-[#D97706] text-xs font-bold tracking-widest uppercase mb-1 block">
                      {index === 0 ? "Hot Deal" : "Trending"}
                    </span>
                    <h3 className={`text-3xl font-bold ${theme.text} mb-2 tracking-tight leading-tight line-clamp-2`}>
                      {title}
                    </h3>
                    <p className={`text-base font-medium ${theme.subText}`}>
                      UGX {price}
                    </p>
                  </div>

                  {/* Image Bottom */}
                  <div className="absolute bottom-0 left-0 w-full h-[60%] flex items-end justify-center">
                    <div className="relative w-[90%] h-[90%] transition-transform duration-500 group-hover:scale-105">
                      {image && (
                        <Image 
                          src={image} 
                          alt={title} 
                          fill 
                          className="object-contain object-bottom" 
                          sizes="(max-width: 768px) 100vw, 50vw" 
                          priority={index === 0}
                        />
                      )}
                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>

      {/* =========================================
          DESKTOP VIEW: 4-ITEM BENTO BOX
          ========================================= */}
      <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-4 px-4 lg:px-8 h-[500px] lg:h-[600px] w-full">
        
        {/* ITEM 1: MAIN HERO (Left Half - 2 Cols, 2 Rows) */}
        {displayItems[0] && (
          <Link href={`/product/${displayItems[0].publicId || displayItems[0].id}`} 
                className={`col-span-2 row-span-2 rounded-[2rem] relative overflow-hidden group flex flex-col p-8 lg:p-12 ${themes[0].bg} shadow-sm border border-black/5`}>
            <div className="z-10 w-3/4">
              <span className="text-[#D97706] text-sm font-bold tracking-widest uppercase mb-2 block">Hot Deal</span>
              <h3 className={`text-4xl lg:text-5xl font-bold ${themes[0].text} leading-tight mb-4 line-clamp-2 tracking-tight`}>
                {displayItems[0].name || displayItems[0].title}
              </h3>
              <p className={`text-xl font-medium ${themes[0].subText}`}>UGX {Number(displayItems[0].price).toLocaleString()}</p>
            </div>
            <div className="absolute bottom-[-5%] right-[-5%] w-[70%] h-[70%] transition-transform duration-700 group-hover:scale-105 group-hover:-rotate-2">
              {displayItems[0].images?.[0] && (
                <Image src={displayItems[0].images[0]} alt="Hero Product" fill className="object-contain object-bottom right-0" sizes="50vw" priority />
              )}
            </div>
          </Link>
        )}

        {/* ITEM 2: TOP RIGHT WIDE (2 Cols, 1 Row) */}
        {displayItems[1] && (
          <Link href={`/product/${displayItems[1].publicId || displayItems[1].id}`} 
                className={`col-span-2 row-span-1 rounded-[2rem] relative overflow-hidden group flex items-center p-8 ${themes[1].bg} shadow-sm border border-black/5`}>
            <div className="z-10 w-1/2">
              <span className="text-[#D97706] text-xs font-bold tracking-widest uppercase mb-1 block">New Arrival</span>
              <h3 className={`text-2xl font-bold ${themes[1].text} leading-tight mb-2 line-clamp-2 tracking-tight`}>
                {displayItems[1].name || displayItems[1].title}
              </h3>
              <p className={`text-md font-medium ${themes[1].subText}`}>UGX {Number(displayItems[1].price).toLocaleString()}</p>
            </div>
            <div className="absolute right-0 top-0 w-1/2 h-full transition-transform duration-500 group-hover:scale-110">
              {displayItems[1].images?.[0] && (
                <Image src={displayItems[1].images[0]} alt="Product 2" fill className="object-contain object-right pr-6" sizes="25vw" />
              )}
            </div>
          </Link>
        )}

        {/* ITEM 3: BOTTOM RIGHT SQUARE 1 (1 Col, 1 Row) */}
        {displayItems[2] && (
          <Link href={`/product/${displayItems[2].publicId || displayItems[2].id}`} 
                className={`col-span-1 row-span-1 rounded-[2rem] relative overflow-hidden group flex flex-col p-6 ${themes[2].bg} shadow-sm border border-black/5`}>
            <div className="z-10 text-center w-full">
              <h3 className={`text-lg font-bold ${themes[2].text} line-clamp-1 tracking-tight`}>
                {displayItems[2].name || displayItems[2].title}
              </h3>
              <p className={`text-sm ${themes[2].subText}`}>UGX {Number(displayItems[2].price).toLocaleString()}</p>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-[65%] transition-transform duration-500 group-hover:scale-105">
              {displayItems[2].images?.[0] && (
                <Image src={displayItems[2].images[0]} alt="Product 3" fill className="object-contain object-bottom pb-4" sizes="15vw" />
              )}
            </div>
          </Link>
        )}

        {/* ITEM 4: BOTTOM RIGHT SQUARE 2 (1 Col, 1 Row) */}
        {displayItems[3] && (
          <Link href={`/product/${displayItems[3].publicId || displayItems[3].id}`} 
                className={`col-span-1 row-span-1 rounded-[2rem] relative overflow-hidden group flex flex-col p-6 ${themes[3].bg} shadow-sm border border-black/5`}>
            <div className="z-10 text-center w-full">
              <h3 className={`text-lg font-bold ${themes[3].text} line-clamp-1 tracking-tight`}>
                {displayItems[3].name || displayItems[3].title}
              </h3>
              <p className={`text-sm ${themes[3].subText}`}>UGX {Number(displayItems[3].price).toLocaleString()}</p>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-[65%] transition-transform duration-500 group-hover:scale-105">
              {displayItems[3].images?.[0] && (
                <Image src={displayItems[3].images[0]} alt="Product 4" fill className="object-contain object-bottom pb-4" sizes="15vw" />
              )}
            </div>
          </Link>
        )}

      </div>

      <style jsx global>{`
        /* Custom Swiper Pagination overriding default positioning to center it properly under the cards */
        .swiper-pagination {
          bottom: 0px !important;
          display: flex;
          justify-content: center;
          align-items: center;
        }
      `}</style>
    </section>
  );
}
