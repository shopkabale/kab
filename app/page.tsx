import Image from "next/image";
import Link from "next/link";
import { getProducts } from "@/lib/firebase/firestore";
import SearchBar from "@/components/SearchBar"; 
import UrgentStories from "@/components/UrgentStories";
import SponsoredSection from "@/components/SponsoredSection"; // ADDED IMPORT
import PersonalizedFeed from "@/components/PersonalizedFeed";
import ProductSection from "@/components/ProductSection";
import HorizontalScroller from "@/components/HorizontalScroller";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

// RESTORED PRODUCTION CACHE (1 Hour)
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

  const electronics = await getProducts("electronics", 30);
  const agriculture = await getProducts("agriculture", 30);
  const students = await getProducts("student_item", 30);
  const allProducts = [...electronics, ...agriculture, ...students];

  const sortedByDate = [...allProducts].sort((a: any, b: any) => {
    const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
    const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  const justPostedProducts = sortedByDate.slice(0, 12);

  const premiumIds = new Set([...featuredProducts, ...boostedProducts].map(p => p.id));
  const trendingNow = [...allProducts]
    .filter(p => !premiumIds.has(p.id)) 
    .sort((a, b) => getDailyRandomScore(a.id) - getDailyRandomScore(b.id))
    .slice(0, 12);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] pb-12 font-sans selection:bg-[#D97706] selection:text-white overflow-x-hidden">

      {/* SEARCH SECTION - Applied layout standard */}
      <section className="py-6 bg-white dark:bg-[#111] border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-4">
          <SearchBar />
          <div className="flex gap-3 overflow-x-auto py-4 no-scrollbar items-center justify-start md:justify-center px-1 snap-x">
            {["Under 50k", "Urgent sales", "Near you", "Just posted", "Campus deals"].map(tag => (
              <button key={tag} className="px-5 py-2 snap-start bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-xs font-bold whitespace-nowrap text-slate-800 dark:text-slate-200 transition-colors shadow-sm">
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      <UrgentStories />

      <div className="w-full mt-4 sm:mt-8 space-y-10 md:space-y-16">

        {/* SPONSORED SECTION PLACED HERE */}
        <section className="w-full">
          <SponsoredSection />
        </section>

        {featuredProducts.length > 0 && (
          <section className="w-full">
            <HorizontalScroller 
              title="Featured items" 
              products={featuredProducts} 
            />
          </section>
        )}

        {boostedProducts.length > 0 && (
          <section className="w-full">
            <HorizontalScroller 
              title="Boosted deals" 
              products={boostedProducts} 
            />
          </section>
        )}

        {/* TRENDING NOW - Applied layout standard */}
        {trendingNow.length > 0 && (
          <section>
            <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-4">
              <ProductSection 
                title="Trending now" 
                products={trendingNow} 
              />
            </div>
          </section>
        )}

        {/* CTA SECTION - Retains custom text styling but fits the flow */}
        <section className="relative py-20 md:py-28 text-center bg-slate-100/50 dark:bg-[#111] border-y border-slate-200 dark:border-slate-800">
          <div className="relative z-10 w-full max-w-[1200px] mx-auto px-3 sm:px-4 flex flex-col items-center">
            <h2 className="text-5xl md:text-7xl font-semibold mb-6 text-slate-900 dark:text-white tracking-tight">
              Sell on Kabale
            </h2>
            <p className="text-base md:text-lg text-slate-800 dark:text-slate-300 mb-10 leading-relaxed font-medium max-w-2xl">
              Sell directly to buyers across Kabale & Kigezi. Perfect for shops, students, or clearing extra items. Post in just 60 seconds via our WhatsApp bot.
              <br />
              <span className="text-green-600 dark:text-green-400 font-semibold">
                Just send "Hi" to our WhatsApp bot to get started.
              </span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
              <a
                href="https://wa.me/256740373021?text=Hi"
                target="_blank"
                rel="noopener noreferrer"
                className="px-10 py-3 border-2 border-slate-900 dark:border-white text-slate-900 dark:text-white font-medium text-base hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors rounded-sm min-w-[180px]"
              >
                Start selling
              </a>
              <a
                href="mailto:shopkabale@gmail.com"
                className="px-10 py-3 border-2 border-slate-900 dark:border-white text-slate-900 dark:text-white font-medium text-base hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors rounded-sm min-w-[180px]"
              >
                Get support
              </a>
            </div>
          </div>
        </section>

        {/* JUST POSTED - Applied layout standard */}
        <section>
          <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-4">
            <ProductSection 
              title="Just posted" 
              products={justPostedProducts} 
            />
          </div>
        </section>

        <section className="w-full">
          <PersonalizedFeed allProducts={allProducts} />
        </section>

        {/* CATEGORIES - Applied layout standard */}
        <section className="py-12 border-t border-slate-200 dark:border-slate-800">
          <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest text-center mb-8">
              Explore by category
            </h3>

            <div className="flex flex-col gap-3 sm:gap-4 max-w-3xl mx-auto">
              {[
                { name: "Student market", link: "student_item", desc: "Hostel items, textbooks, gadgets, and campus essentials", icon: "🎓" }, 
                { name: "Electronics", link: "electronics", desc: "Smartphones, laptops, TVs, audio, and accessories", icon: "💻" }, 
                { name: "Agriculture", link: "agriculture", desc: "Fresh produce, farm tools, livestock, and fertilizers", icon: "🌱" }
              ].map((cat) => (
                <Link 
                  key={cat.name} 
                  href={`/category/${cat.link}`} 
                  className="group flex items-center justify-between p-4 sm:p-5 bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-sm hover:border-[#D97706] dark:hover:border-[#D97706] hover:shadow-md transition-all duration-200 w-full"
                >
                  <div className="flex items-center gap-4 sm:gap-5 overflow-hidden">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform duration-300 border border-slate-100 dark:border-slate-800">
                      {cat.icon}
                    </div>
                    <div className="flex flex-col text-left overflow-hidden">
                      <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white group-hover:text-[#D97706] transition-colors truncate">
                        {cat.name}
                      </span>
                      <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate pr-2">
                        {cat.desc}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300 dark:text-slate-600 group-hover:text-[#D97706] transition-colors pl-2 shrink-0">
                    <span className="text-xs font-bold uppercase tracking-widest hidden sm:block">View</span>
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
