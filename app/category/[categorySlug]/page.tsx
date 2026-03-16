import { Metadata } from "next";
import { getProducts } from "@/lib/firebase/firestore";
import ClientProductGrid from "@/components/ClientProductGrid";
import SearchBar from "@/components/SearchBar";
import { optimizeImage } from "@/lib/utils"; // 👈 1. Import the magic function

// Force dynamic ensures we fetch fresh data
export const dynamic = "force-dynamic";

// ==========================================
// DYNAMIC CATEGORY UI MAPPING
// ==========================================
const categoryDetails: Record<string, { title: string; description: string; bg: string; icon: string }> = {
  "electronics": {
    title: "Quality Gadgets & Electronics",
    description: "Laptops, phones, and accessories from trusted vendors in Kabale.",
    bg: "bg-slate-900",
    icon: "💻",
  },
  "agriculture": {
    title: "Agriculture Market",
    description: "Support local farmers. Buy fresh produce, tools, and supplies.",
    bg: "bg-green-700", 
    icon: "🌾",
  },
  "student_item": {
    title: "Campus Essentials & Gear",
    description: "Textbooks, furniture, and campus essentials for Kabale University.",
    bg: "bg-[#D97706]", 
    icon: "🎒",
  }
};

// ==========================================
// DYNAMIC SEO & OPEN GRAPH METADATA
// ==========================================
export async function generateMetadata({ params }: { params: { categorySlug: string } }): Promise<Metadata> {
  const slug = params.categorySlug;
  const info = categoryDetails[slug] || { 
    title: `${slug.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`, 
    description: `Shop the best local deals for ${slug.replace(/_/g, ' ')} delivered fast to your hostel.` 
  };

  // Replace this with your actual production domain once you link it (e.g., https://kabaleonline.com)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.kabaleonline.com";

  const currentUrl = `${baseUrl}/category/${slug}`;

  // The new dynamic image URL powered by Vercel OG
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
  // 1. Fetch products strictly for this category
  const rawCategoryProducts = await getProducts(params.categorySlug);

  // 2. SHUFFLE THEM (Stable Daily Randomization)
  rawCategoryProducts.sort((a, b) => getDailyRandomScore(a.id) - getDailyRandomScore(b.id));

  // 3. 🔥 OPTIMIZE ALL IMAGES 🔥
  // Instantly apply the Cloudinary WebP cheat code before passing to the client component
  const allCategoryProducts = rawCategoryProducts.map((product) => {
    if (!product.images || product.images.length === 0) return product;

    return {
      ...product,
      images: product.images.map((img: string) => optimizeImage(img))
    };
  });

  // 4. Get the dynamic UI details for the hero banner
  const info = categoryDetails[params.categorySlug] || {
    title: params.categorySlug.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: `Browse all items in ${params.categorySlug.replace(/_/g, ' ')}.`,
    bg: "bg-slate-800", // Fallback color
    icon: "🛍️",         // Fallback icon
  };

  return (
    <div className="flex flex-col bg-white dark:bg-[#0a0a0a] min-h-screen">

      {/* PROFESSIONAL DYNAMIC HERO SECTION */}
      <section className="px-4 py-6">
        <div className={`-mx-4 sm:-mx-6 lg:-mx-8 px-6 sm:px-12 sm:rounded-2xl ${info.bg} py-16 text-white relative overflow-hidden flex flex-col justify-center shadow-lg text-center transition-colors duration-500`}>
          <h1 className="text-3xl md:text-5xl font-black mb-4 z-10 relative leading-tight tracking-tight">
            {info.title}
          </h1>
          <p className="text-white/90 text-sm md:text-lg max-w-2xl mx-auto z-10 relative font-medium">
            {info.description}
          </p>

          {/* Background Decor */}
          <span className="absolute left-[-5%] top-[-20%] text-9xl opacity-10">{info.icon}</span>
          <span className="absolute right-[-5%] bottom-[-10%] text-9xl md:text-[150px] opacity-10">{info.icon}</span>
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-0"></div>
        </div>
      </section>

      {/* SEARCH BAR */}
      <div className="w-full max-w-2xl mx-auto px-4 pb-6 md:pb-8">
        <SearchBar />
      </div>

      {/* STATS HEADER */}
      <div className="px-4 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Explore {allCategoryProducts.length}+ Items
          </h2>
        </div>
      </div>

      {/* THE CLIENT GRID */}
      <div className="px-4 pb-16">
        <ClientProductGrid products={allCategoryProducts} />
      </div>

    </div>
  );
}
