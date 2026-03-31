import SearchBar from "@/components/SearchBar"; 
import UrgentStories from "@/components/UrgentStories";
import ProductSection from "@/components/ProductSection";
import HorizontalScroller from "@/components/HorizontalScroller";
import MiddleNav from "@/components/MiddleNav"; 
import Link from "next/link";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export const dynamic = "force-dynamic";

// --- SHUFFLE HELPER FUNCTION ---
// Fisher-Yates shuffle algorithm for unbiased randomization of the arrays
const shuffleArray = (array: any[]) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default async function Home() {
  const now = Date.now();

  // 1. Fetch Official Stores (Fetch your exact 12, then shuffle the display order)
  const officialQ = query(collection(db, "products"), where("isAdminUpload", "==", true), limit(12));
  const officialSnap = await getDocs(officialQ);
  let officialProducts = officialSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  
  // Randomize the order
  officialProducts = shuffleArray(officialProducts);

  // 2. Fetch Approved Quality (Fetch your exact 12, then shuffle the display order)
  const approvedQ = query(collection(db, "products"), where("isApprovedQuality", "==", true), limit(12));
  const approvedSnap = await getDocs(approvedQ);
  let approvedProducts = approvedSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  
  // Randomize the order
  approvedProducts = shuffleArray(approvedProducts);

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


      {/* ULTRA-COMPACT TRUST SECTION */}
      <section className="py-3 sm:py-4 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="w-full max-w-[1200px] mx-auto px-2 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6">
          <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Trusted in Kabale:
          </h2>
          <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1.5 text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">

            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              <span>Pay on delivery</span>
            </div>

            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Verified Quality</span>
            </div>

            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-[#D97706]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Fast delivery</span>
            </div>

          </div>
        </div>
      </section>


      {/* MIDDLE NAV */}
      <MiddleNav />



      <div className="w-full mt-6 space-y-12">

        {/* 1. APPROVED QUALITY BLOCK */}
        {approvedProducts.length > 0 && (
          <section className="flex flex-col items-center w-full">
            <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-4">
              <ProductSection title="Tested & Trusted Products" products={approvedProducts} />
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


                {/* 2. QUICK SHIP MESSAGE */}
        <section className="w-full max-w-[800px] mx-auto px-4">
          <div className="bg-white dark:bg-[#111] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-shadow hover:shadow-md">
            <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
              
              {/* Text & Icon Group */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4">
                <div className="w-12 h-12 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-500 rounded-full flex items-center justify-center shrink-0">
                  {/* Lightning / Fast Icon */}
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
                    Need it today?
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                    Get fast, direct delivery in Kabale. Chat with our local support team to arrange it right now.
                  </p>
                </div>
              </div>

              {/* WhatsApp CTA Button */}
              <a 
                href="https://wa.me/256759997376" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-[#25D366] hover:bg-[#1EBE57] text-white font-bold rounded-xl transition-colors shadow-sm shrink-0"
              >
                {/* Official WhatsApp SVG */}
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Chat on WhatsApp
              </a>
              
            </div>
          </div>
        </section>



        {/* 3. OFFICIAL STORES BLOCK */}
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


        {/* URGENT DEALS / STORIES */}
        <UrgentStories />


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

        {/* 5. BOOSTED CAROUSEL & 6. SELL CTA (Linked Visibility) */}
        {boostedProducts.length > 0 && (
          <>
            <section className="w-full pt-6">
              <HorizontalScroller title="Today’s Sponsored Deals" products={boostedProducts} />
            </section>

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
          </>
        )}

        {/* 7. FEATURED CAROUSEL */}
        {featuredProducts.length > 0 && (
          <section className="w-full">
            <HorizontalScroller title="Featured Picks" products={featuredProducts} />
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
                { name: "Official Store", href: "/officialStore", desc: "Premium, verified products sold directly by Kabale Online", icon: "⭐" },
                { name: "Student market", href: "/category/student_item", desc: "Hostel items, textbooks, gadgets, and campus essentials", icon: "🎓" }, 
                { name: "Electronics", href: "/category/electronics", desc: "Smartphones, laptops, TVs, audio, and accessories", icon: "💻" }, 
                { name: "Agriculture", href: "/category/agriculture", desc: "Fresh produce, farm tools, livestock, and fertilizers", icon: "🌱" }
              ].map((cat) => (
                <Link 
                  key={cat.name} 
                  href={cat.href} 
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
