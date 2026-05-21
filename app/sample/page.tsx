// 🔥 CRITICAL: Tells Next.js to refresh this page every 60 seconds to pull new deals!
export const revalidate = 7200; 

import Link from "next/link";
import { getCachedHomepageData } from "@/lib/firebase/fetchers";

// Firebase imports for the active deals query
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

// VIP UI COMPONENTS
import WhatsAppPopup from "@/components/WhatsAppPopup";
import AboutKabaleOnline from "@/components/AboutKabaleOnline";
import ThemedCategoryGrid from "@/components/ThemedCategoryGrid";
import { ThemeProvider } from "@/components/ThemeProvider";
import LeftSidebar from "@/components/LeftSidebar"; 
import ContinueBrowsing from "@/components/ContinueBrowsing";

// 🔥 NEW HIGH-CONVERTING FUNNEL COMPONENTS
import HeroBanner from "@/components/hero";
import TrustBadges from "@/components/trust";
import PromoBanner from "@/components/promo";
import CampaignScroller from "@/components/CampaignScroller";

// 🔥 THE SMART TITLE DICTIONARY
const campaignDisplayNames: Record<string, string> = {
  "flash-sales": "Flash Sales",
  "weekend-deals": "Weekend Deals",
  "clearance": "Clearance Sale",
  "student-deals": "Student Deals",
  "mega-sale": "Mega Sale"
};

export default async function Home() {
  // We still fetch data for ContinueBrowsing fallbacks, but the page is much lighter now!
  const data = await getCachedHomepageData();
  const trendingProducts = data.trendingProducts || [];

  // ==========================================
  // 🔥 FETCH AND GROUP DYNAMIC CAMPAIGNS (TODAY'S DEALS)
  // ==========================================
  const campaigns: Record<string, { products: any[], earliestEndDate: string }> = {};

  try {
    const dealsQ = query(
      collection(db, "products"), 
      where("isSale", "==", true), 
      limit(24) // Limited to ~24 items to create urgency without overwhelming
    );
    const dealsSnap = await getDocs(dealsQ);

    dealsSnap.docs.forEach(doc => {
      const dealData = doc.data();

      // Ensure the deal hasn't expired
      if (new Date(dealData.saleEndDate).getTime() > Date.now()) {
        const cType = dealData.campaignType || "flash-sales";

        if (!campaigns[cType]) {
          campaigns[cType] = { products: [], earliestEndDate: dealData.saleEndDate };
        }

        campaigns[cType].products.push({ id: doc.id, ...dealData });

        if (new Date(dealData.saleEndDate) < new Date(campaigns[cType].earliestEndDate)) {
          campaigns[cType].earliestEndDate = dealData.saleEndDate;
        }
      }
    });
  } catch (error) {
    console.error("Failed to fetch deals for homepage:", error);
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-transparent pb-10 pt-2 sm:pt-4 font-sans selection:bg-[#FF6A00] selection:text-white">
        <WhatsAppPopup />
        <div className="w-full max-w-[1400px] mx-auto px-0 sm:px-4">

          <div className="flex flex-col md:flex-row items-start gap-4 w-full">

            {/* THE INVISIBLE SCROLLBAR SIDEBAR */}
            <div className="hidden md:flex flex-col gap-4 w-[220px] lg:w-[240px] shrink-0 sticky top-[85px] h-[calc(100vh-85px)] overflow-y-auto overscroll-contain z-10 pb-6 pr-1 md:pr-2 
              [&::-webkit-scrollbar]:w-1.5 
              [&::-webkit-scrollbar-track]:bg-transparent 
              [&::-webkit-scrollbar-thumb]:bg-slate-200 
              dark:[&::-webkit-scrollbar-thumb]:bg-slate-800 
              [&::-webkit-scrollbar-thumb]:rounded-full 
              hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 
              dark:hover:[&::-webkit-scrollbar-thumb]:bg-slate-700"
            >
              <LeftSidebar />
            </div>

            {/* MAIN FEED: The New Optimized Layout */}
            <div className="flex-grow min-w-0 flex flex-col w-full">

              {/* 1. HERO BANNER: Immediately sets the tone (Electronics focus) */}
              <div className="w-full z-0 mb-4 sm:mb-6">
                <HeroBanner />
              </div>

              {/* 2. TRUST BADGES: Lowers customer hesitation */}
              <TrustBadges />

              {/* 3. CATEGORIES GRID: The Walmart-style seamless navigation */}
              <div className="w-full bg-white dark:bg-[#151515] rounded-xl border border-slate-200 dark:border-slate-800 p-4 pt-5 sm:pt-6 mb-6 sm:mb-8 shadow-sm">
                <ThemedCategoryGrid />
              </div>

              {/* 4. TODAY'S DEALS: Creates urgency (Firebase driven) */}
              {Object.entries(campaigns).map(([slug, campaignData]) => {
                const displayTitle = campaignDisplayNames[slug] || slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                return (
                  <div className="w-full mb-6 sm:mb-8" key={slug}>
                    <CampaignScroller 
                      title={displayTitle} 
                      endTime={campaignData.earliestEndDate} 
                      products={campaignData.products} 
                      campaignSlug={slug} 
                    />
                  </div>
                );
              })}

              {/* 5. PROMOTION BANNER: Visual break and targeted campaign */}
              <PromoBanner />

              {/* OPTIONAL UX WIN: Let them resume where they left off */}
              <div className="w-full flex flex-col gap-4 sm:gap-6">
                <ContinueBrowsing 
                  title="Continue Browsing"
                  subtitle="Pick up exactly where you left off"
                  fallbackProducts={trendingProducts.slice(0, 8)} 
                />

                {/* 6. WHY SHOP WITH US: Final trust reinforcement at the bottom */}
                <AboutKabaleOnline />
              </div>

            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
