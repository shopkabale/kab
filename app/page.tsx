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
      {/* ROOT CONTAINER: Fully transparent so the globals.css gradient shines through */}
      <div className="min-h-screen bg-transparent pb-10 pt-2 sm:pt-4 font-sans selection:bg-[#D97706] selection:text-white overflow-x-hidden">

        <WhatsAppPopup />

        {/* MAIN LAYOUT WRAPPER: Limits ultra-wide screens to a readable width */}
        <div className="w-full max-w-[1400px] mx-auto px-0 sm:px-4">

          {/* TOP SECTION: Jumia-style Split Grid for Desktop */}
          <div className="flex flex-col md:flex-row gap-4 mb-2 w-full">

            {/* LEFT SIDEBAR AREA */}
            {/* Transparent wrapper; the LeftSidebar handles its own white cards */}
            <div className="hidden md:flex flex-col gap-4 w-[220px] lg:w-[240px] shrink-0 sticky top-[110px] h-max z-10">
              <LeftSidebar />
            </div>

            {/* CENTER CONTENT: Hero Banner, Pills, and Categories */}
            <div className="flex-grow min-w-0 flex flex-col w-full">
              <HeroCarousel products={heroProducts} />
              <FilterPills />
              <ThemedCategoryGrid />
              <UrgentStories />
            </div>

          </div>

          {/* MAIN FEED SECTION: All wrappers removed. Components sit directly on the gradient as "White Islands". */}
          <div className="w-full flex flex-col gap-2 sm:gap-4 mt-2">

            {/* 1. CONTINUE BROWSING */}
            <ContinueBrowsing 
              title="Continue Browsing"
              subtitle="Pick up exactly where you left off"
              fallbackProducts={trendingProducts} 
            />

            {/* 2. BEST DEALS */}
            {dealsProducts.length > 0 && (
              <HorizontalScroller 
                title="Best Deals in Kabale" 
                subtitle="Affordable & popular items people love"
                products={dealsProducts} 
              />
            )}

            {/* TRUST BANNER BREAK */}
            <ShopWithConfidenceBanner />

            {/* 3. VERIFIED & TRUSTED */}
            {approvedProducts.length > 0 && (
              <ProductSection 
                title="Verified & Trusted" 
                subtitle="Shop safely from top-rated sellers"
                products={approvedProducts.slice(0, 8)} 
              />
            )}

            {/* 4. TRENDING FOR HER */}
            {ladiesProducts.length > 0 && (
              <HorizontalScroller 
                title="Trending for Her" 
                subtitle="The latest fashion, beauty & accessories"
                products={ladiesProducts} 
                viewAllLink="/ladies" 
              />
            )}

            {/* 5. NEW ARRIVALS */}
            {latestProducts.length > 0 && (
              <ProductSection 
                title="New Arrivals" 
                subtitle="Fresh drops just added to the market"
                products={latestProducts.slice(0, 8)} 
              />
            )}

            {/* TRENDING NOW */}
            {trendingProducts.length > 0 && (
              <ProductSection 
                title="Trending Now" 
                subtitle="Most viewed items right now"
                products={trendingProducts.slice(0, 8)} 
              />
            )}

            {/* WATCHES */}
            {watchProducts.length > 0 && (
              <HorizontalScroller 
                title="Discover Your Style" 
                subtitle="Premium timepieces just for you"
                products={watchProducts} 
                viewAllLink="/officialStore" 
              />
            )}

            {/* OFFICIAL COLLECTION */}
            {officialProducts.length > 0 && (
              <HorizontalScroller 
                title="Official Collection" 
                subtitle="Curated picks from verified official stores"
                products={officialProducts} 
                viewAllLink="/officialStore" 
              />
            )}

            {/* SPONSORED */}
            {boostedProducts.length > 0 && (
              <HorizontalScroller 
                title="Sponsored Picks" 
                subtitle="Promoted products you might like"
                products={boostedProducts} 
              />
            )}

            {/* SELL BANNER BREAK */}
            <SellCtaBanner />

            {/* TECH ESSENTIALS */}
            {electronicsProducts.length > 0 && (
              <HorizontalScroller 
                title="Tech Essentials" 
                subtitle="Gadgets, phones, and computing"
                products={electronicsProducts} 
                viewAllLink="/category/electronics" 
              />
            )}

            {/* TOP PICKS */}
            {featuredProducts.length > 0 && (
              <HorizontalScroller 
                title="Top Picks" 
                subtitle="Highly recommended for you"
                products={featuredProducts} 
              />
            )}

            {/* CAMPUS DEALS */}
            {studentProducts.length > 0 && (
              <HorizontalScroller 
                title="Campus Deals" 
                subtitle="Student-friendly prices and essentials"
                products={studentProducts} 
                viewAllLink="/category/student_item" 
              />
            )}

            {/* FRESH MARKET */}
            {agriProducts.length > 0 && (
              <HorizontalScroller 
                title="Fresh Market" 
                subtitle="Farm produce & agricultural gear"
                products={agriProducts} 
                viewAllLink="/category/agriculture" 
              />
            )}

            {/* JUMIA-STYLE SEO & ABOUT SECTION */}
            <AboutKabaleOnline />

          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
