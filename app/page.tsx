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

        {/* 5. BOOSTED & FEATURED CAROUSELS */}
        {boostedProducts.length > 0 && (
          <section className="w-full pt-6">
            <HorizontalScroller title="Boosted deals" products={boostedProducts} />
          </section>
        )}

        {featuredProducts.length > 0 && (
          <section className="w-full">
            <HorizontalScroller title="Featured items" products={featuredProducts} />
          </section>
        )}

      </div>
    </div>
  );
}
