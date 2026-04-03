import UrgentStories from "@/components/UrgentStories";
import ProductSection from "@/components/ProductSection";
import HorizontalScroller from "@/components/HorizontalScroller";
import MiddleNav from "@/components/MiddleNav"; 
import Link from "next/link";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export const revalidate = 60;

// --- SHUFFLE HELPER FUNCTION ---
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

  // 1. Fetch Official Stores
  const officialQ = query(collection(db, "products"), where("isAdminUpload", "==", true), limit(12));
  const officialSnap = await getDocs(officialQ);
  let officialProducts = officialSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  officialProducts = shuffleArray(officialProducts);

  // 2. Fetch Approved Quality
  const approvedQ = query(collection(db, "products"), where("isApprovedQuality", "==", true), limit(12));
  const approvedSnap = await getDocs(approvedQ);
  let approvedProducts = approvedSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
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

  // 5. Fetch Last Added
  const latestQ = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(12));
  const latestSnap = await getDocs(latestQ);
  const latestProducts = latestSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

  // 6. Fetch "For Her" Products
  const ladiesQ = query(collection(db, "products"), where("ladies_home", "==", true), limit(8));
  const ladiesSnap = await getDocs(ladiesQ);
  let ladiesProducts = ladiesSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  ladiesProducts = shuffleArray(ladiesProducts);

  return (
    // Reduced top padding slightly to pull things up
    <div className="min-h-screen bg-slate-100 dark:bg-[#0a0a0a] pb-12 pt-4 sm:pt-16 font-sans selection:bg-[#D97706] selection:text-white overflow-x-hidden flex flex-col">

      {/* NEW TOP MESSAGE */}
      <section className="py-2 bg-white dark:bg-[#111] flex justify-center px-4 border-b-[6px] border-sky-400 dark:border-sky-800">
        <h1 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 text-center tracking-wide">
          Find Trusted Products in Kabale — <span className="text-[#D97706] font-black">Pay After Inspecting</span>
        </h1>
      </section>

      {/* MIDDLE NAV */}
      <div className="bg-white dark:bg-[#111] border-b-[6px] border-sky-400 dark:border-sky-800">
        <MiddleNav />
      </div>

      {/* REMOVED `space-y-12` and replaced with a tight flex-col container.
        Each section now handles its own minimal padding and blue bottom border.
      */}
      <div className="w-full flex flex-col">

        {/* 1. OFFICIAL STORES */}
        {officialProducts.length > 0 && (
          <section className="w-full bg-white dark:bg-[#111] py-2 border-b-[6px] border-sky-400 dark:border-sky-800">
            <HorizontalScroller 
              title="From Official Stores" 
              products={officialProducts} 
              viewAllLink="/officialStore" 
            />
          </section>
        )}

        {/* 2. QUICK SHIP MESSAGE */}
        <section className="w-full bg-white dark:bg-[#111] py-3 px-2 border-b-[6px] border-sky-400 dark:border-sky-800">
          <div className="w-full max-w-[800px] mx-auto bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-500 rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                    Need it today?
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Direct delivery in Kabale. Chat to arrange.
                  </p>
                </div>
              </div>
              <a 
                href="https://wa.me/256759997376" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-[#25D366] hover:bg-[#1EBE57] text-white text-sm font-bold rounded-lg transition-colors shrink-0"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Chat
              </a>
            </div>
          </div>
        </section>

        {/* 3. TESTED & TRUSTED */}
        {approvedProducts.length > 0 && (
          <section className="w-full bg-white dark:bg-[#111] py-3 border-b-[6px] border-sky-400 dark:border-sky-800">
            <div className="w-full max-w-[1200px] mx-auto px-2">
              <ProductSection title="Tested & Trusted Products" products={approvedProducts} />
            </div>
            <div className="mt-3 flex justify-center pb-2">
              <Link href="/officialStore" className="px-6 py-2 bg-[#D97706] hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider rounded-sm transition-colors">
                Official products &gt;&gt;
              </Link>
            </div>
          </section>
        )}

        {/* 4. URGENT STORIES */}
        <div className="w-full bg-white dark:bg-[#111] py-1 border-b-[6px] border-sky-400 dark:border-sky-800">
          <UrgentStories />
        </div>

        {/* 5. HOT PICKS FOR HER */}
        {ladiesProducts.length > 0 && (
          <section className="w-full bg-white dark:bg-[#111] py-2 border-b-[6px] border-sky-400 dark:border-sky-800">
            <HorizontalScroller 
              title="Hot Picks for Her 💖" 
              products={ladiesProducts} 
              viewAllLink="/ladies" 
            />
          </section>
        )}

        {/* 6. MERCHANT CODES SECTION */}
        <section className="w-full bg-white dark:bg-[#111] py-4 border-b-[6px] border-sky-400 dark:border-sky-800">
          <div className="max-w-[800px] mx-auto px-4 text-center">
            <h4 className="text-xs uppercase tracking-widest font-black text-slate-500 mb-3">Secure Payment Codes</h4>
            <div className="flex flex-row justify-center gap-4">
              <div className="bg-red-50 dark:bg-red-950/30 p-2 rounded border border-red-100 dark:border-red-900 w-1/2 max-w-[200px]">
                <span className="block text-red-600 dark:text-red-400 text-xs font-bold">Airtel Money</span>
                <span className="text-lg font-black text-slate-900 dark:text-white">7050183</span>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-950/30 p-2 rounded border border-yellow-100 dark:border-yellow-900 w-1/2 max-w-[200px]">
                <span className="block text-yellow-600 dark:text-yellow-500 text-xs font-bold">MTN MoMo</span>
                <span className="text-lg font-black text-slate-900 dark:text-white">14843537</span>
              </div>
            </div>
          </div>
        </section>

        {/* 7. JUST ADDED */}
        {latestProducts.length > 0 && (
          <section className="w-full bg-white dark:bg-[#111] py-2 border-b-[6px] border-sky-400 dark:border-sky-800">
            <HorizontalScroller 
              title="Just Added" 
              products={latestProducts} 
              viewAllLink="/products" 
            />
          </section>
        )}

        {/* 8. BOOSTED CAROUSEL & SELL CTA */}
        {boostedProducts.length > 0 && (
          <>
            <section className="w-full bg-white dark:bg-[#111] py-2 border-b-[6px] border-sky-400 dark:border-sky-800">
              <HorizontalScroller title="Today’s Sponsored Deals" products={boostedProducts} />
            </section>

            <section className="relative py-6 overflow-hidden w-full bg-white dark:bg-[#111] border-b-[6px] border-sky-400 dark:border-sky-800">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#D97706]/10 blur-[80px] rounded-full pointer-events-none" />
              
              <div className="relative z-10 w-full max-w-[900px] mx-auto px-4 flex flex-col items-center text-center">
                <h2 className="text-2xl sm:text-3xl font-black mb-2 text-slate-900 dark:text-white tracking-tight">
                  Turn your items into <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D97706] to-amber-500">cash instantly.</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-4 max-w-lg mx-auto">
                  Reach thousands of buyers across Kabale. Post directly via our WhatsApp bot in just 60 seconds.
                </p>
                <div className="flex flex-row items-center gap-3 justify-center">
                  <a
                    href="https://wa.me/256740373021?text=Hi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#25D366] hover:bg-[#1EBE57] text-white font-bold text-sm rounded-lg transition-all shadow-sm"
                  >
                    Start Selling
                  </a>
                  <a
                    href="mailto:shopkabale@gmail.com"
                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm rounded-lg"
                  >
                    Need Support?
                  </a>
                </div>
              </div>
            </section>
          </>
        )}

        {/* 9. FEATURED CAROUSEL */}
        {featuredProducts.length > 0 && (
          <section className="w-full bg-white dark:bg-[#111] py-2 border-b-[6px] border-sky-400 dark:border-sky-800">
            <HorizontalScroller title="Featured Picks" products={featuredProducts} />
          </section>
        )}

        {/* 10. ORIGINAL CATEGORIES BLOCK */}
        <section className="w-full bg-white dark:bg-[#111] py-6 border-b-[6px] border-sky-400 dark:border-sky-800">
          <div className="w-full max-w-[1200px] mx-auto px-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center mb-4">
              Explore by category
            </h3>

            <div className="flex flex-col gap-2 max-w-3xl mx-auto">
              {[
                { name: "Official Store", href: "/officialStore", desc: "Premium, verified products", icon: "⭐" },
                { name: "Ladies' Picks 💖", href: "/ladies", desc: "Handbags, beauty essentials", icon: "🛍️" },
                { name: "Student market", href: "/category/student_item", desc: "Hostel items, textbooks", icon: "🎓" }, 
                { name: "Electronics", href: "/category/electronics", desc: "Smartphones, laptops, TVs", icon: "💻" }, 
                { name: "Agriculture", href: "/category/agriculture", desc: "Produce, farm tools", icon: "🌱" }
              ].map((cat) => (
                <Link 
                  key={cat.name} 
                  href={cat.href} 
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm hover:border-[#D97706] transition-all w-full"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white dark:bg-[#111] rounded-full flex items-center justify-center text-xl shrink-0 border border-slate-200 dark:border-slate-800">
                      {cat.icon}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                        {cat.name}
                      </span>
                      <span className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">
                        {cat.desc}
                      </span>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
