import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import CategoryProductFeed from "@/components/CategoryProductFeed";
import LeftSidebar from "@/components/LeftSidebar"; 
// Added 'Watch' to the lucide-react imports
import { GraduationCap, Laptop, Leaf, ShoppingBag, ChevronRight, Watch } from "lucide-react"; 

// 🔥 Caches this category page for 1 hour. (1 Read per hour, per category)
export const revalidate = 3600;

// ==========================================
// DYNAMIC CATEGORY UI MAPPING
// ==========================================
const categoryDetails: Record<string, { title: string; description: string }> = {
  "electronics": {
    title: "Electronics & Gadgets",
    description: "Laptops, phones, and accessories from trusted vendors in Kabale.",
  },
  "agriculture": {
    title: "Agriculture Market",
    description: "Support local farmers. Buy fresh produce, tools, and supplies.",
  },
  "student_item": {
    title: "Campus Essentials",
    description: "Textbooks, furniture, and gear for Kabale University students.",
  },
  // Added Watches here
  "watches": {
    title: "Watches & Timepieces",
    description: "Discover classic, smart, and luxury watches from local vendors.",
  }
};

// ==========================================
// DYNAMIC SEO & OPEN GRAPH METADATA
// ==========================================
export async function generateMetadata({ params }: { params: { categorySlug: string } }): Promise<Metadata> {
  const slug = params.categorySlug;
  const info = categoryDetails[slug] || { 
    title: `${slug.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`, 
    description: `Shop the best local deals for ${slug.replace(/_/g, ' ')} delivered fast to your location.` 
  };

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.kabaleonline.com";
  const currentUrl = `${baseUrl}/category/${slug}`;
  const ogImageUrl = `${baseUrl}/api/og?title=${encodeURIComponent(info.title)}&desc=${encodeURIComponent("Fast Local Delivery in Kabale")}`;

  return {
    title: `${info.title} | Kabale Online`,
    description: info.description,
    keywords: [
      info.title, 
      "Kabale Online", 
      "Kabale University", 
      "student market", 
      slug.replace(/_/g, ' '), 
      "buy online Kabale"
    ],
    openGraph: {
      title: `${info.title} | Kabale Online`,
      description: info.description,
      url: currentUrl,
      siteName: "Kabale Online",
      images: [
        {
          url: ogImageUrl, 
          width: 1200,
          height: 630,
          alt: `${info.title} on Kabale Online`,
        },
      ],
      locale: "en_UG",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${info.title} | Kabale Online`,
      description: info.description,
      images: [ogImageUrl],
    },
    alternates: {
      canonical: currentUrl,
    },
  };
}

// Increased to 100 to ensure the client-side filter has enough data to work with without hitting Firebase again
const PAGE_SIZE = 100;

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================
export default async function CategoryPage({ 
  params,
}: { 
  params: { categorySlug: string };
}) {
  const slug = params.categorySlug;

  // 1. DYNAMIC FIREBASE QUERY (Safe from URL params, perfectly cacheable)
  const categoryQ = query(
    collection(db, "products"),
    where("category", "==", slug),
    orderBy("createdAt", "desc"),
    limit(PAGE_SIZE)
  );

  const snap = await getDocs(categoryQ);

  // 2. SAFE SERIALIZATION
  const initialProducts = snap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : (new Date(data.createdAt || 0).getTime()),
      updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (new Date(data.updatedAt || 0).getTime()),
    };
  });

  const info = categoryDetails[slug] || {
    title: slug.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: `Browse all items in ${slug.replace(/_/g, ' ')}.`,
  };

  return (
    // ROOT CONTAINER: Fully transparent to match the site-wide architecture
    <div className="min-h-screen bg-transparent pb-12 pt-2 sm:pt-4 font-sans selection:bg-[#D97706] selection:text-white overflow-x-hidden">

      <div className="w-full max-w-[1400px] mx-auto px-0 sm:px-4">

        {/* DESKTOP SPLIT GRID */}
        <div className="flex flex-col md:flex-row gap-4 w-full">

          {/* LEFT SIDEBAR AREA */}
          <div className="hidden md:flex flex-col gap-4 w-[220px] lg:w-[240px] shrink-0 sticky top-[110px] h-max z-10">
            <LeftSidebar />
          </div>

          {/* CENTER CONTENT */}
          <div className="flex-grow min-w-0 flex flex-col w-full gap-4">

            {/* PREMIUM CATEGORY BANNER (White Island Style) */}
            <div className="bg-white dark:bg-[#151515] rounded-none md:rounded-md p-6 sm:p-8 md:p-10 border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 md:border-l-4 border-l-[#D97706]">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-2 text-slate-900 dark:text-white tracking-tight uppercase">
                {info.title}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-medium max-w-xl">
                {info.description}
              </p>
            </div>

            {/* THE PAGINATED FEED */}
            <div className="w-full">
              {initialProducts.length > 0 ? (
                 // SUSPENSE BOUNDARY: Prevents useSearchParams in CategoryProductFeed from de-opting this layout
                 <Suspense fallback={<div className="w-full h-[400px] bg-slate-50 dark:bg-slate-900/50 animate-pulse rounded-md" />}>
                   <CategoryProductFeed 
                     initialProducts={initialProducts} 
                     categoryName={slug} 
                     title={`Latest ${info.title} Deals`} 
                   />
                 </Suspense>
              ) : (
                // CLEAN ENTERPRISE EMPTY STATE
                <div className="bg-white dark:bg-[#151515] rounded-md border border-slate-200 dark:border-slate-800 shadow-sm p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                  <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2">No items yet</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-md">
                    Check back soon! New local deals are posted here daily.
                  </p>
                </div>
              )}
            </div>

            {/* ========================================== */}
            {/* EXPLORE OTHER CATEGORIES                   */}
            {/* ========================================== */}
            <div className="bg-white dark:bg-[#151515] rounded-none md:rounded-md border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 mt-4">
              <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center mb-6">
                Explore Other Categories
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { 
                    name: "Student Market", 
                    link: "student_item",
                    desc: "Hostel items & gadgets",
                    icon: <GraduationCap className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-[#D97706] transition-colors" />
                  }, 
                  { 
                    name: "Electronics", 
                    link: "electronics",
                    desc: "Phones, laptops & audio",
                    icon: <Laptop className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-[#D97706] transition-colors" />
                  }, 
                  { 
                    name: "Agriculture", 
                    link: "agriculture",
                    desc: "Fresh produce & tools",
                    icon: <Leaf className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-[#D97706] transition-colors" />
                  },
                  // Added Watches to the Explore section
                  { 
                    name: "Watches", 
                    link: "watches",
                    desc: "Smart & classic timepieces",
                    icon: <Watch className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-[#D97706] transition-colors" />
                  }
                ].map((cat) => {
                  // Hide the current category
                  if (cat.link === slug) return null;

                  return (
                    <Link 
                      key={cat.name} 
                      href={`/category/${cat.link}`} 
                      className="group flex flex-col p-4 bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-lg hover:border-[#D97706] dark:hover:border-[#D97706] hover:shadow-md transition-all duration-200 w-full outline-none"
                    >
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-12 h-12 bg-white dark:bg-[#1a1a1a] rounded-md flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-800 shadow-sm">
                          {cat.icon}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-900 dark:text-white group-hover:text-[#D97706] transition-colors">
                            {cat.name}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 flex-grow">
                        {cat.desc}
                      </p>

                      <div className="flex items-center justify-between text-[#D97706] border-t border-slate-200 dark:border-slate-800 pt-3 mt-auto">
                        <span className="text-[10px] font-bold uppercase tracking-widest">Browse</span>
                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
