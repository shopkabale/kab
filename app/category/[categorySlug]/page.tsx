import { Metadata } from "next";
import Link from "next/link";
import { getProducts } from "@/lib/firebase/firestore";
// 🔥 Swapped ClientProductGrid for ProductSection to match Home Page
import ProductSection from "@/components/ProductSection";
import SearchBar from "@/components/SearchBar";
import { optimizeImage } from "@/lib/utils";

// 🔥 1. REMOVED force-dynamic. 
// 🔥 2. ADDED revalidate. Caches this category page for 1 hour.
// This saves you massive amounts of Firebase quota on high-traffic days.
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

// ==========================================
// THE DAILY SHUFFLE ALGORITHM
// ==========================================
function getDailyRandomScore(id: string) {
  const today = new Date().toISOString().split('T')[0];
  const seedString = id + today; 

  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash << 5) - hash + seedString.charCodeAt(i);
    hash |= 0; 
  }
  return hash;
}

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================
export default async function CategoryPage({ 
  params,
}: { 
  params: { categorySlug: string };
}) {
  // 🔥 3. PASS A LIMIT TO THE FIREBASE QUERY
  // We pass 100 here. It fetches the 100 newest items for this category.
  // This guarantees this page costs exactly 100 reads per hour max.
  const rawCategoryProducts = await getProducts(params.categorySlug, 100);

  // 4. SHUFFLE THEM (Stable Daily Randomization on the 100 recent items)
  rawCategoryProducts.sort((a, b) => getDailyRandomScore(a.id) - getDailyRandomScore(b.id));

  // 5. OPTIMIZE ALL IMAGES
  const allCategoryProducts = rawCategoryProducts.map((product) => {
    if (!product.images || product.images.length === 0) return product;

    return {
      ...product,
      images: product.images.map((img: string) => optimizeImage(img))
    };
  });

  // 6. Get the dynamic UI details for the hero banner
  const info = categoryDetails[params.categorySlug] || {
    title: params.categorySlug.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: `Browse all items in ${params.categorySlug.replace(/_/g, ' ')}.`,
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] font-sans selection:bg-[#D97706] selection:text-white">

      {/* ========================================== */}
      {/* PROFESSIONAL HERO & SEARCH SECTION         */}
      {/* ========================================== */}
      <section className="bg-white dark:bg-[#111] py-12 md:py-16 border-b border-slate-200 dark:border-slate-800 shadow-sm px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4 text-slate-900 dark:text-white tracking-tight uppercase">
            {info.title}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base font-medium max-w-xl mx-auto mb-8">
            {info.description}
          </p>

          {/* Integrated Search Bar */}
          <div className="max-w-xl mx-auto">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* 🧩 MAIN CONTENT AREA                       */}
      {/* ========================================== */}
      <div className="max-w-[1600px] mx-auto mt-8 space-y-6">

        {/* THE HOMEPAGE PRODUCT SECTION 
            Passed the dynamic info.title and item count into the ProductSection title 
        */}
        <div className="px-1 sm:px-4 pb-12">
          <ProductSection 
            title={`Latest ${info.title} Deals`} 
            products={allCategoryProducts} 
          />
        </div>

        {/* ========================================== */}
        {/* CATEGORIES LIST ROW                        */}
        {/* ========================================== */}
        <section className="py-12 border-t border-slate-200 dark:border-slate-800 px-4 mt-8">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest text-center mb-8">
              Explore Other Categories
            </h3>

            <div className="flex flex-col gap-3 sm:gap-4">
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
              ].map((cat) => {
                // Hide the current category from the "Other Categories" list
                if (cat.link === params.categorySlug) return null;

                return (
                  <Link 
                    key={cat.name} 
                    href={`/category/${cat.link}`} 
                    className="group flex items-center justify-between p-4 sm:p-5 bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-[#D97706] dark:hover:border-[#D97706] hover:shadow-md transition-all duration-200 w-full"
                  >
                    <div className="flex items-center gap-4 sm:gap-5 overflow-hidden">
                      {/* Icon Bubble */}
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform duration-300 border border-slate-100 dark:border-slate-800">
                        {cat.icon}
                      </div>

                      {/* Text Details */}
                      <div className="flex flex-col text-left overflow-hidden">
                        <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white group-hover:text-[#D97706] transition-colors truncate">
                          {cat.name}
                        </span>
                        <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate pr-2">
                          {cat.desc}
                        </span>
                      </div>
                    </div>

                    {/* Right Arrow / Action */}
                    <div className="flex items-center gap-2 text-slate-300 dark:text-slate-600 group-hover:text-[#D97706] transition-colors pl-2 shrink-0">
                      <span className="text-xs font-bold uppercase tracking-widest hidden sm:block">View</span>
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
