import type { Metadata } from "next";
import SearchBar from "@/components/SearchBar";
import Link from "next/link";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import CategoryProductFeed from "@/components/CategoryProductFeed";

export const dynamic = "force-dynamic";

// ==========================================
// SEO & OPEN GRAPH METADATA
// ==========================================
export const metadata: Metadata = {
  title: "Ladies' Top Picks 💖 | Kabale Online",
  description: "Shop handbags, perfumes, jewelry, and beauty essentials on Kabale Online. Handpicked for quality and style in Kabale.",
  keywords: ["ladies", "women's fashion", "handbags", "perfumes", "jewelry", "Kabale Online", "Uganda shopping"],
  openGraph: {
    title: "Ladies' Top Picks 💖 | Kabale Online",
    description: "Shop handbags, perfumes, jewelry, and beauty essentials.",
    url: "https://kabaleonline.com/ladies",
    siteName: "Kabale Online",
    images: [{ url: "/ladies-og-image.jpg", width: 1200, height: 630, alt: "Kabale Online Ladies Collection" }],
    locale: "en_UG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ladies' Top Picks 💖 | Kabale Online",
    description: "Shop handbags, perfumes, jewelry, and beauty essentials.",
    images: ["/ladies-og-image.jpg"],
  },
};

const PAGE_SIZE = 20;

export default async function LadiesPage() {
  // 1. Fetch exactly 20 items for the "ladies" category, newest first
  // ⚠️ IMPORTANT: You will need a Firebase Composite Index for (category + createdAt)
  const ladiesQ = query(
    collection(db, "products"),
    where("category", "==", "ladies"),
    orderBy("createdAt", "desc"),
    limit(PAGE_SIZE)
  );

  const snap = await getDocs(ladiesQ);
  
  // 2. Safely serialize timestamps to prevent Next.js Digest errors
  const initialProducts = snap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : (new Date(data.createdAt || 0).getTime()),
      updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (new Date(data.updatedAt || 0).getTime()),
    };
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] pb-12 font-sans selection:bg-pink-500 selection:text-white">

      

      {/* HERO BANNER */}
      <section className="relative w-full bg-pink-50 dark:bg-pink-950/20 py-12 md:py-16 border-b border-pink-100 dark:border-pink-900/50 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-200/50 dark:bg-pink-900/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#D97706]/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>

        <div className="relative z-10 w-full max-w-[1200px] mx-auto px-4 text-center flex flex-col items-center">
          <span className="inline-block py-1 px-3 rounded-full bg-white dark:bg-[#111] text-pink-600 dark:text-pink-400 text-xs font-black uppercase tracking-widest shadow-sm mb-4 border border-pink-100 dark:border-pink-800">
            For Her 💖
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
            Ladies' Top Picks
          </h1>
          <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 font-medium max-w-xl mx-auto">
            Handbags, perfumes, jewelry, and beauty essentials. Handpicked for quality and style. 
          </p>
        </div>
      </section>

      {/* PRODUCT GRID & PAGINATION */}
      <div className="w-full mt-8 md:mt-12">
        {initialProducts.length > 0 ? (
          <section className="flex flex-col items-center w-full">
            <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-4">
              <CategoryProductFeed 
                initialProducts={initialProducts} 
                categoryName="ladies" 
                title="All Ladies Collection" 
              />
            </div>
          </section>
        ) : (
          // EMPTY STATE
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
              <span className="text-3xl">🛍️</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
              New stock loading...
            </h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
              We're currently sourcing the best items for this section. Check back soon for amazing deals!
            </p>
            <Link href="/" className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors">
              Go back home
            </Link>
          </div>
        )}
      </div>

      {/* PERSONAL SHOPPER CTA */}
      {initialProducts.length > 0 && (
        <section className="w-full max-w-[800px] mx-auto px-4 mt-8 mb-8">
          <div className="bg-pink-600 rounded-2xl p-6 sm:p-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg shadow-pink-600/20">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white mb-2">Can't find what you need?</h3>
              <p className="text-pink-100 font-medium text-sm sm:text-base">
                Message our personal shopping team on WhatsApp. We'll find it for you in Kabale!
              </p>
            </div>
            <a 
              href="https://wa.me/256759997376?text=Hi! I'm looking for a specific item for ladies." 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-6 py-3.5 bg-white text-pink-600 hover:bg-pink-50 font-black rounded-xl transition-colors shadow-sm shrink-0 flex items-center gap-2"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Chat on WhatsApp
            </a>
          </div>
        </section>
      )}

    </div>
  );
}
