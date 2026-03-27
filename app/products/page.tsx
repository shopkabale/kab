import { getProducts } from "@/lib/firebase/firestore";
import ClientProductGrid from "@/components/ClientProductGrid";
import SearchBar from "@/components/SearchBar"; 
import { optimizeImage } from "@/lib/utils"; 

// Force dynamic ensures we fetch fresh data
export const dynamic = "force-dynamic";

export const metadata = {
  title: "All Products | Kabale Online",
  description: "Browse all items available for sale in Kabale town.",
};

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

export default async function AllProductsPage() {
  // 1. Fetch ALL products 
  const rawProducts = await getProducts();

  // 2. SHUFFLE THEM (Stable Daily Randomization)
  rawProducts.sort((a, b) => getDailyRandomScore(a.id) - getDailyRandomScore(b.id));

  // 3. 🔥 OPTIMIZE ALL IMAGES 🔥
  // We do this on the server so the ClientGrid just receives fast URLs automatically!
  const allProducts = rawProducts.map((product) => {
    if (!product.images || product.images.length === 0) return product;

    return {
      ...product,
      // Map through every image in the product's gallery and optimize it
      images: product.images.map((img: string) => optimizeImage(img))
    };
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] font-sans selection:bg-[#D97706] selection:text-white">

      {/* ========================================== */}
      {/* PROFESSIONAL HERO & SEARCH SECTION         */}
      {/* ========================================== */}
      <section className="bg-white dark:bg-[#111] py-12 md:py-16 border-b border-slate-200 dark:border-slate-800 shadow-sm px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4 text-slate-900 dark:text-white tracking-tight uppercase">
            All Marketplace Items
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base font-medium max-w-xl mx-auto mb-8">
            Discover everything our local Kabale vendors have to offer. Fast delivery, pay strictly on arrival.
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

        {/* STATS HEADER */}
        <div className="px-4 sm:px-6 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">
            Explore Directory ({allProducts.length} Items)
          </h2>
        </div>

        {/* THE CLIENT GRID (Edge-to-edge px-2 padding on mobile) */}
        <div className="px-2 sm:px-4 pb-16">
          <ClientProductGrid products={allProducts} />
        </div>

      </div>
    </div>
  );
}
