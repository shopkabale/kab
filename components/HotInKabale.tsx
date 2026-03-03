import { adminDb } from "@/lib/firebase/admin";
import Link from "next/link";
import Image from "next/image";

export default async function HotInKabale() {
  let trendingProducts: any[] = [];

  try {
    // Fetch top 4 active products sorted by the highest views
    const snap = await adminDb.collection("products")
      .where("status", "==", "active")
      .orderBy("views", "desc")
      .limit(4)
      .get();

    trendingProducts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching trending products:", error);
  }

  if (trendingProducts.length === 0) return null;

  return (
    <section className="py-8">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl animate-pulse">🔥</span>
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Hot in Kabale</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {trendingProducts.map((product) => {
          const displayImage = product.images?.[0] || "/og-image.jpg";
          const safeId = product.publicId || product.id;
          // Add a baseline of views if it's a new item to keep the gamification strong
          const displayViews = product.views > 5 ? product.views : Math.floor(Math.random() * 15) + 5;

          return (
            <Link key={product.id} href={`/item/${safeId}`} className="group relative bg-white border border-red-100 rounded-2xl p-3 shadow-sm hover:shadow-md transition-all hover:border-red-300 block">
              
              {/* View Count Badge */}
              <div className="absolute top-4 left-4 z-10 bg-black/80 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <span className="text-red-500">🔥</span> {displayViews} looking
              </div>

              <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-slate-100 mb-3">
                <Image 
                  src={displayImage} 
                  alt={product.name} 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-[#D97706] uppercase tracking-wider">{product.category}</p>
                <h3 className="font-bold text-slate-900 line-clamp-1 text-sm sm:text-base">{product.name}</h3>
                <p className="font-black text-slate-900">UGX {Number(product.price).toLocaleString()}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}