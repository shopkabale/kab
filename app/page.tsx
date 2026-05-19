// 🔥 CRITICAL: Tells Next.js to refresh this page every 60 seconds to pull new deals!
export const revalidate = 60; 

import ContinueBrowsing from "@/components/ContinueBrowsing";
import Link from "next/link";
import { getCachedHomepageData } from "@/lib/firebase/fetchers";

// Firebase imports for the active deals query
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

// VIP UI COMPONENTS
import HeroCarousel from "@/components/HeroCarousel";
import WhatsAppPopup from "@/components/WhatsAppPopup";
import ProductSection from "@/components/ProductSection";
import AboutKabaleOnline from "@/components/AboutKabaleOnline";
import ThemedCategoryGrid from "@/components/ThemedCategoryGrid";
import { ThemeProvider } from "@/components/ThemeProvider";
import LeftSidebar from "@/components/LeftSidebar"; 

// BANNERS & SCROLLERS
import TimepieceBanner from "@/components/banners/TimepieceBanner";
import ValuePropBanner from "@/components/banners/ValuePropBanner";
import CampaignScroller from "@/components/CampaignScroller";

const shuffleArray = (array: any[]) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// 🔥 THE SMART TITLE DICTIONARY
const campaignDisplayNames: Record<string, string> = {
  "flash-sales": "Flash Sales",
  "weekend-deals": "Weekend Deals",
  "clearance": "Clearance Sale",
  "student-deals": "Student Deals",
  "mega-sale": "Mega Sale"
};

export default async function Home() {
  const data = await getCachedHomepageData();

  const heroProducts = data.heroProducts || [];
  const trendingProducts = data.trendingProducts || [];
  const officialProducts = data.officialProducts || [];
  const latestProducts = data.latestProducts || [];

  // Admin-curated collections
  const featuredCollection = data.featuredCollection || [];
  const save4kProducts = data.save4kProducts || [];
  const handPickedProducts = shuffleArray(data.handPickedProducts || []);

  const otherProducts = data.otherProducts || [];

  // ==========================================
  // 🔥 FETCH AND GROUP DYNAMIC CAMPAIGNS
  // ==========================================
  // This object will group deals by their campaign type
  const campaigns: Record<string, { products: any[], earliestEndDate: string }> = {};

  try {
    const dealsQ = query(
      collection(db, "products"), 
      where("isSale", "==", true), 
      limit(20) 
    );
    const dealsSnap = await getDocs(dealsQ);

    dealsSnap.docs.forEach(doc => {
      const dealData = doc.data();
      
      // Ensure the deal hasn't expired
      if (new Date(dealData.saleEndDate).getTime() > Date.now()) {
        const cType = dealData.campaignType || "flash-sales";

        // If this campaign type doesn't exist in our object yet, create it
        if (!campaigns[cType]) {
          campaigns[cType] = { products: [], earliestEndDate: dealData.saleEndDate };
        }

        // Push the product into its specific campaign
        campaigns[cType].products.push({ id: doc.id, ...dealData });

        // Update the master clock for this specific campaign
        if (new Date(dealData.saleEndDate) < new Date(campaigns[cType].earliestEndDate)) {
          campaigns[cType].earliestEndDate = dealData.saleEndDate;
        }
      }
    });
  } catch (error) {
    console.error("Failed to fetch deals for homepage:", error);
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-transparent pb-10 pt-2 sm:pt-4 font-sans selection:bg-[#FF6A00] selection:text-white">
        <WhatsAppPopup />
        <div className="w-full max-w-[1400px] mx-auto px-0 sm:px-4">

          <div className="flex flex-col md:flex-row items-start gap-4 w-full">

            {/* THE INVISIBLE SCROLLBAR SIDEBAR */}
            <div className="hidden md:flex flex-col gap-4 w-[220px] lg:w-[240px] shrink-0 sticky top-[85px] h-[calc(100vh-85px)] overflow-y-auto overscroll-contain z-10 pb-6 pr-1 md:pr-2 
              [&::-webkit-scrollbar]:w-1.5 
              [&::-webkit-scrollbar-track]:bg-transparent 
              [&::-webkit-scrollbar-thumb]:bg-slate-200 
              dark:[&::-webkit-scrollbar-thumb]:bg-slate-800 
              [&::-webkit-scrollbar-thumb]:rounded-full 
              hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 
              dark:hover:[&::-webkit-scrollbar-thumb]:bg-slate-700"
            >
              <LeftSidebar />
            </div>

            {/* MAIN FEED */}
            <div className="flex-grow min-w-0 flex flex-col w-full">

              <div className="w-full flex flex-col shadow-sm mb-4 sm:mb-6">
                <ValuePropBanner />
                <div className="w-full z-0">
                  <HeroCarousel products={heroProducts} />
                </div>
                <div className="w-full bg-white dark:bg-[#151515] sm:rounded-b-xl border-x border-b border-slate-200 dark:border-slate-800 p-4 pt-5 sm:pt-6">
                  <ThemedCategoryGrid />
                </div>
              </div>

              {/* ========================================== */}
              {/* 🔥 RENDER EVERY ACTIVE CAMPAIGN DYNAMICALLY*/}
              {/* ========================================== */}
              {Object.entries(campaigns).map(([slug, campaignData]) => {
                // Look up the nice name, fallback to formatting the slug if not found
                const displayTitle = campaignDisplayNames[slug] || slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                
                return (
                  <div className="w-full mb-4 sm:mb-6" key={slug}>
                    <CampaignScroller 
                      title={displayTitle} 
                      endTime={campaignData.earliestEndDate} 
                      products={campaignData.products} 
                      campaignSlug={slug} 
                    />
                  </div>
                );
              })}

              <div className="w-full flex flex-col gap-4 sm:gap-6">
                <ContinueBrowsing 
                  title="Continue Browsing"
                  subtitle="Pick up exactly where you left off"
                  fallbackProducts={trendingProducts} 
                />

                {featuredCollection.length > 0 && (
                  <ProductSection 
                    title="Featured collection" 
                    subtitle="Premium picks of the week"
                    products={featuredCollection} 
                    viewAllLink="/category/featured"
                  />
                )}

                {save4kProducts.length > 0 && (
                  <ProductSection 
                    title="Save up to 4k" 
                    subtitle="Massive discounts on top electronics"
                    products={save4kProducts} 
                    viewAllLink="/deals"
                  />
                )}

                {handPickedProducts.length > 0 && (
                  <ProductSection 
                    title="Hand picked for you" 
                    subtitle="Curated electronics tailored for performance"
                    products={handPickedProducts} 
                    viewAllLink="/products"
                  />
                )}

                <TimepieceBanner />

                {trendingProducts.length > 0 && (
                  <ProductSection 
                    title="Trending Now" 
                    subtitle="What everyone is looking at right now"
                    products={trendingProducts} 
                    viewAllLink="/products?sort=trending"
                  />
                )}
                
                {latestProducts.length > 0 && (
                  <ProductSection 
                    title="Recently added" 
                    subtitle="Fresh electronics straight out of the box"
                    products={latestProducts.slice(0, 12)} 
                    viewAllLink="/products"
                  />
                )}

                {officialProducts.length > 0 && (
                  <ProductSection 
                    title="From the Official Store" 
                    subtitle="100% genuine guaranteed products"
                    products={officialProducts} 
                    viewAllLink="/officialStore" 
                  />
                )}

                {otherProducts.length > 0 && (
                  <ProductSection 
                    title="Other Products" 
                    subtitle="Explore beyond electronics"
                    products={otherProducts} 
                    viewAllLink="/category/other-products" 
                  />
                )}

                <AboutKabaleOnline />

              </div>
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
