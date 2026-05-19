export const dynamic = "force-dynamic"; // Allows ?campaign= URL parameters to work safely

import { collection, query, where, getDocs, orderBy, limit, doc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import CategoryProductFeed from "@/components/CategoryProductFeed";
import Link from "next/link";
import { ZapOff, Home } from "lucide-react";

// Helper to deep-clean any nested Firebase Timestamp objects into primitive numbers
function sanitizeDocument(obj: any): any {
  if (obj === null || typeof obj !== "object") return obj;

  // If it's an array, clean every item in it
  if (Array.isArray(obj)) {
    return obj.map(sanitizeDocument);
  }

  // If it's a Firestore Timestamp look-alike, flatten it immediately
  if (obj.seconds !== undefined && typeof obj.seconds === "number") {
    return obj.seconds * 1000;
  }

  const cloned: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = sanitizeDocument(obj[key]);
    }
  }
  return cloned;
}

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

  // Format the title beautifully based on dictionary mapping
  const pageTitle = campaignFilter 
    ? (campaignDisplayNames[campaignFilter] || campaignFilter.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
    : "All Active Deals";

  // Base query for live sales
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
  const validProducts: any[] = [];
  const expiredDocs: any[] = [];

  snap.docs.forEach(document => {
    const data = document.data();
    const endTime = new Date(data.saleEndDate || 0).getTime();

    if (endTime > now) {
      // Deep sanitize data to make it 100% compliant with Next.js serialization
      const cleanData = sanitizeDocument({
        id: document.id,
        ...data,
      });

      validProducts.push(cleanData);
    } else {
      expiredDocs.push({ id: document.id, originalPrice: data.originalPrice });
    }
  });

  // Background lazy revert execution if any items expired
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

        {/* Universal Banner Header */}
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

        {/* Product Display Feed Area */}
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
