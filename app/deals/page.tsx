export const dynamic = "force-dynamic"; // 🔥 FIX 1: Allows ?campaign= URL parameters to work safely without crashing

import { collection, query, where, getDocs, orderBy, limit, doc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import CategoryProductFeed from "@/components/CategoryProductFeed";
import Link from "next/link";
import { ZapOff, Home } from "lucide-react";

export default async function DealsPage({
  searchParams,
}: {
  searchParams: { campaign?: string | string[] };
}) {
  // Extract string safely if Next.js passes an array
  const param = searchParams.campaign;
  const campaignFilter = Array.isArray(param) ? param[0] : param;

  // Format the title dynamically
  const pageTitle = campaignFilter 
    ? campaignFilter.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) 
    : "All Active Deals";

  // FIREBASE QUERY: Fetch items where isSale === true
  let dealsQuery = query(
    collection(db, "products"),
    where("isSale", "==", true),
    orderBy("createdAt", "desc"),
    limit(100)
  );

  if (campaignFilter) {
    dealsQuery = query(
      collection(db, "products"),
      where("isSale", "==", true),
      where("campaignType", "==", campaignFilter),
      orderBy("createdAt", "desc"),
      limit(100)
    );
  }

  const snap = await getDocs(dealsQuery);
  
  const now = new Date().getTime();
  const validProducts: any[] = [];
  const expiredDocs: any[] = [];

  snap.docs.forEach(document => {
    const data = document.data();
    const endTime = new Date(data.saleEndDate || 0).getTime();

    if (endTime > now) {
      // 🔥 FIX 2: Sanitize Firebase Timestamps to prevent Next.js 500 Serialization Error
      const safeData = { ...data };
      for (const key in safeData) {
        if (safeData[key] && typeof safeData[key] === "object" && safeData[key].seconds !== undefined) {
           safeData[key] = safeData[key].seconds * 1000;
        }
      }

      validProducts.push({
        id: document.id,
        ...safeData,
        createdAt: data.createdAt?.seconds ? data.createdAt.seconds * 1000 : new Date(data.createdAt || 0).getTime(),
      });
    } else {
      expiredDocs.push({ id: document.id, originalPrice: data.originalPrice });
    }
  });

  if (expiredDocs.length > 0) {
    try {
      const batch = writeBatch(db);
      expiredDocs.forEach(expired => {
        const docRef = doc(db, "products", expired.id);
        batch.update(docRef, {
          price: Number(expired.originalPrice), 
          originalPrice: null,
          isSale: false,
          campaignType: null,
          saleEndDate: null
        });
      });
      await batch.commit(); 
    } catch (error) {
      console.error("Failed to lazy revert expired deals:", error);
    }
  }

  return (
    <div className="min-h-screen bg-transparent pb-12 pt-4 font-sans selection:bg-[#FF6A00] selection:text-white">
      <div className="w-full max-w-[1400px] mx-auto px-4">

        <div className="w-full bg-gradient-to-r from-[#FF6A00] to-[#e65f00] rounded-xl p-8 mb-8 text-white shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/4 -translate-y-1/4 pointer-events-none">
            <svg width="300" height="300" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" />
            </svg>
          </div>
          
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
              {pageTitle}
            </h1>
            <p className="text-white/90 font-medium max-w-xl text-sm sm:text-base">
              Grab these limited-time offers before they expire. Fast local delivery available on all items in Kabale.
            </p>
          </div>
        </div>

        {validProducts.length > 0 ? (
          <CategoryProductFeed 
             initialProducts={validProducts} 
             categoryName="deals" 
             title={pageTitle} 
          />
        ) : (
          <div className="w-full bg-white dark:bg-[#151515] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-12 flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-800">
              <ZapOff className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            </div>
            
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-3">
              Currently No Active Deals
            </h2>
            
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-md mb-8">
              The deals for this campaign have either sold out or expired. Keep an eye out—we launch new flash sales and massive discounts regularly!
            </p>

            <Link 
              href="/"
              className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3.5 rounded-md font-black uppercase tracking-widest text-xs hover:bg-[#FF6A00] dark:hover:bg-[#FF6A00] dark:hover:text-white transition-all shadow-sm active:scale-95 flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Return Home
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
