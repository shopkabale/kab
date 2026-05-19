import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation"; 
import { Suspense } from "react";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import CategoryProductFeed from "@/components/CategoryProductFeed";
import LeftSidebar from "@/components/LeftSidebar"; 
import { 
  Watch, 
  Smartphone, 
  Speaker, 
  Headphones, 
  Plug, 
  Package, 
  ChevronRight 
} from "lucide-react"; 

// 🔥 Caches this category page for 1 hour.
export const revalidate = 3600;

// ==========================================
// NEW ELECTRONICS FRONTEND BUCKETS MAPPING
// ==========================================
const frontendCategoryMap: Record<string, { title: string; description: string; backendCategories: string[]; bgImage: string }> = {
  "watches": {
    title: "Premium Watches",
    description: "Classic timepieces, smartwatches, and luxury wristwear.",
    backendCategories: ["watches", "watch"],
    bgImage: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=1200&q=80"
  },
  "phones-tvs": {
    title: "Phones & TVs",
    description: "The latest smartphones, tablets, and high-definition televisions.",
    backendCategories: ["phones", "tvs", "phones-tvs", "smartphones"],
    bgImage: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&q=80"
  },
  "sound-systems": {
    title: "Sound Systems",
    description: "Home theaters, soundbars, amplifiers, and premium speakers.",
    backendCategories: ["sound-systems", "audio", "speakers"],
    bgImage: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=1200&q=80"
  },
  "accessories": {
    title: "Tech Accessories",
    description: "Chargers, cables, cases, earbuds, and essential tech add-ons.",
    backendCategories: ["accessories", "tech-accessories"],
    bgImage: "https://images.unsplash.com/photo-1572569438061-9d11fc7b14d5?w=1200&q=80"
  },
  "appliances": {
    title: "Home Appliances",
    description: "Fridges, microwaves, blenders, and everyday electronic appliances.",
    backendCategories: ["appliances", "home-appliances"],
    bgImage: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1200&q=80"
  },
  "other-products": {
    title: "Other Products",
    description: "Explore a variety of other great products and lifestyle items.",
    backendCategories: ["other", "other-products", "general", "beauty", "agriculture", "student_item"], 
    bgImage: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&q=80"
  }
};

// ==========================================
// AUTOMATIC REDIRECT MAP (To handle legacy SEO links)
// ==========================================
const legacyMapping: Record<string, string> = {
  "tech-appliances": "appliances",
  "electronics": "phones-tvs",
  "beauty-fashion": "other-products",
  "beauty": "other-products",
  "ladies_picks": "other-products",
  "ladies": "other-products",
  "food-groceries": "other-products",
  "agriculture": "other-products",
  "groceries": "other-products",
  "campus-life": "other-products",
  "student_essentials": "other-products",
  "student_item": "other-products", 
  "stationery": "other-products",
  "gifts": "other-products",
  "mega-bundles": "other-products",
  "bundles": "other-products",
  "repairs-services": "other-products",
  "services": "other-products"
};

// ==========================================
// DYNAMIC SEO & OPEN GRAPH METADATA
// ==========================================
export async function generateMetadata({ params }: { params: { categorySlug: string } }): Promise<Metadata> {
  const originalSlug = params.categorySlug;
  const slug = legacyMapping[originalSlug] || originalSlug; 
  const categoryData = frontendCategoryMap[slug];

  const title = categoryData ? categoryData.title : `${slug.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
  const description = categoryData ? categoryData.description : `Shop the best local deals for ${slug.replace(/_/g, ' ')} delivered fast to your location.`;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.kabaleonline.com";
  const currentUrl = `${baseUrl}/category/${slug}`;
  const ogImageUrl = `${baseUrl}/api/og?title=${encodeURIComponent(title)}&desc=${encodeURIComponent("Fast Local Delivery in Kabale")}`;

  return {
    title: `${title} | Kabale Online`,
    description: description,
    keywords: [
      title, "Kabale Online", "Kabale Electronics", "buy electronics Kabale", slug.replace(/_/g, ' '), "buy online Kabale"
    ],
    openGraph: {
      title: `${title} | Kabale Online`,
      description: description,
      url: currentUrl,
      siteName: "Kabale Online",
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `${title} on Kabale Online` }],
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

const PAGE_SIZE = 100;

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================
export default async function CategoryPage({ 
  params,
}: { 
  params: { categorySlug: string };
}) {
  const originalSlug = params.categorySlug;

  // 1. SILENT REDIRECT
  if (legacyMapping[originalSlug]) {
    redirect(`/category/${legacyMapping[originalSlug]}`);
  }

  const slug = originalSlug; 
  const categoryData = frontendCategoryMap[slug];

  // 2. FALLBACK LOGIC
  const backendCategoriesToFetch = categoryData ? categoryData.backendCategories : [slug];
  const displayTitle = categoryData ? categoryData.title : slug.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const displayDesc = categoryData ? categoryData.description : `Browse all items in ${slug.replace(/_/g, ' ')}.`;
  const bgImageUrl = categoryData ? categoryData.bgImage : "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80"; // Default abstract pattern

  // 3. DYNAMIC FIREBASE QUERY 
  const categoryQ = query(
    collection(db, "products"),
    where("category", "in", backendCategoriesToFetch),
    orderBy("createdAt", "desc"),
    limit(PAGE_SIZE)
  );

  const snap = await getDocs(categoryQ);

  // 4. SAFE SERIALIZATION
  const initialProducts = snap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title || "Untitled", 
      price: data.price || 0,
      images: data.images || [],
      sellerName: data.sellerName || "",
      description: data.description || "",
      ...data,
      createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : (new Date(data.createdAt || 0).getTime()),
      updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (new Date(data.updatedAt || 0).getTime()),
    } as any; 
  });

  // 5. THE 6 NEW EXPLORE CATEGORIES
  const exploreCategories = [
    { name: "Watches", link: "watches", desc: "Classic & smart timepieces", Icon: Watch },
    { name: "Phones & TVs", link: "phones-tvs", desc: "Latest screens & mobile tech", Icon: Smartphone },
    { name: "Sound Systems", link: "sound-systems", desc: "Premium audio & speakers", Icon: Speaker },
    { name: "Accessories", link: "accessories", desc: "Chargers, cases & cables", Icon: Headphones },
    { name: "Appliances", link: "appliances", desc: "Home & kitchen electronics", Icon: Plug },
    { name: "Other Products", link: "other-products", desc: "Explore more great deals", Icon: Package }
  ];

  return (
    {/* 🔥 FIX 1: Removed overflow-x-hidden so the sidebar can stick! */}
    <div className="min-h-screen bg-transparent pb-12 pt-2 sm:pt-4 font-sans selection:bg-[#FF6A00] selection:text-white">
      <div className="w-full max-w-[1400px] mx-auto px-0 sm:px-4">
        
        {/* 🔥 FIX 2: Added items-start so columns track independently */}
        <div className="flex flex-col md:flex-row items-start gap-4 w-full">

          {/* 🔥 FIX 3: Applied the invisible scrollbar and correct heights */}
          <div className="hidden md:flex flex-col gap-4 w-[220px] lg:w-[240px] shrink-0 sticky top-[85px] h-[calc(100vh-85px)] overflow-y-auto overscroll-contain z-10 pb-6 pr-1 md:pr-2 
              [&::-webkit-scrollbar]:w-1.5 
              [&::-webkit-scrollbar-track]:bg-transparent 
              [&::-webkit-scrollbar-thumb]:bg-slate-200 
              dark:[&::-webkit-scrollbar-thumb]:bg-slate-800 
              [&::-webkit-scrollbar-thumb]:rounded-full 
              hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 
              dark:hover:[&::-webkit-scrollbar-thumb]:bg-slate-700"
          >
            <LeftSidebar />
          </div>

          {/* CENTER CONTENT */}
          <div className="flex-grow min-w-0 flex flex-col w-full gap-4">

            {/* PREMIUM CINEMATIC CATEGORY BANNER */}
            <div className="relative w-full rounded-none md:rounded-xl overflow-hidden shadow-md min-h-[220px] md:min-h-[260px] flex flex-col justify-center px-6 sm:px-10 py-12">
              {/* Background Image */}
              <Image 
                src={bgImageUrl} 
                fill 
                className="object-cover object-center" 
                alt={displayTitle} 
                priority 
              />
              {/* Cinematic Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/95 via-[#0a0a0a]/70 to-transparent"></div>

              {/* Text Content */}
              <div className="relative z-10 max-w-2xl">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-3 text-white tracking-tight leading-tight">
                  {displayTitle}
                </h1>
                <p className="text-slate-300 text-sm md:text-base font-medium leading-relaxed max-w-xl">
                  {displayDesc}
                </p>
              </div>
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
                  <Package className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
                  <h3 style={{ color: '#1A1A1A' }} className="text-sm font-black dark:text-white uppercase tracking-widest mb-2">No items yet</h3>
                  <p style={{ color: '#6B6B6B' }} className="text-xs font-medium max-w-md dark:text-slate-400">
                    Check back soon! New local deals are posted here daily.
                  </p>
                </div>
              )}
            </div>

            {/* EXPLORE OTHER CATEGORIES GRID */}
            <div className="bg-white dark:bg-[#151515] rounded-none md:rounded-md border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 mt-4">
              <h3 style={{ color: '#6B6B6B' }} className="text-xs font-black uppercase tracking-widest text-center mb-6 dark:text-slate-400">
                Explore The Marketplace
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {exploreCategories.map(({ name, link, desc, Icon }) => {
                  if (link === slug) return null; // Hide the active category

                  return (
                    <Link 
                      key={name} 
                      href={`/category/${link}`} 
                      className="group flex flex-col p-4 bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-lg hover:border-[#FF6A00] dark:hover:border-[#FF6A00] hover:shadow-md transition-all duration-200 w-full outline-none"
                    >
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-12 h-12 bg-white dark:bg-[#1a1a1a] rounded-md flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-800 shadow-sm">
                          <Icon className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-[#FF6A00] transition-colors" />
                        </div>
                        <div className="flex flex-col">
                          <span style={{ color: '#1A1A1A' }} className="text-sm font-black dark:text-white group-hover:text-[#FF6A00] transition-colors leading-tight">
                            {name}
                          </span>
                        </div>
                      </div>

                      <p style={{ color: '#6B6B6B' }} className="text-[11px] font-medium mb-4 line-clamp-2 flex-grow dark:text-slate-400">
                        {desc}
                      </p>

                      <div className="flex items-center justify-between text-[#FF6A00] border-t border-slate-200 dark:border-slate-800 pt-3 mt-auto">
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
