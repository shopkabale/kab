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
  // DATA PROCESSING & MATH (In-Memory, Lightning Fast)
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
      <div className="min-h-screen bg-slate-50 dark:bg-[#111] pb-8 pt-2 sm:pt-4 font-sans selection:bg-[#D97706] selection:text-white overflow-x-hidden">

        <WhatsAppPopup />

        <div className="w-full mt-2">

          <HeroCarousel products={heroProducts} />
          <FilterPills />
          <ThemedCategoryGrid />
          <UrgentStories />

          <div className="w-full space-y-2 mt-2">

            {/* 1. CONTINUE BROWSING (High Intent) */}
            <ContinueBrowsing 
              title="Continue Browsing"
              subtitle="Pick up exactly where you left off"
              fallbackProducts={trendingProducts} 
            />

            {/* 2. BEST DEALS (High Conversion) */}
            {dealsProducts.length > 0 && (
              <section className="w-full bg-white dark:bg-[#1a1a1a] border-y border-slate-200 dark:border-slate-800">
                <HorizontalScroller 
                  title="Best Deals in Kabale" 
                  subtitle="Affordable & popular items people love"
                  products={dealsProducts} 
                />
              </section>
            )}

            {/* TRUST BANNER BREAK */}
            <ShopWithConfidenceBanner />

            {/* 3. VERIFIED & TRUSTED */}
            {approvedProducts.length > 0 && (
              <section className="bg-white dark:bg-[#1a1a1a] px-2 sm:px-4 py-2 border-y border-slate-200 dark:border-slate-800">
                <ProductSection 
                  title="Verified & Trusted" 
                  subtitle="Shop safely from top-rated sellers"
                  products={approvedProducts.slice(0, 8)} 
                />
              </section>
            )}

            {/* 4. TRENDING FOR HER */}
            {ladiesProducts.length > 0 && (
              <section className="w-full">
                <HorizontalScroller 
                  title="Trending for Her" 
                  subtitle="The latest fashion, beauty & accessories"
                  products={ladiesProducts} 
                  viewAllLink="/ladies" 
                />
              </section>
            )}

            {/* 5. NEW ARRIVALS */}
            {latestProducts.length > 0 && (
              <section className="bg-white dark:bg-[#1a1a1a] px-2 sm:px-4 py-2 border-y border-slate-200 dark:border-slate-800 mb-2 relative">
                <ProductSection 
                  title="New Arrivals" 
                  subtitle="Fresh drops just added to the market"
                  products={latestProducts.slice(0, 8)} 
                />
                <div className="absolute top-[18px] sm:top-[22px] right-6 sm:right-8 z-10">
                  <Link href="/products" className="text-slate-900 dark:text-white hover:opacity-70 text-[10px] sm:text-xs font-bold uppercase tracking-widest flex items-center gap-1 transition-all outline-none whitespace-nowrap">
                    View All
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                  </Link>
                </div>
              </section>
            )}

            {/* TRENDING NOW */}
            {trendingProducts.length > 0 && (
              <section className="bg-white dark:bg-[#1a1a1a] px-2 sm:px-4 py-2 border-y border-slate-200 dark:border-slate-800">
                <ProductSection 
                  title="Trending Now" 
                  subtitle="Most viewed items right now"
                  products={trendingProducts.slice(0, 8)} 
                />
              </section>
            )}

            {/* WATCHES */}
            {watchProducts.length > 0 && (
              <section className="w-full">
                <HorizontalScroller 
                  title="Discover Your Style" 
                  subtitle="Premium timepieces just for you"
                  products={watchProducts} 
                  viewAllLink="/officialStore" 
                />
              </section>
            )}

            {/* OFFICIAL COLLECTION */}
            {officialProducts.length > 0 && (
              <section className="w-full">
                <HorizontalScroller 
                  title="Official Collection" 
                  subtitle="Curated picks from verified official stores"
                  products={officialProducts} 
                  viewAllLink="/officialStore" 
                />
              </section>
            )}

            {/* SPONSORED */}
            {boostedProducts.length > 0 && (
              <section className="w-full">
                <HorizontalScroller 
                  title="Sponsored Picks" 
                  subtitle="Promoted products you might like"
                  products={boostedProducts} 
                />
              </section>
            )}

            {/* SELL BANNER BREAK */}
            <SellCtaBanner />

            {/* TECH ESSENTIALS */}
            {electronicsProducts.length > 0 && (
              <section className="w-full">
                <HorizontalScroller 
                  title="Tech Essentials" 
                  subtitle="Gadgets, phones, and computing"
                  products={electronicsProducts} 
                  viewAllLink="/category/electronics" 
                />
              </section>
            )}

            {/* TOP PICKS */}
            {featuredProducts.length > 0 && (
              <section className="w-full">
                <HorizontalScroller 
                  title="Top Picks" 
                  subtitle="Highly recommended for you"
                  products={featuredProducts} 
                />
              </section>
            )}

            {/* CAMPUS DEALS */}
            {studentProducts.length > 0 && (
              <section className="w-full">
                <HorizontalScroller 
                  title="Campus Deals" 
                  subtitle="Student-friendly prices and essentials"
                  products={studentProducts} 
                  viewAllLink="/category/student_item" 
                />
              </section>
            )}

            {/* FRESH MARKET */}
            {agriProducts.length > 0 && (
              <section className="w-full">
                <HorizontalScroller 
                  title="Fresh Market" 
                  subtitle="Farm produce & agricultural gear"
                  products={agriProducts} 
                  viewAllLink="/category/agriculture" 
                />
              </section>
            )}

            {/* JUMIA-STYLE SEO & ABOUT SECTION */}
            <AboutKabaleOnline />

          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
