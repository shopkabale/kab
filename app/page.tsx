import UrgentStories from "@/components/UrgentStories";
import ProductSection from "@/components/ProductSection";
import HorizontalScroller from "@/components/HorizontalScroller";
import MiddleNav from "@/components/MiddleNav"; 
import Link from "next/link";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export const dynamic = "force-dynamic";

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
    <div className="min-h-screen bg-slate-50 pb-12 pt-2 sm:pt-4 font-sans selection:bg-[#D97706] selection:text-white overflow-x-hidden">


      {/* NEW TOP MESSAGE (Replacing Search Bar & Trust Section) */}
      <section className="py-4 bg-white dark:bg-[#111] border-b border-slate-200 dark:border-slate-800 shadow-sm flex justify-center px-4">
        <h1 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 text-center tracking-wide">
          Find Trusted Products in Kabale — <span className="text-[#D97706] font-black">Pay After Inspecting the item</span>
        </h1>
      </section>

      {/* MIDDLE NAV */}
      <MiddleNav />

      <div className="w-full mt-6 space-y-12">

        {/* 1. OFFICIAL STORES (Now a Horizontal Scroller) */}
        {officialProducts.length > 0 && (
          <section className="w-full pt-2">
            <HorizontalScroller 
              title="From Official Stores" 
              products={officialProducts} 
              viewAllLink="/officialStore" 
            />
          </section>
        )}

        {/* 2. QUICK SHIP MESSAGE */}
        <section className="w-full max-w-[800px] mx-auto px-4">
          <div className="bg-white dark:bg-[#111] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-shadow hover:shadow-md">
            <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4">
                <div className="w-12 h-12 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-500 rounded-full flex items-center justify-center shrink-0">
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
              <a 
                href="https://wa.me/256759997376" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-[#25D366] hover:bg-[#1EBE57] text-white font-bold rounded-xl transition-colors shadow-sm shrink-0"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Chat to order
              </a>
            </div>
          </div>
        </section>

        {/* 3. TESTED & TRUSTED (As it is now) */}
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

        {/* 4. URGENT STORIES */}
        <UrgentStories />

        {/* 5. HOT PICKS FOR HER (Now a Horizontal Scroller) */}
        {ladiesProducts.length > 0 && (
          <section className="w-full pt-2">
            <HorizontalScroller 
              title="Hot Picks for Her 💖" 
              products={ladiesProducts} 
              viewAllLink="/ladies" 
            />
          </section>
        )}

        {/* 6. MERCHANT CODES SECTION */}
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

        {/* 7. JUST ADDED (Now a Horizontal Scroller) */}
        {latestProducts.length > 0 && (
          <section className="w-full pt-2">
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
            <section className="w-full pt-6">
              <HorizontalScroller title="Today’s Sponsored Deals" products={boostedProducts} />
            </section>

            <section className="relative py-10 md:py-12 overflow-hidden w-full bg-white dark:bg-[#111] my-4">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#D97706]/10 blur-[100px] rounded-full pointer-events-none" />

              <div className="relative z-10 w-full max-w-[900px] mx-auto px-4 flex flex-col items-center text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D97706]/10 text-[#D97706] text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-4">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D97706] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D97706]"></span>
                  </span>
                  Kabale Seller Network
                </div>

                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-3 text-slate-900 dark:text-white tracking-tight leading-tight">
                  Turn your items into <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D97706] to-amber-500">cash instantly.</span>
                </h2>

                <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 mb-6 leading-relaxed font-medium max-w-xl mx-auto">
                  Reach thousands of buyers across Kabale. Post directly via our WhatsApp bot in just 60 seconds.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto justify-center">
                  <a
                    href="https://wa.me/256740373021?text=Hi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#1EBE57] text-white font-bold text-sm md:text-base rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 w-full sm:w-auto"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Start Selling in 60s
                  </a>
                  <a
                    href="mailto:shopkabale@gmail.com"
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-sm md:text-base rounded-xl transition-all w-full sm:w-auto"
                  >
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Need Support?
                  </a>
                </div>
              </div>
            </section>
          </>
        )}

        {/* 9. FEATURED CAROUSEL */}
        {featuredProducts.length > 0 && (
          <section className="w-full">
            <HorizontalScroller title="Featured Picks" products={featuredProducts} />
          </section>
        )}

        {/* 10. ORIGINAL CATEGORIES BLOCK */}
        <section className="py-12 border-t border-slate-200 dark:border-slate-800 mt-12">
          <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest text-center mb-8">
              Explore by category
            </h3>

            <div className="flex flex-col gap-3 sm:gap-4 max-w-3xl mx-auto">
              {[
                { name: "Official Store", href: "/officialStore", desc: "Premium, verified products sold directly by Kabale Online", icon: "⭐" },
                { name: "Ladies' Picks 💖", href: "/ladies", desc: "Handbags, perfumes, jewelry, and beauty essentials", icon: "🛍️" },
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
