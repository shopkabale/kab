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

// --- SHUFFLE HELPER FUNCTION ---
const shuffleArray = (array: any[]) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default async function Home() {
  const now = Date.now();

  // ==========================================
  // FETCH DATA INSTANTLY FROM CACHE
  // ==========================================
  const data = await getCachedHomepageData();

  // ==========================================
  // DATA PROCESSING & MATH
  // ==========================================
  const trendingProducts = data.trendingProducts;
  const heroProducts = data.heroProducts || [];

  const dealsProducts = [...data.basePool]
    .filter(p => Number(p.price) > 0)
    .sort((a, b) => {
      const scoreA = ((a.views || 0) + 1) / Number(a.price);
      const scoreB = ((b.views || 0) + 1) / Number(b.price);
      return scoreB - scoreA;
    })
    .slice(0, 10);

  // Extract Services (for the new Services and Expert help section)
  const serviceProviders = data.basePool.filter(p => 
    p.category === "services" || (p.tags && p.tags.includes("service"))
  ).slice(0, 10);

  const officialProducts = shuffleArray(data.officialProducts);
  const approvedProducts = shuffleArray(data.approvedProducts);
  const ladiesProducts = shuffleArray(data.ladiesProducts);
  const watchProducts = shuffleArray(data.watchProducts);
  const electronicsProducts = shuffleArray(data.electronicsProducts);
  const studentProducts = shuffleArray(data.studentProducts);
  const agriProducts = shuffleArray(data.agriProducts);
  const latestProducts = data.latestProducts;

  // Using boosted products for "Bundles and packs"
  const boostedProducts = data.boostedProducts
    .filter((p: any) => p.boostExpiresAt && p.boostExpiresAt > now)
    .sort((a: any, b: any) => b.boostedAt - a.boostedAt);

  // ==========================================
  // RENDER UI
  // ==========================================
  return (
    <ThemeProvider>
      {/* ROOT CONTAINER */}
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] pb-10 pt-2 sm:pt-4 font-sans selection:bg-[#FF6A00] selection:text-white overflow-x-hidden">

        <WhatsAppPopup />

        {/* MAIN LAYOUT WRAPPER */}
        <div className="w-full max-w-[1400px] mx-auto px-0 sm:px-4">

          {/* MASTER SPLIT GRID */}
          <div className="flex flex-col md:flex-row gap-4 w-full">

            {/* ========================================== */}
            {/* COLUMN 1: LEFT SIDEBAR (Sticky)            */}
            {/* ========================================== */}
            <div className="hidden md:flex flex-col gap-4 w-[220px] lg:w-[240px] shrink-0 sticky top-[110px] h-max z-10">
              <LeftSidebar />
            </div>

            {/* ========================================== */}
            {/* COLUMN 2: EVERYTHING ELSE (Hero + Feed)    */}
            {/* ========================================== */}
            <div className="flex-grow min-w-0 flex flex-col w-full">

              {/* 1. Hero */}
              <div className="mb-4">
                <HeroCarousel products={heroProducts} />
              </div>

              {/* MAIN FEED SECTION */}
              <div className="w-full flex flex-col gap-4 sm:gap-6">

                {/* 2. Continue Browsing */}
                <ContinueBrowsing 
                  title="Continue Browsing"
                  subtitle="Pick up exactly where you left off"
                  fallbackProducts={trendingProducts} 
                />

                {/* 3. Tech and Appliances */}
                {electronicsProducts.length > 0 && (
                  <HorizontalScroller 
                    title="Tech and Appliances" 
                    subtitle="Gadgets, phones, and computing"
                    products={electronicsProducts} 
                    viewAllLink="/category/electronics" 
                  />
                )}

                {/* 4. Bundles and packs */}
                {boostedProducts.length > 0 && (
                  <HorizontalScroller 
                    title="Bundles and packs" 
                    subtitle="Curated collections to save you more"
                    products={boostedProducts} 
                  />
                )}

                {/* 5. Best deals in kabale */}
                {dealsProducts.length > 0 && (
                  <HorizontalScroller 
                    title="Best deals in Kabale" 
                    subtitle="Affordable & popular items people love"
                    products={dealsProducts} 
                  />
                )}

                {/* 6. Browse by category */}
                <div className="bg-white dark:bg-[#121212] rounded-2xl p-2 sm:p-4 shadow-sm border border-slate-100 dark:border-slate-800/60">
                  <ThemedCategoryGrid />
                </div>

                {/* 7. Services and Expert help */}
                {serviceProviders.length > 0 && (
                  <HorizontalScroller 
                    title="Services and Expert help" 
                    subtitle="Hire verified local professionals"
                    products={serviceProviders} 
                    viewAllLink="/category/services" 
                  />
                )}

                {/* 8. From the Official Store */}
                {officialProducts.length > 0 && (
                  <HorizontalScroller 
                    title="From the Official Store" 
                    subtitle="100% genuine guaranteed products"
                    products={officialProducts} 
                    viewAllLink="/officialStore" 
                  />
                )}

                {/* 9. Trending Now */}
                {trendingProducts.length > 0 && (
                  <HorizontalScroller 
                    title="Trending Now" 
                    subtitle="Most viewed items right now"
                    products={trendingProducts} 
                  />
                )}

                {/* 10. Discover your watch style */}
                {watchProducts.length > 0 && (
                  <HorizontalScroller 
                    title="Discover your watch style" 
                    subtitle="Premium timepieces just for you"
                    products={watchProducts} 
                    viewAllLink="/category/watches" 
                  />
                )}

                {/* 11. Approved quality (ONLY VERTICAL SECTION) */}
                {approvedProducts.length > 0 && (
                  <ProductSection 
                    title="Approved quality" 
                    subtitle="Shop safely from top-rated sellers"
                    products={approvedProducts.slice(0, 8)} 
                  />
                )}

                {/* 12. For Her */}
                {ladiesProducts.length > 0 && (
                  <HorizontalScroller 
                    title="For Her" 
                    subtitle="The latest fashion, beauty & accessories"
                    products={ladiesProducts} 
                    viewAllLink="/ladies" 
                  />
                )}

                {/* 13. Campus Life and study gear */}
                {studentProducts.length > 0 && (
                  <HorizontalScroller 
                    title="Campus Life and study gear" 
                    subtitle="Student-friendly prices and essentials"
                    products={studentProducts} 
                    viewAllLink="/category/student_item" 
                  />
                )}

                {/* 14. Farm Fresh and groceries */}
                {agriProducts.length > 0 && (
                  <HorizontalScroller 
                    title="Farm Fresh and groceries" 
                    subtitle="Direct from the garden to your doorstep"
                    products={agriProducts} 
                    viewAllLink="/category/agriculture" 
                  />
                )}

                {/* 15. New arrivals */}
                {latestProducts.length > 0 && (
                  <HorizontalScroller 
                    title="New arrivals" 
                    subtitle="Fresh drops just added to the market"
                    products={latestProducts} 
                  />
                )}

                {/* 16. Affiliate description (Custom block following UI Rules) */}
                <div className="bg-white dark:bg-[#121212] rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-sm border border-slate-100 dark:border-slate-800">
                  <h2 style={{ color: '#1A1A1A' }} className="text-2xl font-bold dark:text-white mb-3">
                    Earn with Kabale Online
                  </h2>
                  <p style={{ color: '#6B6B6B' }} className="text-base font-normal max-w-lg mb-6 dark:text-gray-400">
                    Share your favorite products with friends and earn a commission on every successful sale. Turn your network into net worth today!
                  </p>
                  <Link 
                    href="/affiliate" 
                    style={{ backgroundColor: '#FF6A00', color: '#FFFFFF' }} 
                    className="px-8 py-3 rounded-full font-bold shadow-md hover:opacity-90 active:scale-95 transition-all"
                  >
                    Join the Affiliate Program
                  </Link>
                </div>

                {/* 17. Kabale online about */}
                <AboutKabaleOnline />

              </div>
            </div>
            {/* END COLUMN 2 */}

          </div>
          {/* END MASTER SPLIT GRID */}

        </div>
      </div>
    </ThemeProvider>
  );
}
