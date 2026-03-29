import Image from "next/image";
import Link from "next/link";
import { getProducts } from "@/lib/firebase/firestore";
import SearchBar from "@/components/SearchBar"; 
import UrgentStories from "@/components/UrgentStories";
import PersonalizedFeed from "@/components/PersonalizedFeed";
import ProductSection from "@/components/ProductSection";
import HorizontalScroller from "@/components/HorizontalScroller";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

// RESTORED PRODUCTION CACHE (1 Hour)
// The entire page, including Boosts and Features, is now cached.
export const revalidate = 3600; 

function getDailyRandomScore(id: string) {
  const today = new Date().toISOString().split('T')[0];
  const seedString = id + today; 
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash << 5) - hash + seedString.charCodeAt(i);
    hash |= 0; 
  }
  return hash;
}

export default async function Home() {
  const now = Date.now();

  // 1. FETCH PREMIUM ITEMS (Cached for 1 hour by Next.js)
  const featuredQ = query(collection(db, "products"), where("isFeatured", "==", true));
  const featuredSnap = await getDocs(featuredQ);
  const featuredProducts = featuredSnap.docs
    .map(d => ({ id: d.id, ...d.data() } as any))
    .filter(p => p.featureExpiresAt && p.featureExpiresAt > now)
    .sort((a, b) => b.featuredAt - a.featuredAt);

  const boostedQ = query(collection(db, "products"), where("isBoosted", "==", true));
  const boostedSnap = await getDocs(boostedQ);
  const boostedProducts = boostedSnap.docs
    .map(d => ({ id: d.id, ...d.data() } as any))
    .filter(p => p.boostExpiresAt && p.boostExpiresAt > now)
    .sort((a, b) => b.boostedAt - a.boostedAt);


  // 2. FETCH REGULAR FEED ITEMS
  const electronics = await getProducts("electronics", 30);
  const agriculture = await getProducts("agriculture", 30);
  const students = await getProducts("student_item", 30);
  const allProducts = [...electronics, ...agriculture, ...students];

  // 3. SORTING LOGIC
  const sortedByDate = [...allProducts].sort((a: any, b: any) => {
    const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
    const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  const justPostedProducts = sortedByDate.slice(0, 12);

  // Stable "Trending" Shuffle (Filters out premium items to avoid duplicates)
  const premiumIds = new Set([...featuredProducts, ...boostedProducts].map(p => p.id));
  const trendingNow = [...allProducts]
    .filter(p => !premiumIds.has(p.id)) 
    .sort((a, b) => getDailyRandomScore(a.id) - getDailyRandomScore(b.id))
    .slice(0, 12);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] pb-24 font-sans selection:bg-[#D97706] selection:text-white overflow-x-hidden">

      {/* 1. SEARCH & INTENT CHIPS */}
      <section className="px-3 sm:px-4 py-6">
        <div className="max-w-3xl mx-auto">
          <SearchBar />
          <div className="flex gap-3 overflow-x-auto py-4 no-scrollbar items-center justify-start md:justify-center px-1 snap-x">
            {["Under 50k", "Urgent sales", "Near you", "Just posted", "Campus deals"].map(tag => (
              <button key={tag} className="px-5 py-2 snap-start bg-slate-200/50 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-xs font-bold whitespace-nowrap text-slate-700 dark:text-slate-300 transition-colors">
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. URGENT STORIES */}
      <UrgentStories />

      {/* 🧩 MAIN CONTENT AREA */}
      <div className="w-full mt-4 sm:mt-8 space-y-10 md:space-y-16">

        {/* ⭐ CONDITIONALLY RENDERED: FEATURED ITEMS (Now HorizontalScroller) */}
        {featuredProducts.length > 0 && (
          <section className="w-full">
            <HorizontalScroller 
              title="Featured items" 
              products={featuredProducts} 
            />
          </section>
        )}

        {/* 🚀 CONDITIONALLY RENDERED: BOOSTED LISTINGS (Now HorizontalScroller) */}
        {boostedProducts.length > 0 && (
          <section className="w-full">
            <HorizontalScroller 
              title="Boosted deals" 
              products={boostedProducts} 
            />
          </section>
        )}

        {/* 3. TRENDING */}
        {trendingNow.length > 0 && (
          <section className="px-4">
            <ProductSection 
              title="Trending now" 
              products={trendingNow} 
            />
          </section>
        )}

        {/* 4. SELLER CTA */}
        <section className="relative py-16 md:py-24 text-center">
          <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 flex flex-col items-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-4 text-slate-900 dark:text-white tracking-tight">
              Sell on Kabale
            </h2>
            <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed font-medium max-w-2xl">
              Sell directly to buyers across Kabale & Kigezi. Perfect for shops, students, or clearing extra items.
              <br />
              <span className="text-slate-900 dark:text-white font-bold mt-2 block">
                Post in just 60 seconds.
              </span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
              <a
                href="https://wa.me/256740373021?text=Hi"
                target="_blank"
                rel="noopener noreferrer"
                className="px-10 py-3 bg-[#D97706] text-white font-bold text-base hover:bg-amber-600 transition-colors rounded-xl shadow-sm min-w-[180px]"
              >
                Start selling
              </a>
            </div>
          </div>
        </section>

        {/* 5. JUST POSTED */}
        <section className="px-4">
          <ProductSection 
            title="Just posted" 
            products={justPostedProducts} 
          />
        </section>

        {/* 6. PERSONALIZED (Already using HorizontalScroller from previous step) */}
        <section className="w-full">
          <PersonalizedFeed allProducts={allProducts} />
        </section>

        {/* 7. CATEGORIES */}
        <section className="py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest text-center mb-6">
              Explore by category
            </h3>

            <div className="flex flex-col gap-2">
              {[
                { name: "Student market", link: "student_item", desc: "Hostel items, textbooks, gadgets", icon: "🎓" }, 
                { name: "Electronics", link: "electronics", desc: "Smartphones, laptops, TVs", icon: "💻" }, 
                { name: "Agriculture", link: "agriculture", desc: "Fresh produce, farm tools, livestock", icon: "🌱" }
              ].map((cat) => (
                <Link 
                  key={cat.name} 
                  href={`/category/${cat.link}`} 
                  className="group flex items-center justify-between py-4 w-full hover:px-2 transition-all duration-300"
                >
                  <div className="flex items-center gap-5 overflow-hidden">
                    <div className="w-12 h-12 bg-slate-200/50 dark:bg-slate-800/50 rounded-full flex items-center justify-center text-xl shrink-0 group-hover:bg-amber-100 group-hover:text-amber-700 transition-colors">
                      {cat.icon}
                    </div>
                    <div className="flex flex-col text-left overflow-hidden">
                      <span className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#D97706] transition-colors truncate">
                        {cat.name}
                      </span>
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate pr-2">
                        {cat.desc}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center text-slate-300 dark:text-slate-600 group-hover:text-[#D97706] transition-colors pl-2 shrink-0">
                    <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
