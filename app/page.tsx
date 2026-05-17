import ContinueBrowsing from "@/components/ContinueBrowsing";
import Link from "next/link";
import { getCachedHomepageData } from "@/lib/firebase/fetchers";

// VIP UI COMPONENTS
import HeroCarousel from "@/components/HeroCarousel";
import WhatsAppPopup from "@/components/WhatsAppPopup";
import ProductSection from "@/components/ProductSection";
import AboutKabaleOnline from "@/components/AboutKabaleOnline";
import ThemedCategoryGrid from "@/components/ThemedCategoryGrid";
import { ThemeProvider } from "@/components/ThemeProvider";
import LeftSidebar from "@/components/LeftSidebar"; 

// BANNERS
import TimepieceBanner from "@/components/banners/TimepieceBanner";
import ValuePropBanner from "@/components/banners/ValuePropBanner";

const shuffleArray = (array: any[]) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
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

  return (
    <ThemeProvider>
      {/* 🔥 FIX 1: Removed overflow-x-hidden from here so sticky works! */}
      <div className="min-h-screen bg-transparent pb-10 pt-2 sm:pt-4 font-sans selection:bg-[#FF6A00] selection:text-white">
        <WhatsAppPopup />
        <div className="w-full max-w-[1400px] mx-auto px-0 sm:px-4">
          
          {/* 🔥 FIX 2: Added items-start here so the sidebar doesn't stretch to the bottom */}
          <div className="flex flex-col md:flex-row items-start gap-4 w-full">

            {/* LEFT SIDEBAR */}
            <div className="hidden md:flex flex-col gap-4 w-[220px] lg:w-[240px] shrink-0 sticky top-[85px] h-[calc(100vh-85px)] overflow-y-auto no-scrollbar overscroll-contain z-10 pb-6">
              <LeftSidebar />
            </div>

            {/* MAIN FEED */}
            <div className="flex-grow min-w-0 flex flex-col w-full">

              {/* ========================================== */}
              {/* 🏆 THE "SEAMLESS STACK" DASHBOARD BLOCK     */}
              {/* ========================================== */}
              <div className="w-full flex flex-col shadow-sm mb-4 sm:mb-6">
                
                {/* 1. Value Prop Banner (Top of stack - White) */}
                <ValuePropBanner />

                {/* 2. Hero (Middle of stack - Dark, No margins) */}
                <div className="w-full z-0">
                  <HeroCarousel products={heroProducts} />
                </div>

                {/* 3. Explore by category (Bottom of stack - White) */}
                <div className="w-full bg-white dark:bg-[#151515] sm:rounded-b-xl border-x border-b border-slate-200 dark:border-slate-800 p-4 pt-5 sm:pt-6">
                  <ThemedCategoryGrid />
                </div>
                
              </div>

              {/* ========================================== */}
              {/* 🛍️ REST OF THE PRODUCT FEED                 */}
              {/* ========================================== */}
              <div className="w-full flex flex-col gap-4 sm:gap-6">

                {/* Continue Browsing */}
                <ContinueBrowsing 
                  title="Continue Browsing"
                  subtitle="Pick up exactly where you left off"
                  fallbackProducts={trendingProducts} 
                />

                {/* Featured collection */}
                {featuredCollection.length > 0 && (
                  <ProductSection 
                    title="Featured collection" 
                    subtitle="Premium picks of the week"
                    products={featuredCollection} 
                    viewAllLink="/category/featured"
                  />
                )}

                {/* Save up to 4k */}
                {save4kProducts.length > 0 && (
                  <ProductSection 
                    title="Save up to 4k" 
                    subtitle="Massive discounts on top electronics"
                    products={save4kProducts} 
                    viewAllLink="/deals"
                  />
                )}

                {/* Hand picked for you */}
                {handPickedProducts.length > 0 && (
                  <ProductSection 
                    title="Hand picked for you" 
                    subtitle="Curated electronics tailored for performance"
                    products={handPickedProducts} 
                    viewAllLink="/products"
                  />
                )}

                {/* Find the perfect timepiece banner */}
                <TimepieceBanner />

                {/* Trending Products */}
                {trendingProducts.length > 0 && (
                  <ProductSection 
                    title="Trending Now" 
                    subtitle="What everyone is looking at right now"
                    products={trendingProducts} 
                    viewAllLink="/products?sort=trending"
                  />
                )}
                
                {/* Recently added */}
                {latestProducts.length > 0 && (
                  <ProductSection 
                    title="Recently added" 
                    subtitle="Fresh electronics straight out of the box"
                    products={latestProducts.slice(0, 12)} 
                    viewAllLink="/products"
                  />
                )}

                {/* Official Store */}
                {officialProducts.length > 0 && (
                  <ProductSection 
                    title="From the Official Store" 
                    subtitle="100% genuine guaranteed products"
                    products={officialProducts} 
                    viewAllLink="/officialStore" 
                  />
                )}

                {/* Other products */}
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
