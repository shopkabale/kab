"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function ThemedCategoryGrid() {
  const scrollContainerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);

  const categories = [
    { 
      name: "Shop mega bundles", 
      href: "/category/mega-bundles", 
      image: "https://images.unsplash.com/photo-1513885045260-6b3086b24c17?w=500&q=80",
      bgColor: "bg-[#FFD8CD]" 
    },
    { 
      name: "Campus life must-haves", 
      href: "/category/campus-life", 
      image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80",
      bgColor: "bg-[#D4E8D4]" 
    },
    { 
      name: "Top tech & gadgets", 
      href: "/category/tech-appliances", 
      image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&q=80",
      bgColor: "bg-[#D6E4FF]" 
    },
    { 
      name: "Farm fresh groceries", 
      href: "/category/food-groceries", 
      image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80",
      bgColor: "bg-[#FFF2CC]" 
    },
    { 
      name: "Beauty & fashion", 
      href: "/category/beauty-fashion", 
      image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&q=80",
      bgColor: "bg-[#F3D1F4]" 
    },
    { 
      name: "Repairs & services", 
      href: "/category/repairs-services", 
      image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=500&q=80",
      bgColor: "bg-[#E2E8F0]" 
    },
  ];

  // Updates the active dot based on manual scrolling/swiping
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    
    const scrollPosition = container.scrollLeft;
    // Card width + gap (gap-4 = 16px)
    const cardWidth = container.children[0].clientWidth + 16; 
    
    // Calculate closest index
    const newIndex = Math.round(scrollPosition / cardWidth);
    setActiveIndex(Math.min(newIndex, categories.length - 1));
  };

  // Allows dots to be clicked to manually navigate
  const scrollToDot = (index) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const cardWidth = container.children[0].clientWidth + 16;
    
    container.scrollTo({ left: index * cardWidth, behavior: "smooth" });
    setActiveIndex(index);
  };

  // Auto-scroll logic that respects manual interaction
  useEffect(() => {
    if (isInteracting) return; // Don't auto-scroll if user is touching/hovering

    const scrollInterval = setInterval(() => {
      let nextIndex = activeIndex + 1;
      if (nextIndex >= categories.length) {
        nextIndex = 0; // Loop back to start
      }
      scrollToDot(nextIndex);
    }, 3500);

    return () => clearInterval(scrollInterval);
  }, [activeIndex, isInteracting, categories.length]);

  return (
    <section className="py-6 select-none overflow-hidden flex flex-col items-center">
      
      {/* Carousel Container */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        onMouseEnter={() => setIsInteracting(true)}
        onMouseLeave={() => setIsInteracting(false)}
        onTouchStart={() => setIsInteracting(true)}
        onTouchEnd={() => setIsInteracting(false)}
        className="w-full flex overflow-x-auto gap-4 px-4 sm:px-6 snap-x snap-mandatory scroll-smooth 
                   [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
      >
        {categories.map((cat, index) => (
          <Link 
            key={cat.name} 
            href={cat.href} 
            className={`group flex-none w-[260px] md:w-[300px] h-[340px] md:h-[400px] rounded-2xl overflow-hidden relative snap-center flex flex-col ${cat.bgColor} shadow-sm border border-black/5`}
          >
            {/* Top Text Area */}
            <div className="px-5 pt-6 pb-2 z-10 shrink-0">
              <h3 className="text-3xl font-extrabold text-gray-900 leading-[1.1] tracking-tight">
                {cat.name}
              </h3>
            </div>

            {/* Bottom Image Area */}
            <div className="w-full h-[65%] absolute bottom-0 left-0 overflow-hidden rounded-b-2xl">
              <img 
                src={cat.image} 
                alt={cat.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </Link>
        ))}
      </div>

      {/* Progress Dots */}
      <div className="flex justify-center gap-2 mt-5">
        {categories.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToDot(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              activeIndex === index 
                ? "w-6 bg-gray-800" // Active dot is wider and darker
                : "w-2 bg-gray-300 hover:bg-gray-400" // Inactive dots
            }`}
          />
        ))}
      </div>

    </section>
  );
}
