import SearchBar from "@/components/SearchBar"; 
import UrgentStories from "@/components/UrgentStories";
import ProductSection from "@/components/ProductSection";
import HorizontalScroller from "@/components/HorizontalScroller";
import MiddleNav from "@/components/MiddleNav"; 
import Link from "next/link";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export const dynamic = "force-dynamic";

export default async function Home() {
  const now = Date.now();

  // 1. Fetch Official Stores
  const officialQ = query(collection(db, "products"), where("isAdminUpload", "==", true), limit(12));
  const officialSnap = await getDocs(officialQ);
  const officialProducts = officialSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

  // 2. Fetch Approved Quality
  const approvedQ = query(collection(db, "products"), where("isApprovedQuality", "==", true), limit(12));
  const approvedSnap = await getDocs(approvedQ);
  const approvedProducts = approvedSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

  // 3. Fetch Boosted
  const boostedQ = query(collection(db, "products"), where("isBoosted", "==", true), limit(6));
  const boostedSnap = await getDocs(boostedQ);
  const boostedProducts = boostedSnap.docs
    .map(d => ({ id: d.id, ...d.data() } as any))
    .filter(p => p.boostExpiresAt && p.boostExpiresAt > now)
    .sort((a, b) => b.boostedAt - a.boostedAt);

  // 4. Fetch Featured
  const featuredQ = query(collection(db, "products"), where("isFeatured", "==", true), limit(6));
  const featuredSnap = await getDocs(featuredQ);
  const featuredProducts = featuredSnap.docs
    .map(d => ({ id: d.id, ...d.data() } as any))
    .filter(p => p.featureExpiresAt && p.featureExpiresAt > now)
    .sort((a, b) => b.featuredAt - a.featuredAt);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] pb-12 font-sans selection:bg-[#D97706] selection:text-white overflow-x-hidden">

      {/* SEARCH SECTION */}
      <section className="py-6 bg-white dark:bg-[#111] border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-4">
          <SearchBar />
        </div>
      </section>

      {/* URGENT DEALS / STORIES */}
      <UrgentStories />

      {/* TRUST SECTION */}
      <section className="py-8 bg-white dark:bg-[#111] border-b border-slate-200 dark:border-slate-800">
        <div className="w-full max-w-[1200px] mx-auto px-4 text-center">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Buy trusted products in Kabale
          </h2>
          <div className="flex flex-col md:flex-row items-center justify-center text-sm md:text-base font-bold text-slate-700 dark:text-slate-300 gap-3 md:gap-6">
            <span>Pay on mobile</span>
            <span className="md:hidden text-slate-400">|</span>
            <span className="hidden md:inline text-slate-400">__</span>
            <span>Verified Quality</span>
            <span className="md:hidden text-slate-400">|</span>
            <span className="hidden md:inline text-slate-400">__</span>
            <span>Fast delivery</span>
          </div>
        </div>
      </section>

      {/* MIDDLE NAV */}
      <MiddleNav />

      <div className="w-full mt-6 space-y-12">

        {/* 1. OFFICIAL STORES BLOCK */}
        {officialProducts.length > 0 && (
          <section className="flex flex-col items-center w-full">
            <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-4">
              <ProductSection title="From Official Stores" products={officialProducts} />
            </div>
            <div className="mt-8 flex flex-col items-center text-center px-4">
              <p className="text-slate-700 dark:text-slate-300 font-bold mb-3 text-sm sm:text-base">
                Checkout official products here
              </p>
              <Link href="/officialStore" className="px-8 py-3 bg-[#D97706] hover:bg-amber-600 text-white font-black text-sm uppercase tracking-wider shadow-md rounded-sm transition-colors">
                Official products &gt;&gt;
              </Link>
            </div>
          </section>
        )}

        {/* 2. QUICK SHIP MESSAGE */}
        <section className="w-full max-w-[800px] mx-auto px-4 py-8 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-3">
            Need to shop quick and fast delivery times?
          </h3>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Message us on <a href="https://wa.me/256759997376" className="text-[#D97706] font-bold hover:underline">256759997376</a>
          </p>
        </section>

        {/* 3. APPROVED QUALITY BLOCK */}
        {approvedProducts.length > 0 && (
          <section className="flex flex-col items-center w-full">
            <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-4">
              <ProductSection title="Approved Quality" products={approvedProducts} />
            </div>
            <div className="mt-8 flex flex-col items-center text-center px-4">
              <p className="text-slate-700 dark:text-slate-300 font-bold mb-3 text-sm sm:text-base max-w-md">
                See more quality verified products in official stores section
              </p>
              <Link href="/officialStore" className="px-8 py-3 bg-[#D97706] hover:bg-amber-600 text-white font-black text-sm uppercase tracking-wider shadow-md rounded-sm transition-colors">
                Official products &gt;&gt;
              </Link>
            </div>
          </section>
        )}

        {/* 4. MERCHANT CODES SECTION */}
        <section className="w-full max-w-[800px] mx-auto px-4 py-8 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <h4 className="text-sm uppercase tracking-widest font-black text-slate-500 mb-6">Secure Payment Merchant Codes</h4>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-lg border border-red-100 dark:border-red-900 w-full sm:w-48">
              <span className="block text-red-600 dark:text-red-400 font-bold mb-1">Airtel Money</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white tracking-widest">7050183</span>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-950/30 p-4 rounded-lg border border-yellow-100 dark:border-yellow-900 w-full sm:w-48">
              <span className="block text-yellow-600 dark:text-yellow-500 font-bold mb-1">MTN MoMo</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white tracking-widest">14843537</span>
            </div>
          </div>
        </section>

        {/* 5. BOOSTED CAROUSEL */}
        {boostedProducts.length > 0 && (
          <section className="w-full pt-6">
            <HorizontalScroller title="Boosted deals" products={boostedProducts} />
          </section>
        )}

        {/* 6. ORIGINAL SELL ON KABALE CTA (Between Boosted and Featured) */}
        <section className="relative py-20 md:py-28 text-center bg-slate-100/50 dark:bg-[#111] border-y border-slate-200 dark:border-slate-800 my-12 w-full">
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

        {/* 7. FEATURED CAROUSEL */}
        {featuredProducts.length > 0 && (
          <section className="w-full">
            <HorizontalScroller title="Featured items" products={featuredProducts} />
          </section>
        )}

        {/* 8. ORIGINAL CATEGORIES BLOCK (At the very end) */}
        <section className="py-12 border-t border-slate-200 dark:border-slate-800 mt-12">
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
