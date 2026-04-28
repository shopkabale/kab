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
  const data = await getCachedHomepageData();

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

  const serviceProviders = data.basePool.filter(p => 
    p.category === "services" || (p.tags && p.tags.includes("service"))
  ).slice(0, 10);

  const bundlesProducts = data.basePool.filter(p => p.category === "bundles");

  const officialProducts = shuffleArray(data.officialProducts);
  const approvedProducts = shuffleArray(data.approvedProducts);
  const ladiesProducts = shuffleArray(data.ladiesProducts);
  const watchProducts = shuffleArray(data.watchProducts);
  const electronicsProducts = shuffleArray(data.electronicsProducts);
  const studentProducts = shuffleArray(data.studentProducts);
  const agriProducts = shuffleArray(data.agriProducts);
  const latestProducts = data.latestProducts;

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] pb-10 pt-2 sm:pt-4 font-sans selection:bg-[#FF6A00] selection:text-white overflow-x-hidden">
        <WhatsAppPopup />
        <div className="w-full max-w-[1400px] mx-auto px-0 sm:px-4">
          <div className="flex flex-col md:flex-row gap-4 w-full">
            
            {/* LEFT SIDEBAR */}
            <div className="hidden md:flex flex-col gap-4 w-[220px] lg:w-[240px] shrink-0 sticky top-[110px] h-max z-10">
              <LeftSidebar />
            </div>

            {/* MAIN FEED */}
            <div className="flex-grow min-w-0 flex flex-col w-full">
              <div className="mb-4">
                <HeroCarousel products={heroProducts} />
              </div>

              <div className="w-full flex flex-col gap-4 sm:gap-6">
                
                <ContinueBrowsing 
                  title="Continue Browsing"
                  subtitle="Pick up exactly where you left off"
                  fallbackProducts={trendingProducts} 
                />

                {electronicsProducts.length > 0 && (
                  <HorizontalScroller 
                    title="Tech and Appliances" 
                    subtitle="Gadgets, phones, and computing"
                    products={electronicsProducts} 
                    viewAllLink="/category/electronics" 
                  />
                )}

                {bundlesProducts.length > 0 && (
                  <HorizontalScroller 
                    title="Bundles and packs" 
                    subtitle="Curated collections to save you more"
                    products={bundlesProducts} 
                    viewAllLink="/category/mega-bundles"
                  />
                )}

                {dealsProducts.length > 0 && (
                  <HorizontalScroller 
                    title="Best deals in Kabale" 
                    subtitle="Affordable & popular items people love"
                    products={dealsProducts} 
                    viewAllLink="/category/tech-appliances?max=50000"
                  />
                )}

                <div className="bg-white dark:bg-[#121212] rounded-2xl p-2 sm:p-4 shadow-sm border border-slate-100 dark:border-slate-800/60">
                  <ThemedCategoryGrid />
                </div>

                {serviceProviders.length > 0 && (
                  <HorizontalScroller 
                    title="Services and Expert help" 
                    subtitle="Hire verified local professionals"
                    products={serviceProviders} 
                    viewAllLink="/category/services" 
                  />
                )}

                {officialProducts.length > 0 && (
                  <HorizontalScroller 
                    title="From the Official Store" 
                    subtitle="100% genuine guaranteed products"
                    products={officialProducts} 
                    viewAllLink="/officialStore" 
                  />
                )}

                {/* ADDED VIEW MORE LINK HERE */}
                {trendingProducts.length > 0 && (
                  <HorizontalScroller 
                    title="Trending Now" 
                    subtitle="Most viewed items right now"
                    products={trendingProducts} 
                    viewAllLink="/category/tech-appliances?max=50000" 
                  />
                )}

                {watchProducts.length > 0 && (
                  <HorizontalScroller 
                    title="Discover your watch style" 
                    subtitle="Premium timepieces just for you"
                    products={watchProducts} 
                    viewAllLink="/category/watches" 
                  />
                )}

                {/* APPROVED QUALITY VERTICAL GRID */}
                {approvedProducts.length > 0 && (
                  <ProductSection 
                    title="Approved quality" 
                    subtitle="Shop safely from top-rated sellers"
                    products={approvedProducts.slice(0, 8)} 
                    viewAllLink="/officialStore"
                  />
                )}

                {ladiesProducts.length > 0 && (
                  <HorizontalScroller 
                    title="For Her" 
                    subtitle="The latest fashion, beauty & accessories"
                    products={ladiesProducts} 
                    viewAllLink="/ladies" 
                  />
                )}

                {studentProducts.length > 0 && (
                  <HorizontalScroller 
                    title="Campus Life and study gear" 
                    subtitle="Student-friendly prices and essentials"
                    products={studentProducts} 
                    viewAllLink="/category/student_item" 
                  />
                )}

                {agriProducts.length > 0 && (
                  <HorizontalScroller 
                    title="Farm Fresh and groceries" 
                    subtitle="Direct from the garden to your doorstep"
                    products={agriProducts} 
                    viewAllLink="/category/agriculture" 
                  />
                )}

                {/* ADDED VIEW MORE LINK HERE */}
                {latestProducts.length > 0 && (
                  <HorizontalScroller 
                    title="New arrivals" 
                    subtitle="Fresh drops just added to the market"
                    products={latestProducts} 
                    viewAllLink="/products"
                  />
                )}

                {/* UPDATED AFFILIATE BANNER - Direct & Short */}
                <div className="bg-white dark:bg-[#121212] rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800">
                  <h2 style={{ color: '#1A1A1A' }} className="text-2xl font-bold dark:text-white mb-2 text-center">
                    Share. Earn. Repeat.
                  </h2>
                  <p style={{ color: '#6B6B6B' }} className="text-sm md:text-base mb-6 text-center dark:text-slate-400">
                    Earn cash by sharing your favorite Kabale Online items.
                  </p>
                  
                  <ul style={{ color: '#1A1A1A' }} className="flex flex-col gap-3 text-sm font-medium max-w-md mb-8 dark:text-slate-300 w-full text-left bg-slate-50 dark:bg-[#1a1a1a] p-4 rounded-xl">
                    <li className="flex gap-2"><span>✅</span> <span><strong>10% Commission</strong> (up to 3,000 UGX per order)</span></li>
                    <li className="flex gap-2"><span>✅</span> <span><strong>Earn</strong> on both new & returning users</span></li>
                    <li className="flex gap-2"><span>✅</span> <span><strong>Instant Wallet Credit</strong> on successful delivery</span></li>
                    <li className="flex gap-2 text-xs text-[#6B6B6B] mt-1 items-center"><span>ℹ️</span> <span>Valid on Official Store items only.</span></li>
                  </ul>

                  <Link 
                    href="/invite" 
                    style={{ backgroundColor: '#1A1A1A', color: '#FFFFFF' }} 
                    className="px-8 py-3 rounded-full font-bold shadow-md hover:bg-slate-800 active:scale-95 transition-all w-full sm:w-auto text-center"
                  >
                    Join the Affiliate Program
                  </Link>
                </div>

                <AboutKabaleOnline />

              </div>
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
