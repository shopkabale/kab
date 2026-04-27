import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import CategoryProductFeed from "@/components/CategoryProductFeed";
import LeftSidebar from "@/components/LeftSidebar"; 
import { 
  Laptop, 
  Leaf, 
  ShoppingBag, 
  ChevronRight, 
  Package,
  Bed,
  Sparkles,
  Wrench
} from "lucide-react"; 

// 🔥 Caches this category page for 1 hour. (1 Read per hour, per category)
export const revalidate = 3600;

// ==========================================
// 6 FRONTEND BUCKETS MAPPING TO 11 BACKEND CATEGORIES
// ==========================================
const frontendCategoryMap: Record<string, { title: string; description: string; backendCategories: string[] }> = {
  "tech-appliances": {
    title: "Tech, Gadgets & Appliances ⚡",
    description: "Laptops, phones, smart watches, sound systems, and essential home appliances.",
    backendCategories: ["electronics", "watches"] // Removed official_store
  },
  "beauty-fashion": {
    title: "Glow Up: Beauty & Fashion ✨",
    description: "Premium cosmetics, skincare, hygiene essentials, and trending ladies' fashion picks.",
    backendCategories: ["beauty", "ladies_picks"]
  },
  "food-groceries": {
    title: "Farm Fresh & Daily Groceries 🍅",
    description: "Fresh local agriculture produce, daily supermarket groceries, and quick snacks.",
    backendCategories: ["agriculture", "groceries"]
  },
  "campus-life": {
    title: "Campus Life & Study Gear 🎓",
    description: "Hostel essentials, stationery, textbooks, and fun gifts to thrive on campus.",
    backendCategories: ["student_essentials", "student_item", "stationery", "gifts"]
  },
  "mega-bundles": {
    title: "Mega Bundles & Starter Packs 📦",
    description: "Save big with our curated mega bundles and fresher starter kits. Everything in one box.",
    backendCategories: ["bundles"]
  },
  "repairs-services": {
    title: "Expert Repairs & Services 🛠️",
    description: "Trusted local professionals for laptop repairs, CV writing, moving services, and more.",
    backendCategories: ["services"]
  }
};

// ==========================================
// DYNAMIC SEO & OPEN GRAPH METADATA
// ==========================================
export async function generateMetadata({ params }: { params: { categorySlug: string } }): Promise<Metadata> {
  const slug = params.categorySlug;
  const categoryData = frontendCategoryMap[slug];

  // Fallback for older links
  const title = categoryData ? categoryData.title : `${slug.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
  const description = categoryData ? categoryData.description : `Shop the best local deals for ${slug.replace(/_/g, ' ')} delivered fast to your location.`;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.kabaleonline.com";
  const currentUrl = `${baseUrl}/category/${slug}`;
  const ogImageUrl = `${baseUrl}/api/og?title=${encodeURIComponent(title)}&desc=${encodeURIComponent("Fast Local Delivery in Kabale")}`;

  return {
    title: `${title} | Kabale Online`,
    description: description,
    keywords: [
      title, 
      "Kabale Online", 
      "Kabale University", 
      "student market", 
      slug.replace(/_/g, ' '), 
      "buy online Kabale"
    ],
    openGraph: {
      title: `${title} | Kabale Online`,
      description: description,
      url: currentUrl,
      siteName: "Kabale Online",
      images: [
        {
          url: ogImageUrl, 
          width: 1200,
          height: 630,
          alt: `${title} on Kabale Online`,
        },
      ],
      locale: "en_UG",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Kabale Online`,
      description: description,
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
  const categoryData = frontendCategoryMap[slug];

  // 1. FALLBACK LOGIC: If a user visits an old URL, treat it as a single category search
  const backendCategoriesToFetch = categoryData ? categoryData.backendCategories : [slug];

  // 2. DYNAMIC FIREBASE QUERY using "in" to fetch multiple categories at once
  const categoryQ = query(
    collection(db, "products"),
    where("category", "in", backendCategoriesToFetch),
    orderBy("createdAt", "desc"),
    limit(PAGE_SIZE)
  );

  const snap = await getDocs(categoryQ);

  // 3. SAFE SERIALIZATION
  const initialProducts = snap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : (new Date(data.createdAt || 0).getTime()),
      updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (new Date(data.updatedAt || 0).getTime()),
    };
  });

  const displayTitle = categoryData ? categoryData.title : slug.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const displayDesc = categoryData ? categoryData.description : `Browse all items in ${slug.replace(/_/g, ' ')}.`;

  // 4. THE 6 EXPLORE CATEGORIES
  const exploreCategories = [
    { name: "Mega Bundles & Packs", link: "mega-bundles", desc: "Starter kits & combos", Icon: Package },
    { name: "Campus Life & Study Gear", link: "campus-life", desc: "Hostel gear, gifts & books", Icon: Bed },
    { name: "Tech, Gadgets & Appliances", link: "tech-appliances", desc: "Phones, laptops & home appliances", Icon: Laptop },
    { name: "Farm Fresh & Groceries", link: "food-groceries", desc: "Daily food & supermarket", Icon: Leaf },
    { name: "Beauty, Health & Fashion", link: "beauty-fashion", desc: "Cosmetics & ladies' picks", Icon: Sparkles },
    { name: "Expert Repairs & Services", link: "repairs-services", desc: "Fixes, moving & typing", Icon: Wrench }
  ];

  return (
    <div className="min-h-screen bg-transparent pb-12 pt-2 sm:pt-4 font-sans selection:bg-[#D97706] selection:text-white overflow-x-hidden">
      <div className="w-full max-w-[1400px] mx-auto px-0 sm:px-4">

        <div className="flex flex-col md:flex-row gap-4 w-full">

          {/* LEFT SIDEBAR AREA */}
          <div className="hidden md:flex flex-col gap-4 w-[220px] lg:w-[240px] shrink-0 sticky top-[110px] h-max z-10">
            <LeftSidebar />
          </div>

          {/* CENTER CONTENT */}
          <div className="flex-grow min-w-0 flex flex-col w-full gap-4">

            {/* PREMIUM CATEGORY BANNER */}
            <div className="bg-white dark:bg-[#151515] rounded-none md:rounded-md p-6 sm:p-8 md:p-10 border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 md:border-l-4 border-l-[#D97706]">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-2 text-slate-900 dark:text-white tracking-tight">
                {displayTitle}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-medium max-w-xl">
                {displayDesc}
              </p>
            </div>

            {/* THE PAGINATED FEED */}
            <div className="w-full">
              {initialProducts.length > 0 ? (
                 <Suspense fallback={<div className="w-full h-[400px] bg-slate-50 dark:bg-slate-900/50 animate-pulse rounded-md" />}>
                   <CategoryProductFeed 
                     initialProducts={initialProducts} 
                     categoryName={slug} 
                     title={`Latest Deals`} 
                   />
                 </Suspense>
              ) : (
                <div className="bg-white dark:bg-[#151515] rounded-md border border-slate-200 dark:border-slate-800 shadow-sm p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                  <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2">No items yet</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-md">
                    Check back soon! New local deals are posted here daily.
                  </p>
                </div>
              )}
            </div>

            {/* EXPLORE OTHER CATEGORIES GRID */}
            <div className="bg-white dark:bg-[#151515] rounded-none md:rounded-md border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 mt-4">
              <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center mb-6">
                Explore The Marketplace
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {exploreCategories.map(({ name, link, desc, Icon }) => {
                  if (link === slug) return null; // Hide the active category

                  return (
                    <Link 
                      key={name} 
                      href={`/category/${link}`} 
                      className="group flex flex-col p-4 bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-lg hover:border-[#D97706] dark:hover:border-[#D97706] hover:shadow-md transition-all duration-200 w-full outline-none"
                    >
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-12 h-12 bg-white dark:bg-[#1a1a1a] rounded-md flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-800 shadow-sm">
                          <Icon className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-[#D97706] transition-colors" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-900 dark:text-white group-hover:text-[#D97706] transition-colors leading-tight">
                            {name}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 flex-grow">
                        {desc}
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
