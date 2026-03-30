import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import ProductSection from "@/components/ProductSection";
import Link from "next/link";

// Forces the page to always fetch the freshest inventory
export const dynamic = "force-dynamic";

export default async function OfficialStorePage() {
  // Fetch ALL products where the admin uploaded them directly
  const officialQ = query(
    collection(db, "products"), 
    where("isAdminUpload", "==", true)
  );
  
  const officialSnap = await getDocs(officialQ);
  const officialProducts = officialSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

  // Sort by newest first so returning customers see fresh stock at the top
  const sortedProducts = officialProducts.sort((a, b) => {
    const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
    const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] pb-12 font-sans selection:bg-[#D97706] selection:text-white">
      
      {/* TRUST & AUTHORITY HEADER */}
      <section className="bg-slate-900 dark:bg-black text-white py-12 md:py-16 px-4 text-center border-b-4 border-[#D97706]">
        <div className="max-w-[800px] mx-auto">
          <div className="inline-block bg-[#D97706]/20 text-[#D97706] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4 border border-[#D97706]/50">
            Verified by Kabale Online
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">
            Official Store
          </h1>
          <p className="text-slate-300 text-sm md:text-base font-medium max-w-2xl mx-auto leading-relaxed">
            Premium, verified products sold directly by us. Guaranteed quality, secure mobile payments, and fast delivery across Kabale and Kigezi.
          </p>
        </div>
      </section>

      {/* PRODUCT GRID USING YOUR EXACT HOMEPAGE COMPONENT */}
      <section className="w-full max-w-[1200px] mx-auto px-3 sm:px-4 mt-8 md:mt-12">
        {sortedProducts.length > 0 ? (
          <ProductSection 
            title="Available Inventory" 
            products={sortedProducts} 
          />
        ) : (
          <div className="text-center py-20 bg-white dark:bg-[#111] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mt-8">
            <span className="text-4xl mb-4 block">📦</span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Inventory Updating</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-6">
              We are currently restocking our official items. Check back soon.
            </p>
            <Link 
              href="/" 
              className="inline-block px-8 py-3 bg-slate-900 dark:bg-slate-200 text-white dark:text-black rounded-full font-bold shadow-md hover:scale-105 transition-transform"
            >
              Return to Homepage
            </Link>
          </div>
        )}
      </section>

    </div>
  );
}
