import { Suspense } from "react"; // ADDED SUSPENSE IMPORT
import Link from "next/link";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config"; 
import SearchBar from "@/components/SearchBar"; 
import ProductFeed from "@/components/ProductFeed";

export const revalidate = 3600;

export const metadata = {
  title: "All Products | Kabale Online",
  description: "Browse all items available for sale in Kabale town.",
};

const PAGE_SIZE = 40;

export default async function AllProductsPage() {
  // ==========================================
  // INITIAL SERVER FETCH: Fastest load, best SEO
  // ==========================================
  const productsRef = collection(db, "products");
  const q = query(productsRef, orderBy("createdAt", "desc"), limit(PAGE_SIZE));

  const snapshot = await getDocs(q);

  // Clean the data so it can be passed safely to the Client Component
  const initialProducts = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      // If you use Firestore Timestamps, convert them to numbers/strings so React doesn't crash
      createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : data.createdAt
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

        </div>
      </section>

      <div className="w-full mx-auto mt-4 sm:mt-8 space-y-6">

        {/* ========================================== */}
        {/* INTERACTIVE PRODUCT FEED (Client Component)*/}
        {/* ========================================== */}
        {/* WRAPPED IN SUSPENSE TO FIX VERCEL BUILD ERROR */}
        <Suspense fallback={
          <div className="w-full max-w-[1200px] mx-auto px-4">
            <div className="h-[400px] w-full bg-slate-200 dark:bg-slate-800/50 animate-pulse rounded-xl mt-4"></div>
          </div>
        }>
          <ProductFeed initialProducts={initialProducts} />
        </Suspense>

        {/* ========================================== */}
        {/* CATEGORIES LIST ROW                        */}
        {/* ========================================== */}
        <section className="py-12 border-t border-slate-200 dark:border-slate-800 px-4">
          <div className="max-w-[1200px] mx-auto">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest text-center mb-8">
              Explore by Category
            </h3>

            <div className="flex flex-col gap-3 sm:gap-4 max-w-3xl mx-auto">
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
