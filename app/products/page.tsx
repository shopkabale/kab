import Link from "next/link";
import { getProducts } from "@/lib/firebase/firestore";
import ProductSection from "@/components/ProductSection";
import SearchBar from "@/components/SearchBar"; 
import { optimizeImage } from "@/lib/utils"; 

// 🔥 1. REMOVE force-dynamic
// 🔥 2. ADD revalidate to cache this page for 1 hour (3600 seconds)
export const revalidate = 3600;

export const metadata = {
  title: "All Products | Kabale Online",
  description: "Browse all items available for sale in Kabale town.",
};

// ==========================================
// THE DAILY SHUFFLE ALGORITHM
// ==========================================
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

export default async function AllProductsPage() {
  // 🔥 3. PASS A LIMIT TO YOUR DATABASE QUERY
  // undefined means "no specific category", 100 is the limit.
  // This fetches the 100 newest items and costs a maximum of 100 reads per hour.
  const rawProducts = await getProducts(undefined, 100);

  // 4. SHUFFLE THEM (Stable Daily Randomization on the 100 items)
  rawProducts.sort((a, b) => getDailyRandomScore(a.id) - getDailyRandomScore(b.id));

  // 5. OPTIMIZE ALL IMAGES
  const allProducts = rawProducts.map((product) => {
    if (!product.images || product.images.length === 0) return product;

    return {
      ...product,
      images: product.images.map((img: string) => optimizeImage(img))
    };
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] font-sans selection:bg-[#D97706] selection:text-white">

      {/* ========================================== */}
      {/* PROFESSIONAL HERO & SEARCH SECTION         */}
      {/* ========================================== */}
      <section className="bg-white dark:bg-[#111] py-12 md:py-16 border-b border-slate-200 dark:border-slate-800 shadow-sm px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4 text-slate-900 dark:text-white tracking-tight uppercase">
            All Marketplace Items
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base font-medium max-w-xl mx-auto mb-8">
            Discover everything our local Kabale vendors have to offer. Fast delivery, pay strictly on arrival.
          </p>

          {/* Integrated Search Bar */}
          <div className="max-w-xl mx-auto">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* 🧩 MAIN CONTENT AREA                       */}
      {/* ========================================== */}
      {/* Updated to w-full to match the edge-to-edge design we made earlier */}
      <div className="w-full mx-auto mt-4 sm:mt-8 space-y-6">

        {/* THE HOMEPAGE PRODUCT SECTION */}
        {/* Updated px-2 to px-1 for the flush mobile design */}
        <div className="px-1 sm:px-4 pb-12">
          <ProductSection 
            title={`Explore Directory (${allProducts.length} Latest Finds)`} 
            products={allProducts} 
          />
        </div>

        {/* ========================================== */}
        {/* CATEGORIES LIST ROW                        */}
        {/* ========================================== */}
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
