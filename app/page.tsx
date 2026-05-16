import HorizontalScroller from "@/components/HorizontalScroller";
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
import ExperienceBanner from "@/components/banners/ExperienceBanner";
import WhatsAppBanner from "@/components/banners/WhatsAppBanner";

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

  // 🔥 THE FIX: Now using the dedicated direct array from Firebase
  const otherProducts = data.otherProducts || [];

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-transparent pb-10 pt-2 sm:pt-4 font-sans selection:bg-[#FF6A00] selection:text-white overflow-x-hidden">
        <WhatsAppPopup />
        <div className="w-full max-w-[1400px] mx-auto px-0 sm:px-4">
          <div className="flex flex-col md:flex-row gap-4 w-full">

            {/* LEFT SIDEBAR */}
            <div className="hidden md:flex flex-col gap-4 w-[220px] lg:w-[240px] shrink-0 sticky top-[110px] h-max z-10">
              <LeftSidebar />
            </div>

            {/* MAIN FEED */}
            <div className="flex-grow min-w-0 flex flex-col w-full">
              
              {/* 1. Hero */}
              <div className="mb-4">
                <HeroCarousel products={heroProducts} />
              </div>

              <div className="w-full flex flex-col gap-4 sm:gap-6">

                {/* 2. Continue Browsing (Original wrapper) */}
                <ContinueBrowsing 
                  title="Continue Browsing"
                  subtitle="Pick up exactly where you left off"
                  fallbackProducts={trendingProducts} 
                />

                {/* 3. Find the perfect timepiece banner */}
                <TimepieceBanner />

                {/* 4. Explore by category */}
                <div className="bg-transparent rounded-2xl p-2 sm:p-4 shadow-sm border border-slate-100 dark:border-slate-800/60">
                  <ThemedCategoryGrid />
                </div>

                {/* 5. Featured collection (ProductSection Grid) */}
                {featuredCollection.length > 0 && (
                  <ProductSection 
                    title="Featured collection" 
                    subtitle="Premium picks of the week"
                    products={featuredCollection} 
                    viewAllLink="/category/featured"
                  />
                )}

                {/* 6. Save up to 4k (ProductSection Grid) */}
                {save4kProducts.length > 0 && (
                  <ProductSection 
                    title="Save up to 4k" 
                    subtitle="Massive discounts on top electronics"
                    products={save4kProducts} 
                    viewAllLink="/deals"
                  />
                )}

                {/* 7. Hand picked for you (ProductSection Grid) */}
                {handPickedProducts.length > 0 && (
                  <ProductSection 
                    title="Hand picked for you" 
                    subtitle="Curated electronics tailored for performance"
                    products={handPickedProducts} 
                    viewAllLink="/products"
                  />
                )}

                {/* 8. Trending Products (ProductSection Grid) */}
                {trendingProducts.length > 0 && (
                  <ProductSection 
                    title="Trending Now" 
                    subtitle="What everyone is looking at right now"
                    products={trendingProducts} 
                    viewAllLink="/products?sort=trending"
                  />
                )}

                {/* 9. We deliver customer experiences banner */}
                <ExperienceBanner />

                {/* 10. Recently added (ProductSection Grid) */}
                {latestProducts.length > 0 && (
                  <ProductSection 
                    title="Recently added" 
                    subtitle="Fresh electronics straight out of the box"
                    products={latestProducts.slice(0, 12)} 
                    viewAllLink="/products"
                  />
                )}

                {/* 11. Official Store (Horizontal Scroller) */}
                {officialProducts.length > 0 && (
                  <HorizontalScroller 
                    title="From the Official Store" 
                    subtitle="100% genuine guaranteed products"
                    products={officialProducts} 
                    viewAllLink="/officialStore" 
                  />
                )}

                {/* 12. Other products (Horizontal Scroller) */}
                {otherProducts.length > 0 && (
                  <HorizontalScroller 
                    title="Other Products" 
                    subtitle="Explore beyond electronics"
                    products={otherProducts} 
                    viewAllLink="/category/other-products" 
                  />
                )}

                {/* 13. Shop via WhatsApp banner */}
                <WhatsAppBanner />

                <AboutKabaleOnline />

              </div>
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
