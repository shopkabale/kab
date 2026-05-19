export const dynamic = "force-dynamic";

import { collection, query, where, getDocs, orderBy, limit, doc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import CategoryProductFeed from "@/components/CategoryProductFeed";
import Link from "next/link";
import { ZapOff, Home, Zap } from "lucide-react";
import DealCountdown from "@/components/DealCountdown";

// Map slug terms to elegant UI headers
const campaignDisplayNames: Record<string, string> = {
  "flash-sales": "Flash Sales",
  "weekend-deals": "Weekend Deals",
  "clearance": "Clearance Sale",
  "student-deals": "Student Deals",
  "mega-sale": "Mega Sale"
};

export default async function DealsPage({
  searchParams,
}: {
  searchParams: { campaign?: string | string[] };
}) {
  const param = searchParams.campaign;
  const campaignFilter = Array.isArray(param) ? param[0] : param;

  const pageTitle = campaignFilter 
    ? (campaignDisplayNames[campaignFilter] || campaignFilter.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
    : "All Active Deals";

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
  
  const now = Date.now();
  let rawValidProducts: any[] = [];
  const expiredDocs: any[] = [];
  let earliestEndDate = "";

  snap.docs.forEach(document => {
    const data = document.data();
    const endTime = new Date(data.saleEndDate || 0).getTime();

    if (endTime > now) {
      // 🔥 THE FIX: Strictly map only the primitive values Next.js can safely serialize
      rawValidProducts.push({
        id: document.id,
        publicId: data.publicId || document.id,
        name: data.name || data.title || "Product",
        price: Number(data.price) || 0,
        originalPrice: Number(data.originalPrice) || 0,
        images: Array.isArray(data.images) ? data.images : [],
        category: data.category || "electronics",
        status: data.status || "available",
        stock: data.stock !== undefined ? Number(data.stock) : 1,
        isSale: data.isSale || false,
        campaignType: data.campaignType || "",
        saleEndDate: data.saleEndDate || "",
        createdAt: data.createdAt?.seconds ? data.createdAt.seconds * 1000 : Date.now(),
      });

      // Find the earliest end date for the Master Clock
      if (!earliestEndDate || new Date(data.saleEndDate) < new Date(earliestEndDate)) {
        earliestEndDate = data.saleEndDate;
      }
    } else {
      expiredDocs.push({ id: document.id, originalPrice: data.originalPrice });
    }
  });

  // 🔥 THE NUCLEAR OPTION: A final deep clone to strip absolutely everything Firebase-related
  const safeProducts = JSON.parse(JSON.stringify(rawValidProducts));

  // Background lazy revert execution
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

        {/* Universal Banner Header matching the screenshot vibe */}
        <div className="w-full bg-gradient-to-r from-[#FF6A00] to-[#e65f00] rounded-xl p-6 sm:p-8 mb-8 text-white shadow-md relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/4 -translate-y-1/4 pointer-events-none">
            <svg width="300" height="300" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" />
            </svg>
          </div>
          
          <div className="relative z-10 flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-6 h-6 fill-white animate-pulse" />
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight">
                {pageTitle}
              </h1>
            </div>
            <p className="text-white/90 font-medium max-w-xl text-sm sm:text-base">
              Grab these limited-time offers before they expire. Fast local delivery available.
            </p>
          </div>

          {/* Master Ticking Clock */}
          {earliestEndDate && (
            <div className="relative z-10 self-start sm:self-center">
              <DealCountdown endTime={earliestEndDate} />
            </div>
          )}
        </div>

        {/* Product Display Feed Area */}
        {safeProducts.length > 0 ? (
          <CategoryProductFeed 
             initialProducts={safeProducts} 
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
