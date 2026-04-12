// app/page.tsx
import UrgentStories from "@/components/UrgentStories";
import HorizontalScroller from "@/components/HorizontalScroller";
import ContinueBrowsing from "@/components/ContinueBrowsing";
import Link from "next/link";
import { getCachedHomepageData } from "@/lib/firebase/fetchers";

// 🔥 NEW VIP UI COMPONENTS
import HeroCarousel from "@/components/HeroCarousel";
import FilterPills from "@/components/FilterPills";
import WhatsAppPopup from "@/components/WhatsAppPopup";
import ProductSection from "@/components/ProductSection";

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

  // ALGORITHM 1: True AI Trending
  const trendingProducts = data.trendingProducts;

  // ALGORITHM 2: Best Deals Math 
  const dealsProducts = [...data.basePool]
    .filter(p => Number(p.price) > 0)
    .sort((a, b) => {
      const scoreA = ((a.views || 0) + 1) / Number(a.price);
      const scoreB = ((b.views || 0) + 1) / Number(b.price);
      return scoreB - scoreA;
    })
    .slice(0, 10);

  // Map and Shuffle Standard Categories
  const officialProducts = shuffleArray(data.officialProducts);
  const approvedProducts = shuffleArray(data.approvedProducts);
  const ladiesProducts = shuffleArray(data.ladiesProducts);
  const watchProducts = shuffleArray(data.watchProducts);
  const electronicsProducts = shuffleArray(data.electronicsProducts);
  const studentProducts = shuffleArray(data.studentProducts);
  const agriProducts = shuffleArray(data.agriProducts);

  // Map Latest (No shuffle, keep chronological)
  const latestProducts = data.latestProducts;

  // Filter Expired Boosts/Features
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#111] pb-8 pt-2 sm:pt-4 font-sans selection:bg-[#D97706] selection:text-white overflow-x-hidden">

      {/* 0. RETENTION TOOL (Only shows if not dismissed) */}
      <WhatsAppPopup />

      {/* 1. TOP MESSAGE - BUYER PROTECTION & REPORTING */}
      <section className="bg-amber-50 dark:bg-[#1a1309] border-b border-amber-200 dark:border-amber-900/50 shadow-sm px-4 py-4 flex flex-col items-center gap-3">
        <div className="text-center max-w-lg">
          <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-wide mb-1">
            Shop With 100% Confidence
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
            Look for what you need, order it, and <span className="text-[#D97706] font-black">pay ONLY after checking</span> if it is the exact product you ordered.
          </p>
        </div>
        <a href="tel:+256759997376" className="flex items-center justify-center gap-2 text-[11px] sm:text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-700 bg-red-100 dark:bg-red-950/40 px-4 py-2 rounded-full transition-colors border border-red-200 dark:border-red-900/50">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Tap to call (0759997376) to report a scam or undelivery
        </a>
      </section>

      {/* MAIN CONTENT WRAPPER */}
      <div className="w-full mt-2">

        {/* 2. THE HOOK: VIP Hero Carousel */}
        <HeroCarousel />

        {/* 3. THE UTILITY: Quick Filter Pills */}
        <FilterPills />

        {/* 4. NAVIGATION: Browse more collections (Moved up for immediate user access) */}
        <section className="bg-slate-100 dark:bg-[#1a1a1a] border-y border-slate-200 dark:border-slate-800 py-4 px-3 sm:px-4 mb-2">
          <div className="w-full text-center py-2 mb-1">
            <h2 className="text-base md:text-lg font-black text-slate-900 dark:text-white capitalize tracking-tight">
              Browse more collections
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-4xl mx-auto mt-2">
            {[
              { 
                name: "Verified Premium", 
                href: "/officialStore",
                image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500&q=80" 
              },
              { 
                name: "Her Glow Up", 
                href: "/ladies",
                image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&q=80" 
              },
              { 
                name: "Tech & Gadgets", 
                href: "/category/electronics",
                image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&q=80" 
              },
              { 
                name: "Campus Survival", 
                href: "/category/student_item",
                image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80" 
              },
              { 
                name: "Farm Fresh", 
                href: "/category/agriculture",
                image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80" 
              },
              { 
                name: "Just Dropped", 
                href: "/products",
                image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=500&q=80" 
              },
            ].map((cat) => (
              <Link key={cat.name} href={cat.href} className="group flex flex-col outline-none">
                <div className="w-full aspect-square bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-1 relative shadow-sm group-hover:shadow-md transition-all duration-300">
                  <img 
                    src={cat.image} 
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <span className="text-[10px] sm:text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-[#D97706] transition-colors leading-snug text-center">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* 5. VISUAL BREAK: Urgent Stories */}
        <UrgentStories />

        <div className="w-full space-y-2 mt-2">

          {/* 6. GRID FORMAT: 🔥 TRENDING NOW (Top 8) */}
          {trendingProducts.length > 0 && (
            <section className="bg-white dark:bg-[#1a1a1a] px-2 sm:px-4 py-2 border-y border-slate-200 dark:border-slate-800">
              <div className="px-2 pt-2 pb-1 z-10 relative">
                <p className="text-xs text-slate-500 font-bold tracking-wide italic">Most viewed items in Kabale right now</p>
              </div>
              <ProductSection 
                title="🔥 Trending Now" 
                products={trendingProducts.slice(0, 8)} // Limits to 8
              />
            </section>
          )}

          {/* 7. 🔁 CONTINUE BROWSING */}
          <ContinueBrowsing fallbackProducts={trendingProducts} />

          {/* 8. GRID FORMAT: 🛡️ VERIFIED & TRUSTED (Top 8) */}
          {approvedProducts.length > 0 && (
            <section className="bg-white dark:bg-[#1a1a1a] px-2 sm:px-4 py-2 border-y border-slate-200 dark:border-slate-800">
              <ProductSection 
                title="🛡️ Verified & Trusted" 
                products={approvedProducts.slice(0, 8)} // Limits to 8
              />
            </section>
          )}

          {/* 9. SCROLLER: 💸 BEST DEALS */}
          {dealsProducts.length > 0 && (
            <section className="w-full">
              <div className="px-4 pt-2 -mb-2 z-10 relative">
                <p className="text-xs text-slate-500 font-bold tracking-wide italic">Affordable & popular items people love</p>
              </div>
              <HorizontalScroller title="💸 Best Deals in Kabale" products={dealsProducts} />
            </section>
          )}

          {/* 10. SCROLLER: TRENDING FOR HER */}
          {ladiesProducts.length > 0 && (
            <section className="w-full">
              <HorizontalScroller 
                title="Trending for her" 
                products={ladiesProducts} 
                viewAllLink="/ladies" 
              />
            </section>
          )}

          {/* 11. SCROLLER: DISCOVER YOUR WATCH STYLE */}
          {watchProducts.length > 0 && (
            <section className="w-full">
              <HorizontalScroller 
                title="Discover your watch style" 
                products={watchProducts} 
                viewAllLink="/officialStore" 
              />
            </section>
          )}

          {/* 12. SCROLLER: OFFICIAL COLLECTION */}
          {officialProducts.length > 0 && (
            <section className="w-full">
              <HorizontalScroller 
                title="Official collection" 
                products={officialProducts} 
                viewAllLink="/officialStore" 
              />
            </section>
          )}

          {/* 13. SCROLLER: NEW ARRIVALS */}
          {latestProducts.length > 0 && (
            <section className="w-full">
              <HorizontalScroller 
                title="New arrivals" 
                products={latestProducts} 
                viewAllLink="/products" 
              />
            </section>
          )}

          {/* 14. SCROLLER: SPONSORED PICKS */}
          {boostedProducts.length > 0 && (
            <section className="w-full">
              <HorizontalScroller title="Sponsored picks" products={boostedProducts} />
            </section>
          )}

          {/* 15. SCROLLER: TECH ESSENTIALS */}
          {electronicsProducts.length > 0 && (
            <section className="w-full">
              <HorizontalScroller 
                title="Tech essentials" 
                products={electronicsProducts} 
                viewAllLink="/category/electronics" 
              />
            </section>
          )}

          {/* 16. SCROLLER: TOP PICKS */}
          {featuredProducts.length > 0 && (
            <section className="w-full">
              <HorizontalScroller title="Top picks" products={featuredProducts} />
            </section>
          )}

          {/* 17. SCROLLER: CAMPUS DEALS */}
          {studentProducts.length > 0 && (
            <section className="w-full">
              <HorizontalScroller 
                title="Campus deals" 
                products={studentProducts} 
                viewAllLink="/category/student_item" 
              />
            </section>
          )}

          {/* 18. SCROLLER: FRESH MARKET */}
          {agriProducts.length > 0 && (
            <section className="w-full">
              <HorizontalScroller 
                title="Fresh market" 
                products={agriProducts} 
                viewAllLink="/category/agriculture" 
              />
            </section>
          )}
        </div>

        {/* 19. SELL CTA BANNER */}
        <section className="relative py-8 md:py-10 overflow-hidden w-full bg-white dark:bg-[#111] border-y border-slate-200 dark:border-slate-800 shadow-sm mt-4">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#D97706]/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative z-10 w-full max-w-[900px] mx-auto px-4 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D97706]/10 text-[#D97706] text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D97706] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D97706]"></span>
              </span>
              Kabale Seller Network
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-3 text-slate-900 dark:text-white tracking-tight leading-tight">
              Turn your items into <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D97706] to-amber-500">cash instantly.</span>
            </h2>

            <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 mb-6 leading-relaxed font-medium max-w-xl mx-auto">
              Reach thousands of buyers across Kabale.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto justify-center">
              <Link
                href="/sell"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-[#D97706] hover:bg-amber-600 text-white font-bold text-sm md:text-base rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 w-full sm:w-auto"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 4.5v15m7.5-7.5h-15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Post an Item to Sell
              </Link>
              <a
                href="https://wa.me/256759997376?text=Hello,%20I%20need%20support%20with%20Kabale%20Online"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-sm md:text-base rounded-xl transition-all w-full sm:w-auto"
              >
                <svg className="w-4 h-4 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp Support: 0759997376
              </a>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
