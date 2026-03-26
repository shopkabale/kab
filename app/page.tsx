import Image from "next/image";
import Link from "next/link";
import { getProducts } from "@/lib/firebase/firestore";
import SearchBar from "@/components/SearchBar"; 
import UrgentStories from "@/components/UrgentStories";
import PersonalizedFeed from "@/components/PersonalizedFeed";
import ProductSection from "@/components/ProductSection";
import LiveFeedSidebar from "@/components/LiveFeedSidebar";

// 🔥 FORCE DYNAMIC: Ensures random items shuffle on EVERY refresh
export const dynamic = "force-dynamic";

export default async function Home() {
  // 1. Fetch products (Only fetching your 3 main categories)
  const electronics = await getProducts("electronics");
  const agriculture = await getProducts("agriculture");
  const students = await getProducts("student_item");

  const allProducts = [...electronics, ...agriculture, ...students];

  // 2. Real "Just Posted" Sorting
  // Added (a: any, b: any) to stop TypeScript from complaining about .seconds on numbers
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
      {/* 1. URGENT STORIES                          */}
      {/* ========================================== */}
      <div className="bg-white dark:bg-[#111] pt-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="px-4 mb-2 flex items-center gap-2 max-w-[1600px] mx-auto">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          <h2 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">Hot Deals Near You</h2>
        </div>
        <div className="max-w-[1600px] mx-auto">
          <UrgentStories />
        </div>
      </div>

      {/* ========================================== */}
      {/* 2. SEARCH & INTENT CHIPS                   */}
      {/* ========================================== */}
      <section className="bg-white dark:bg-[#111] px-4 py-6 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-3xl mx-auto">
          <SearchBar />
          <div className="flex gap-2 overflow-x-auto py-4 no-scrollbar items-center justify-start md:justify-center">
            {["🔥 Under 50k", "⚡ Urgent Sales", "📍 Near You", "🆕 Just Posted", "🎓 Campus Deals"].map(tag => (
              <button key={tag} className="px-5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-xs font-bold whitespace-nowrap text-slate-800 dark:text-slate-200 transition-colors shadow-sm">
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* 🧩 THE DASHBOARD GRID                      */}
      {/* ========================================== */}
      <div className="max-w-[1600px] mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

        {/* ------------------------------------------ */}
        {/* LEFT SIDEBAR: LIVE ACTIVITY FEED           */}
        {/* ------------------------------------------ */}
        <aside className="lg:col-span-3 hidden lg:block">
          {/* We pass the 10 newest items from SSR so there is ZERO loading layout shift. SWR takes over from here. */}
          <LiveFeedSidebar initialProducts={justPostedProducts.slice(0, 10)} />
        </aside>

        {/* Mobile Live Feed Header */}
        <div className="block lg:hidden lg:col-span-12">
           <div className="flex items-center justify-between mb-2 px-2">
             <h2 className="text-lg font-black uppercase text-slate-900 dark:text-white">Happening Now 🔥</h2>
             <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded-md flex items-center gap-1">
               <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
               LIVE
             </span>
           </div>
        </div>

        {/* ------------------------------------------ */}
        {/* MAIN CONTENT AREA                          */}
        {/* ------------------------------------------ */}
        <main className="lg:col-span-9 space-y-10 md:space-y-14">

          {/* 3. TRENDING (Random on refresh) */}
          <section>
            <ProductSection 
              title="🔥 Trending Now" 
              products={trendingNow} 
            />
          </section>

          {/* 4. SELLER CTA (Clean, No background) */}
          <section className="py-12 md:py-16 text-center border-y border-slate-200 dark:border-slate-800">
            <div className="max-w-xl mx-auto flex flex-col items-center">
              <h2 className="text-3xl md:text-5xl font-black mb-4 uppercase tracking-tight leading-none text-slate-900 dark:text-white">
                Sell Your Item in <br/> 60 Seconds 🚀
              </h2>
              <p className="text-base md:text-lg font-medium mb-8 text-slate-600 dark:text-slate-400">
                No account needed. Just send a picture to our WhatsApp bot and it goes live instantly.
              </p>
              
              <a
                href="https://wa.me/256740373021?text=Hi%2C%20I%20want%20to%20sell%20an%20item"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#D97706] text-white px-8 py-4 rounded-full font-black text-sm md:text-base flex items-center gap-3 hover:scale-105 active:scale-95 transition-transform shadow-lg hover:shadow-xl"
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                </svg>
                Start Selling Now
              </a>
              <p className="mt-6 text-xs text-slate-500 font-bold tracking-wide">Need seller support? Email shopkabale@gmail.com</p>
            </div>
          </section>

          {/* 5. JUST POSTED (Real Timestamp Based) */}
          <section>
            <ProductSection 
              title="🆕 Just Posted" 
              products={justPostedProducts} 
            />
          </section>

          {/* 6. PERSONALIZED (Client Side Logic) */}
          <PersonalizedFeed allProducts={allProducts} />

          {/* 7. CATEGORIES (Only 3) */}
          <section className="py-8 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest text-center mb-6">Explore Directory</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { name: "Student Market", link: "student_item" }, 
                { name: "Electronics", link: "electronics" }, 
                { name: "Agriculture", link: "agriculture" }
              ].map((cat) => (
                <Link key={cat.name} href={`/category/${cat.link}`} className="px-5 py-2.5 bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:border-[#D97706] hover:text-[#D97706] transition-colors shadow-sm">
                  {cat.name}
                </Link>
              ))}
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}
