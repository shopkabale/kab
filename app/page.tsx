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
      {/* 1. URGENT STORIES                          */}
      {/* ========================================== */}
      <div className="bg-white dark:bg-[#111] pt-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="px-4 mb-2 flex items-center gap-2 max-w-[1600px] mx-auto">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          
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
      {/* 🧩 MAIN CONTENT AREA                       */}
      {/* ========================================== */}
      <div className="max-w-[1600px] mx-auto mt-8 space-y-12 md:space-y-16">

        {/* 3. TRENDING (Random on refresh) */}
        <section className="px-4">
          <ProductSection 
            title="🔥 Trending Now" 
            products={trendingNow} 
          />
        </section>

        {/* 4. SELLER CTA (Image Reference Style) */}
        <section className="relative py-20 md:py-28 text-center bg-slate-100/50 dark:bg-[#111] border-y border-slate-200 dark:border-slate-800">
          {/* Optional: If you want the exact blurry background from the image, uncomment the div below and add your image URL */}
          {/* <div className="absolute inset-0 bg-[url('/your-background-image.jpg')] bg-cover bg-center opacity-20"></div> */}
          
          <div className="relative z-10 max-w-3xl mx-auto px-6 flex flex-col items-center">
            <h2 className="text-5xl md:text-7xl font-semibold mb-6 text-slate-900 dark:text-white tracking-tight">
              Sell on Kabale
            </h2>
            <p className="text-base md:text-lg text-slate-800 dark:text-slate-300 mb-10 leading-relaxed font-medium max-w-2xl">
              We help you sell your items directly to buyers across the Kabale and Kigezi regions. Perfect for clearing out extra items, running a shop, or casual student sales. Both retail and bulk supplies supported. It takes 60 seconds to post your items via our WhatsApp bot.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
              <a
                href="https://wa.me/256740373021?text=Hi%2C%20I%20want%20to%20sell%20an%20item"
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
        <section className="px-4">
          <ProductSection 
            title="🆕 Just Posted" 
            products={justPostedProducts} 
          />
        </section>

        {/* 6. PERSONALIZED (Client Side Logic) */}
        <div className="px-4">
          <PersonalizedFeed allProducts={allProducts} />
        </div>

        {/* 7. CATEGORIES (Only 3) */}
        <section className="py-12 border-t border-slate-200 dark:border-slate-800 px-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest text-center mb-6">Explore Directory</h3>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { name: "Student Market", link: "student_item" }, 
              { name: "Electronics", link: "electronics" }, 
              { name: "Agriculture", link: "agriculture" }
            ].map((cat) => (
              <Link key={cat.name} href={`/category/${cat.link}`} className="px-6 py-3 bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:border-[#D97706] hover:text-[#D97706] transition-colors shadow-sm">
                {cat.name}
              </Link>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
