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

// --- ICON DATA FOR JUMIA-STYLE TOP BAR ---
const serviceShortcuts = [
  { name: "Services", icon: "🛠️", link: "/category/services", color: "bg-blue-100" },
  { name: "Electronics", icon: "💻", link: "/category/electronics", color: "bg-purple-100" },
  { name: "Fashion", icon: "👕", link: "/category/fashion", color: "bg-pink-100" },
  { name: "Students", icon: "🎓", link: "/category/student_item", color: "bg-orange-100" },
  { name: "Agriculture", icon: "🌽", link: "/category/agriculture", color: "bg-green-100" },
  { name: "Official", icon: "🏢", link: "/officialStore", color: "bg-amber-100" },
];

export default async function Home() {
  const data = await getCachedHomepageData();

  // Filter Services specifically (where booking happens)
  const serviceProviders = data.basePool.filter(p => 
    p.category === "services" || (p.tags && p.tags.includes("service"))
  ).slice(0, 10);

  const studentDeals = data.studentProducts;
  const officialStores = data.officialProducts;
  const agriMarket = data.agriProducts;

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] pb-10 pt-2 font-sans selection:bg-[#D97706] selection:text-white">
        <WhatsAppPopup />

        <div className="w-full max-w-[1400px] mx-auto px-0 sm:px-4">
          <div className="flex flex-col md:flex-row gap-4 w-full">

            {/* LEFT SIDEBAR (Hidden on Mobile) */}
            <div className="hidden md:flex flex-col gap-4 w-[220px] lg:w-[240px] shrink-0 sticky top-[110px] h-max z-10">
              <LeftSidebar />
            </div>

            {/* MAIN CONTENT FEED */}
            <div className="flex-grow min-w-0 flex flex-col w-full">
              
              {/* --- 1. JUMIA-STYLE TOP SERVICES BAR --- */}
              <div className="flex overflow-x-auto gap-4 py-4 px-4 bg-white dark:bg-[#121212] mb-4 sm:rounded-2xl no-scrollbar border-b sm:border border-slate-100 dark:border-slate-800">
                {serviceShortcuts.map((s) => (
                  <Link key={s.name} href={s.link} className="flex flex-col items-center gap-2 shrink-0 group">
                    <div className={`${s.color} w-14 h-14 rounded-full flex items-center justify-center text-2xl group-active:scale-90 transition-transform shadow-sm`}>
                      {s.icon}
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tighter">
                      {s.name}
                    </span>
                  </Link>
                ))}
              </div>

              {/* --- 2. HERO & STORY SECTION --- */}
              <HeroCarousel products={data.heroProducts} />
              <UrgentStories />

              <div className="flex flex-col gap-4 sm:gap-8 mt-4">
                
                {/* --- 3. SERVICES PORTAL (The Booking Engine) --- */}
                {serviceProviders.length > 0 && (
                  <div className="bg-[#1e293b] text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
                    {/* Decorative Background Element */}
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/20 blur-3xl rounded-full"></div>
                    
                    <div className="flex justify-between items-center mb-4 relative z-10">
                      <div>
                        <h2 className="text-xl font-black italic uppercase tracking-tighter">Hire Local Pros</h2>
                        <p className="text-blue-300 text-xs font-medium uppercase tracking-widest">Verified Kabale Service Providers</p>
                      </div>
                      <Link href="/category/services" className="bg-white text-[#1e293b] px-4 py-2 rounded-full text-xs font-black uppercase tracking-tight">View All</Link>
                    </div>

                    <HorizontalScroller 
                      title="" 
                      subtitle=""
                      products={serviceProviders} 
                    />
                    
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-blue-200/60 uppercase tracking-widest border-t border-white/10 pt-4">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      Secure Booking Deposits Enabled
                    </div>
                  </div>
                )}

                {/* --- 4. STUDENT & CAMPUS SECTION --- */}
                {studentDeals.length > 0 && (
                  <ProductSection 
                    title="🎓 Campus Marketplace" 
                    subtitle="Best prices for students at Kabale Uni & Bishop Barham"
                    products={studentDeals.slice(0, 8)} 
                  />
                )}

                {/* --- 5. TRUST BANNER --- */}
                <ShopWithConfidenceBanner />

                {/* --- 6. OFFICIAL STORES --- */}
                {officialStores.length > 0 && (
                  <HorizontalScroller 
                    title="🏢 Official Brand Stores" 
                    subtitle="Direct from authorized distributors"
                    products={officialStores} 
                    viewAllLink="/officialStore" 
                  />
                )}

                {/* --- 7. AGRICULTURE (KIGEZI BASKET) --- */}
                {agriMarket.length > 0 && (
                  <div className="bg-green-50 dark:bg-green-950/10 p-4 sm:p-6 rounded-3xl border border-green-100 dark:border-green-900/30">
                    <HorizontalScroller 
                      title="🌽 Kigezi Fresh Market" 
                      subtitle="Direct from the garden to your doorstep"
                      products={agriMarket} 
                      viewAllLink="/category/agriculture" 
                    />
                  </div>
                )}

                <SellCtaBanner />

                <AboutKabaleOnline />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
