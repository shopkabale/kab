"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getSponsoredSlots, SponsoredSlot } from "@/lib/sponsored";
import { db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { optimizeImage } from "@/lib/utils";

// Defined a merged type so TypeScript knows this ad contains product data
type SponsoredAd = SponsoredSlot & {
  productData?: any; 
};

export default function SponsoredSection() {
  const [ads, setAds] = useState<SponsoredAd[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSponsoredProducts() {
      try {
        // 1. Fetch all slots
        const allSlots = await getSponsoredSlots();
        
        // 2. Filter out only the active ones that actually have a productId
        const activeSlots = allSlots.filter(s => s.status === "active" && s.productId);

        // 3. Fetch actual product documents from Firestore for each active slot
        const adsWithProducts = await Promise.all(
          activeSlots.map(async (slot) => {
            let productData = null;
            if (slot.productId) {
              // Assumes your collection is named "products"
              const productRef = doc(db, "products", slot.productId);
              const productSnap = await getDoc(productRef);
              
              if (productSnap.exists()) {
                productData = { id: productSnap.id, ...productSnap.data() };
              }
            }
            return { ...slot, productData };
          })
        );

        // 4. Update state, filtering out any slots where the product was deleted
        setAds(adsWithProducts.filter(ad => ad.productData));
      } catch (error) {
        console.error("Error fetching sponsored products:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSponsoredProducts();
  }, []);

  if (loading || ads.length === 0) return null;

  return (
    <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-4 mb-6">
      
      {/* SECTION TITLE */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
          Promoted Collections 
          <span className="text-xs font-medium bg-[#D97706]/10 text-[#D97706] px-2 py-0.5 rounded-full">
            🔥 {ads.length}/4 Active
          </span>
        </h2>
      </div>

      {/* SINGLE COLUMN LAYOUT (ONE HERO IMAGE PER ROW) */}
      <div className="flex flex-col gap-4">
        {ads.map((ad) => {
          const p = ad.productData;
          const optimizedImage = p.images?.[0] ? optimizeImage(p.images[0]) : null;

          return (
            <Link key={ad.id} href={`/product/${p.publicId || p.id}`} className="group relative w-full h-[320px] md:h-[400px] rounded-2xl overflow-hidden shadow-lg border-2 border-yellow-400 dark:border-yellow-600/50 transition-all duration-300 hover:shadow-xl hover:border-[#D97706] block">
              
              {/* AD BADGE (Top-Left) */}
              <div className="absolute top-3 left-3 z-20 bg-[#D97706] text-white text-[11px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow-md">
                AD
              </div>

              {/* IMAGE AS BACKGROUND */}
              <div className="absolute inset-0 z-0">
                {optimizedImage ? (
                  <Image 
                    src={optimizedImage} 
                    alt={p.name || p.title || 'Sponsored Product'} 
                    fill 
                    sizes="100vw" 
                    className="object-cover group-hover:scale-105 transition-transform duration-700" 
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-900 text-sm font-bold text-slate-400 uppercase">No Image</div>
                )}
                {/* DARK OVERLAY FOR TEXT READABILITY (Matches Sample) */}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
              </div>

              {/* TEXT AND BUTTON OVERLAY (Bottom-Left, Matches Sample) */}
              <div className="absolute bottom-0 left-0 right-0 p-6 z-10 flex flex-col items-start gap-4">
                <h3 className="text-2xl md:text-3xl font-black text-white leading-tight">
                  {p.name || p.title}
                </h3>
                
                {/* "VIEW DETAILS" BUTTON (Over image) */}
                <button className="bg-white hover:bg-slate-100 text-slate-900 px-6 py-2.5 rounded-full font-bold text-sm transition-colors shadow-lg">
                  View Details
                </button>
              </div>

            </Link>
          );
        })}
      </div>
    </div>
  );
}
