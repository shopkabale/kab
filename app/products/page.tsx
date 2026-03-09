import { getProducts } from "@/lib/firebase/firestore";
import ClientProductGrid from "@/components/ClientProductGrid"; // Import the new grid

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
  const allProducts = await getProducts();

  // 2. SHUFFLE THEM (Stable Daily Randomization)
  allProducts.sort((a, b) => getDailyRandomScore(a.id) - getDailyRandomScore(b.id));

  return (
    <div className="flex flex-col bg-white dark:bg-[#0a0a0a] min-h-screen">
      
      {/* PROFESSIONAL HERO SECTION */}
      <section className="px-4 py-6">
        <div className="-mx-4 sm:-mx-6 lg:-mx-8 px-6 sm:px-12 sm:rounded-2xl bg-slate-900 py-16 text-white relative overflow-hidden flex flex-col justify-center shadow-lg text-center">
          <h1 className="text-3xl md:text-5xl font-black mb-4 z-10 relative leading-tight tracking-tight">
            All Marketplace Items
          </h1>
          <p className="text-slate-300 text-sm md:text-lg max-w-2xl mx-auto z-10 relative font-medium">
            Discover everything our local Kabale vendors have to offer. Fast delivery, pay on arrival.
          </p>
          
          {/* Background Decor */}
          <span className="absolute left-[-5%] top-[-20%] text-9xl opacity-5">🛍️</span>
          <span className="absolute right-[-2%] bottom-[-10%] text-9xl opacity-5">📦</span>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent z-0"></div>
        </div>
      </section>

      {/* STATS HEADER */}
      <div className="px-4 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Explore {allProducts.length}+ Items
          </h2>
        </div>
      </div>

      {/* THE CLIENT GRID (Handles the animated Load More) */}
      <div className="px-4 pb-16">
        <ClientProductGrid products={allProducts} />
      </div>

    </div>
  );
}
