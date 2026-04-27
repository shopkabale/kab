import UrgentStories from "@/components/UrgentStories";
import HorizontalScroller from "@/components/HorizontalScroller";
import ContinueBrowsing from "@/components/ContinueBrowsing";
import Link from "next/link";
import { getCachedHomepageData } from "@/lib/firebase/fetchers";

// VIP UI COMPONENTS
import HeroCarousel from "@/components/HeroCarousel";
import FilterPills from "@/components/FilterPills";
import WhatsAppPopup from "@/components/WhatsAppPopup";
import ProductSection from "@/components/ProductSection";
import AboutKabaleOnline from "@/components/AboutKabaleOnline";
import ThemedCategoryGrid from "@/components/ThemedCategoryGrid";
import ShopWithConfidenceBanner from "@/components/ShopWithConfidenceBanner"; 
import SellCtaBanner from "@/components/SellCtaBanner"; 
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

  // Deals Logic
  const dealsProducts = [...data.basePool]
    .filter(p => Number(p.price) > 0)
    .sort((a, b) => {
      const scoreA = ((a.views || 0) + 1) / Number(a.price);
      const scoreB = ((b.views || 0) + 1) / Number(b.price);
      return scoreB - scoreA;
    })
    .slice(0, 10);

  const officialProducts = shuffleArray(data.officialProducts);
  const approvedProducts = shuffleArray(data.approvedProducts);
  const ladiesProducts = shuffleArray(data.ladiesProducts);
  const watchProducts = shuffleArray(data.watchProducts);
  const electronicsProducts = shuffleArray(data.electronicsProducts);
  const studentProducts = shuffleArray(data.studentProducts);
  const agriProducts = shuffleArray(data.agriProducts);
  const latestProducts = data.latestProducts;

  const boostedProducts = data.boostedProducts
    .filter((p: any) => p.boostExpiresAt && p.boostExpiresAt > now)
    .sort((a: any, b: any) => b.boostedAt - a.boostedAt);

  const featuredProducts = data.featuredProducts
    .filter((p: any) => p.featureExpiresAt && p.featureExpiresAt > now)
    .sort((a: any, b: any) => b.featuredAt - a.featuredAt);

  // ==========================================
  // RENDER UI
  // ==========================================
  return (
    <ThemeProvider>
      {/* ROOT CONTAINER */}
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] pb-10 pt-2 sm:pt-4 font-sans selection:bg-[#D97706] selection:text-white overflow-x-hidden">

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
            {/* COLUMN 2: THE SHOPPING FEED                */}
            {/* ========================================== */}
            <div className="flex-grow min-w-0 flex flex-col w-full">
              
              {/* --- 1. THE HOOK (Capture Attention Instantly) --- */}
              <div className="mb-2">
                <HeroCarousel products={heroProducts} />
              </div>
              <FilterPills />
              
              {/* Category Navigation that pops */}
              <div className="bg-white dark:bg-[#121212] rounded-2xl p-2 sm:p-4 shadow-sm border border-slate-100 dark:border-slate-800/60 mb-4">
                <ThemedCategoryGrid />
              </div>
              
              <UrgentStories />

              {/* --- 2. THE FOMO ZONE (High Urgency & Retargeting) --- */}
              <div className="w-full flex flex-col gap-4 sm:gap-6 mt-4">

                <ContinueBrowsing 
                  title="Jump Back In"
                  subtitle="Don't lose out on what you were looking at"
                  fallbackProducts={trendingProducts} 
                />

                {/* Highlighted Deals Section */}
                {dealsProducts.length > 0 && (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-3xl p-4 sm:p-6 border border-amber-100 dark:border-amber-900/30 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 blur-3xl rounded-full pointer-events-none"></div>
                    <HorizontalScroller 
                      title="⚡ Flash Steals in Kabale" 
                      subtitle="Insane value. These won't last long."
                      products={dealsProducts} 
                    />
                  </div>
                )}

                {/* --- 3. THE TRUST LAYER --- */}
                <ShopWithConfidenceBanner />

                {officialProducts.length > 0 && (
                  <HorizontalScroller 
                    title="👑 Official & Premium" 
                    subtitle="100% genuine products from verified brands"
                    products={officialProducts} 
                    viewAllLink="/officialStore" 
                  />
                )}

                {/* --- 4. HYPER-TARGETED NICHES --- */}
                
                {studentProducts.length > 0 && (
                  <HorizontalScroller 
                    title="🎒 Campus Essentials" 
                    subtitle="Student-friendly prices for the semester"
                    products={studentProducts} 
                    viewAllLink="/category/student_item" 
                  />
                )}

                {ladiesProducts.length > 0 && (
                  <HorizontalScroller 
                    title="✨ The Style Edit: For Her" 
                    subtitle="Trending fashion, beauty, and accessories"
                    products={ladiesProducts} 
                    viewAllLink="/ladies" 
                  />
                )}

                {electronicsProducts.length > 0 && (
                  <HorizontalScroller 
                    title="💻 The Tech Hub" 
                    subtitle="Upgrades for your digital life"
                    products={electronicsProducts} 
                    viewAllLink="/category/electronics" 
                  />
                )}

                {/* --- 5. SOCIAL PROOF & DISCOVERY --- */}

                {trendingProducts.length > 0 && (
                  <ProductSection 
                    title="🔥 Breaking the Internet" 
                    subtitle="What everyone in Kigezi is viewing right now"
                    products={trendingProducts.slice(0, 8)} 
                  />
                )}

                {approvedProducts.length > 0 && (
                  <ProductSection 
                    title="Top-Rated Sellers" 
                    subtitle="Shop safely from our most trusted vendors"
                    products={approvedProducts.slice(0, 8)} 
                  />
                )}

                {/* --- 6. ACTION & COMMUNITY --- */}
                <div className="my-2">
                  <SellCtaBanner />
                </div>

                {/* --- 7. THE DEEP SCROLL (Exploration) --- */}

                {latestProducts.length > 0 && (
                  <ProductSection 
                    title="Fresh Drops" 
                    subtitle="Just landed on the marketplace today"
                    products={latestProducts.slice(0, 8)} 
                  />
                )}

                {agriProducts.length > 0 && (
                  <HorizontalScroller 
                    title="🌾 Fresh Market" 
                    subtitle="Support local: Farm produce & tools"
                    products={agriProducts} 
                    viewAllLink="/category/agriculture" 
                  />
                )}

                {watchProducts.length > 0 && (
                  <HorizontalScroller 
                    title="⌚ Wrist Game" 
                    subtitle="Premium timepieces to complete your look"
                    products={watchProducts} 
                    viewAllLink="/category/watches" 
                  />
                )}

                {boostedProducts.length > 0 && (
                  <HorizontalScroller 
                    title="Sponsored Highlights" 
                    subtitle="Promoted products from our partners"
                    products={boostedProducts} 
                  />
                )}

                {featuredProducts.length > 0 && (
                  <HorizontalScroller 
                    title="Handpicked For You" 
                    subtitle="Our editors' top recommendations"
                    products={featuredProducts} 
                  />
                )}

                {/* FOOTER AREA */}
                <div className="mt-8">
                  <AboutKabaleOnline />
                </div>

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
