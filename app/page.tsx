import UrgentStories from "@/components/UrgentStories";
import HorizontalScroller from "@/components/HorizontalScroller";
import ContinueBrowsing from "@/components/ContinueBrowsing";
import Link from "next/link";
import { getCachedHomepageData } from "@/lib/firebase/fetchers";

// 🔥 VIP UI COMPONENTS
import HeroCarousel from "@/components/HeroCarousel";
import FilterPills from "@/components/FilterPills";
import WhatsAppPopup from "@/components/WhatsAppPopup";
import ProductSection from "@/components/ProductSection";
import AboutKabaleOnline from "@/components/AboutKabaleOnline";
import ThemedCategoryGrid from "@/components/ThemedCategoryGrid";
import ShopWithConfidenceBanner from "@/components/ShopWithConfidenceBanner"; // 🔥 NEW
import SellCtaBanner from "@/components/SellCtaBanner"; // 🔥 NEW
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
  // 🔥 FETCH DATA INSTANTLY FROM CACHE 🔥
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

          {/* DYNAMIC THEMED CATEGORY GRID */}
          <ThemedCategoryGrid />

          <UrgentStories />

          <div className="w-full space-y-2 mt-2">

            {/* 🔥 TRENDING NOW (Cleaned up overlapping subtitle) */}
            {trendingProducts.length > 0 && (
              <section className="bg-white dark:bg-[#1a1a1a] px-2 sm:px-4 py-2 border-y border-slate-200 dark:border-slate-800">
                <ProductSection 
                  title="🔥 Trending Now" 
                  subtitle="Most viewed items in Kabale right now"
                  products={trendingProducts.slice(0, 8)} 
                />
              </section>
            )}

            {/* 🔥 DYNAMIC COLOR BANNER */}
            <ShopWithConfidenceBanner />

            <ContinueBrowsing 
  title="🔁 Continue Browsing" 
  subtitle="Pick up where you left off" 
  fallbackProducts={trendingProducts} 
/>

            {/* ✨ NEW ARRIVALS */}
            {latestProducts.length > 0 && (
              <section className="bg-white dark:bg-[#1a1a1a] px-2 sm:px-4 py-2 border-y border-slate-200 dark:border-slate-800 mb-2 relative">
                <ProductSection 
                  title="✨ New Arrivals" 
                  subtitle="Fresh drops added to the market"
                  products={latestProducts.slice(0, 8)} 
                />
                {/* Floating "View All" link positioned perfectly on the right side of the header */}
                <div className="absolute top-[18px] sm:top-[22px] right-6 sm:right-8 z-10">
                  <Link href="/products" className="text-slate-900 dark:text-white hover:opacity-70 text-[10px] sm:text-xs font-bold uppercase tracking-widest flex items-center gap-1 transition-all outline-none whitespace-nowrap">
                    View All
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                  </Link>
                </div>
              </section>
            )}

            {/* 🛡️ VERIFIED & TRUSTED */}
            {approvedProducts.length > 0 && (
              <section className="bg-white dark:bg-[#1a1a1a] px-2 sm:px-4 py-2 border-y border-slate-200 dark:border-slate-800">
                <ProductSection 
                  title="🛡️ Verified & Trusted" 
                  products={approvedProducts.slice(0, 8)} 
                />
              </section>
            )}

            {/* 💸 BEST DEALS (Cleaned up overlapping subtitle) */}
            {dealsProducts.length > 0 && (
              <section className="w-full">
                <HorizontalScroller 
                  title="💸 Best Deals in Kabale" 
                  subtitle="Affordable & popular items people love"
                  products={dealsProducts} 
                />
              </section>
            )}

            {/* OTHER SCROLLERS */}
            {ladiesProducts.length > 0 && (
              <section className="w-full">
                <HorizontalScroller title="Trending for her" products={ladiesProducts} viewAllLink="/ladies" />
              </section>
            )}

            {watchProducts.length > 0 && (
              <section className="w-full">
                <HorizontalScroller title="Discover your watch style" products={watchProducts} viewAllLink="/officialStore" />
              </section>
            )}

            {officialProducts.length > 0 && (
              <section className="w-full">
                <HorizontalScroller title="Official collection" products={officialProducts} viewAllLink="/officialStore" />
              </section>
            )}

            {boostedProducts.length > 0 && (
              <section className="w-full">
                <HorizontalScroller title="Sponsored picks" products={boostedProducts} />
              </section>
            )}

            {/* 🔥 DYNAMIC COLOR SELL BANNER */}
            <SellCtaBanner />

            {electronicsProducts.length > 0 && (
              <section className="w-full">
                <HorizontalScroller title="Tech essentials" products={electronicsProducts} viewAllLink="/category/electronics" />
              </section>
            )}

            {featuredProducts.length > 0 && (
              <section className="w-full">
                <HorizontalScroller title="Top picks" products={featuredProducts} />
              </section>
            )}

            {studentProducts.length > 0 && (
              <section className="w-full">
                <HorizontalScroller title="Campus deals" products={studentProducts} viewAllLink="/category/student_item" />
              </section>
            )}

            {agriProducts.length > 0 && (
              <section className="w-full">
                <HorizontalScroller title="Fresh market" products={agriProducts} viewAllLink="/category/agriculture" />
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
