import Image from "next/image";
import Link from "next/link";
import { getProducts } from "@/lib/firebase/firestore";
import SearchBar from "@/components/SearchBar"; 
import UrgentStories from "@/components/UrgentStories";
import PersonalizedFeed from "@/components/PersonalizedFeed";
import ProductSection from "@/components/ProductSection";

// 🔥 FORCE DYNAMIC: Ensures random items shuffle on EVERY refresh
export const dynamic = "force-dynamic";

export default async function Home() {
  // 1. Fetch products (Only fetching your 3 main categories)
  const electronics = await getProducts("electronics");
  const agriculture = await getProducts("agriculture");
  const students = await getProducts("student_item");

  const allProducts = [...electronics, ...agriculture, ...students];

  // 2. Real "Just Posted" Sorting
  const sortedByDate = [...allProducts].sort((a: any, b: any) => {
    const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
    const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  const justPostedProducts = sortedByDate.slice(0, 12);

  // 3. Randomizer for Trending
  const getRandom12 = (arr: any[]) => [...arr].sort(() => 0.5 - Math.random()).slice(0, 12);
  const trendingNow = getRandom12(allProducts);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] pb-24 font-sans selection:bg-[#D97706] selection:text-white">

      {/* ========================================== */}
      {/* 1. SEARCH & INTENT CHIPS                   */}
      {/* ========================================== */}
      <section className="bg-white dark:bg-[#111] px-2 sm:px-4 py-6 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-3xl mx-auto">
          <SearchBar />
          <div className="flex gap-2 overflow-x-auto py-4 no-scrollbar items-center justify-start md:justify-center px-1">
            {["🔥 Under 50k", "⚡ Urgent Sales", "📍 Near You", "🆕 Just Posted", "🎓 Campus Deals"].map(tag => (
              <button key={tag} className="px-5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-xs font-bold whitespace-nowrap text-slate-800 dark:text-slate-200 transition-colors shadow-sm">
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* 2. URGENT STORIES                          */}
      {/* ========================================== */}
      <UrgentStories />

      {/* ========================================== */}
      {/* 🧩 MAIN CONTENT AREA                       */}
      {/* ========================================== */}
      {/* Notice the tight px-2 padding on mobile for maximum screen width */}
      <div className="max-w-[1600px] mx-auto mt-4 sm:mt-8 space-y-10 md:space-y-16">

        {/* 3. TRENDING (Random on refresh) */}
        <section className="px-2 sm:px-4">
          <ProductSection 
            title="🔥 Trending Now" 
            products={trendingNow} 
          />
        </section>

        {/* 4. SELLER CTA (Image Reference Style) */}
        <section className="relative py-20 md:py-28 text-center bg-slate-100/50 dark:bg-[#111] border-y border-slate-200 dark:border-slate-800">
          <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 flex flex-col items-center">
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

        {/* 5. JUST POSTED (Real Timestamp Based) */}
        <section className="px-2 sm:px-4">
          <ProductSection 
            title="🆕 Just Posted" 
            products={justPostedProducts} 
          />
        </section>

        {/* 6. PERSONALIZED (Client Side Logic) */}
        <div className="px-2 sm:px-4">
          <PersonalizedFeed allProducts={allProducts} />
        </div>

                {/* 7. CATEGORIES (Only 3) */}
        <section className="py-12 border-t border-slate-200 dark:border-slate-800 px-4">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest text-center mb-8">
              Explore by Category
            </h3>
            
            <div className="flex flex-col gap-3 sm:gap-4">
              {[
                { 
                  name: "Student Market", 
                  link: "student_item",
                  desc: "Hostel items, textbooks, gadgets, and campus essentials",
                  icon: "🎓"
                }, 
                { 
                  name: "Electronics", 
                  link: "electronics",
                  desc: "Smartphones, laptops, TVs, audio, and accessories",
                  icon: "💻"
                }, 
                { 
                  name: "Agriculture", 
                  link: "agriculture",
                  desc: "Fresh produce, farm tools, livestock, and fertilizers",
                  icon: "🌱"
                }
              ].map((cat) => (
                <Link 
                  key={cat.name} 
                  href={`/category/${cat.link}`} 
                  className="group flex items-center justify-between p-4 sm:p-5 bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-[#D97706] dark:hover:border-[#D97706] hover:shadow-md transition-all duration-200 w-full"
                >
                  <div className="flex items-center gap-4 sm:gap-5 overflow-hidden">
                    {/* Icon Bubble */}
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform duration-300 border border-slate-100 dark:border-slate-800">
                      {cat.icon}
                    </div>
                    
                    {/* Text Details */}
                    <div className="flex flex-col text-left overflow-hidden">
                      <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white group-hover:text-[#D97706] transition-colors truncate">
                        {cat.name}
                      </span>
                      <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate pr-2">
                        {cat.desc}
                      </span>
                    </div>
                  </div>
                  
                  {/* Right Arrow / Action */}
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
