"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, ArrowRight, User, Wrench } from "lucide-react";

interface Product {
  id: string;
  title: string;
  price: number | string;
  images: string[];
  sellerName?: string;
  description?: string;
  createdAt: number;
}

export default function ServiceDirectoryFeed({ initialProducts }: { initialProducts: Product[] }) {
  const [products] = useState<Product[]>(initialProducts);

  if (!products || products.length === 0) {
    return null; 
  }

  return (
    <div className="w-full">
      {/* DIRECTORY HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
          <Wrench className="w-5 h-5 text-[#D97706]" />
          Verified Local Professionals
        </h2>
        <span className="text-xs font-bold text-[#D97706] bg-amber-50 dark:bg-[#D97706]/10 px-3 py-1.5 rounded-full border border-amber-100 dark:border-[#D97706]/20">
          {products.length} {products.length === 1 ? "Service" : "Services"} Available
        </span>
      </div>

      {/* DIRECTORY GRID (3 Columns on Desktop, 2 on Tablet, 1 on Mobile) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {products.map((service) => {
          const formattedPrice = Number(service.price).toLocaleString();
          const mainImage = service.images?.[0] || "/placeholder.png";

          return (
            <Link 
              href={`/service/${service.id}`} 
              key={service.id}
              className="flex flex-col bg-white dark:bg-[#151515] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-[#D97706] hover:shadow-xl transition-all duration-300 overflow-hidden group"
            >
              {/* TALL PORTRAIT IMAGE BOX (Perfect for Flyers & Posters) */}
              <div className="relative w-full aspect-[4/5] bg-black border-b border-slate-100 dark:border-slate-800 overflow-hidden">
                
                {/* Background Blur: Fills any empty space beautifully if the flyer isn't perfectly 4:5 */}
                <div className="absolute inset-0 opacity-50 blur-2xl scale-110">
                  <Image src={mainImage} alt="blur bg" fill className="object-cover" />
                </div>
                
                {/* Main Flyer: object-contain ensures ZERO text is cropped */}
                <Image
                  src={mainImage}
                  alt={service.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-contain z-10 transition-transform duration-700 group-hover:scale-[1.03]"
                  priority
                />
              </div>

              {/* SERVICE DETAILS */}
              <div className="p-5 sm:p-6 flex flex-col flex-grow">
                
                <div className="mb-3">
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white line-clamp-2 mb-2 group-hover:text-[#D97706] transition-colors leading-tight">
                    {service.title}
                  </h3>
                  
                  {/* Provider Name Tag */}
                  <div className="flex items-center text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#111] w-max px-2.5 py-1 rounded-md border border-slate-100 dark:border-slate-800">
                    <User className="w-3.5 h-3.5 mr-1.5" />
                    By <span className="text-slate-700 dark:text-slate-300 ml-1">{service.sellerName || "Verified Expert"}</span>
                  </div>
                </div>

                <p className="text-[13px] sm:text-sm font-medium text-slate-500 dark:text-slate-400 line-clamp-2 mb-6 flex-grow leading-relaxed">
                  {service.description || "Click to view full service details, inclusions, and contact information."}
                </p>

                {/* Bottom Row */}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                      Est. Price
                    </span>
                    <span className="text-base sm:text-lg font-black text-[#D97706]">
                      UGX {formattedPrice}
                    </span>
                  </div>

                  <div className="flex items-center justify-center bg-slate-50 dark:bg-[#111] text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold group-hover:bg-[#D97706] group-hover:text-white transition-colors duration-300">
                    Details
                    <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>

              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
