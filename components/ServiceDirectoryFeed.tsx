"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, ArrowRight, User } from "lucide-react";

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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#D97706]" />
          Verified Local Professionals
        </h2>
        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
          {products.length} {products.length === 1 ? "Service" : "Services"}
        </span>
      </div>

      {/* DIRECTORY GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {products.map((service) => {
          const formattedPrice = Number(service.price).toLocaleString();
          const mainImage = service.images?.[0] || "/placeholder.png";

          return (
            <Link 
              href={`/service/${service.id}`} 
              key={service.id}
              className="flex flex-col bg-white dark:bg-[#151515] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-[#D97706] hover:shadow-md transition-all duration-300 overflow-hidden group"
            >
              {/* LANDSCAPE IMAGE BOX (Fixed: No padding, true full-width) */}
              <div className="relative w-full aspect-video bg-black border-b border-slate-100 dark:border-slate-800 overflow-hidden">
                {/* Background Blur to fill empty space if flyer is square */}
                <div className="absolute inset-0 opacity-50 blur-xl scale-110">
                  <Image src={mainImage} alt="blur bg" fill className="object-cover" />
                </div>
                {/* Main Flyer */}
                <Image
                  src={mainImage}
                  alt={service.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-contain z-10 transition-transform duration-500 group-hover:scale-[1.03]"
                  priority
                />
              </div>

              {/* SERVICE DETAILS */}
              <div className="p-5 flex flex-col flex-grow">
                <div className="mb-3">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white line-clamp-1 mb-1 group-hover:text-[#D97706] transition-colors">
                    {service.title}
                  </h3>
                  <div className="flex items-center text-xs font-medium text-slate-500 dark:text-slate-400">
                    <User className="w-3.5 h-3.5 mr-1" />
                    Provided by: <span className="text-slate-700 dark:text-slate-300 ml-1">{service.sellerName || "Verified Expert"}</span>
                  </div>
                </div>

                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 flex-grow leading-relaxed">
                  {service.description || "Click to view full service details, inclusions, and contact information."}
                </p>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                      Est. Base Price
                    </span>
                    <span className="text-lg font-black text-[#D97706]">
                      UGX {formattedPrice}
                    </span>
                  </div>

                  <div className="flex items-center justify-center bg-slate-50 dark:bg-[#111] text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl text-sm font-bold group-hover:bg-[#D97706] group-hover:text-white transition-colors duration-300">
                    View Details
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
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
