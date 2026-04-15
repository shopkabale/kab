import type { Metadata } from "next";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import OfficialProductFeed from "@/components/OfficialProductFeed";
import LeftSidebar from "@/components/LeftSidebar";

export const dynamic = "force-dynamic";

// ==========================================
// SEO & OPEN GRAPH METADATA
// ==========================================
export const metadata: Metadata = {
  title: "Official Store | Kabale Online",
  description: "Shop premium, verified products sold directly by Kabale Online. Guaranteed quality, secure mobile payments, and fast delivery across Kabale and Kigezi.",
  keywords: [
    "Kabale Online Official Store", 
    "verified products Kabale", 
    "secure shopping Uganda", 
    "Kigezi e-commerce", 
    "buy premium items Kabale"
  ],
  openGraph: {
    title: "Official Store | Kabale Online",
    description: "Shop premium, verified products sold directly by Kabale Online. Guaranteed quality, secure mobile payments, and fast delivery.",
    url: "https://kabaleonline.com/officialStore",
    siteName: "Kabale Online",
    images: [
      {
        url: "/official-og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Kabale Online Official Store",
      },
    ],
    locale: "en_UG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Official Store | Kabale Online",
    description: "Shop premium, verified products sold directly by Kabale Online. Guaranteed quality and fast delivery.",
    images: ["/official-og-image.jpg"],
  },
};

const PAGE_SIZE = 20;

export default async function OfficialStorePage() {
  const officialQ = query(
    collection(db, "products"), 
    where("isAdminUpload", "==", true),
    orderBy("createdAt", "desc"),
    limit(PAGE_SIZE)
  );

  const officialSnap = await getDocs(officialQ);

  const initialProducts = officialSnap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : (new Date(data.createdAt || 0).getTime()),
      updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (new Date(data.updatedAt || 0).getTime()),
    };
  });

  return (
    <div className="min-h-screen bg-transparent pb-12 pt-2 sm:pt-4 font-sans selection:bg-[#D97706] selection:text-white overflow-x-hidden">
      <div className="w-full max-w-[1400px] mx-auto px-0 sm:px-4">
        
        {/* DESKTOP SPLIT GRID */}
        <div className="flex flex-col md:flex-row gap-4 w-full">

          {/* LEFT SIDEBAR AREA */}
          <div className="hidden md:flex flex-col gap-4 w-[220px] lg:w-[240px] shrink-0 sticky top-[110px] h-max z-10">
            <LeftSidebar />
          </div>

          {/* CENTER CONTENT */}
          <div className="flex-grow min-w-0 flex flex-col w-full gap-4">
            
            {/* PREMIUM STORE BANNER */}
            <div className="bg-slate-900 dark:bg-black rounded-none md:rounded-md p-6 sm:p-8 md:p-10 relative overflow-hidden flex flex-col justify-center shadow-sm border-b-4 md:border-b border-[#D97706] select-none">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#D97706]/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10">
                <span className="inline-block bg-[#D97706] text-white px-3 py-1.5 rounded-sm text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-3 sm:mb-4 shadow-md">
                  Verified by Kabale Online
                </span>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-2 sm:mb-3 tracking-tight">
                  Official Store
                </h1>
                <p className="text-slate-400 text-xs sm:text-sm md:text-base font-medium max-w-2xl leading-relaxed">
                  Shop premium, verified products sold directly by us. Guaranteed quality, secure mobile payments, and fast delivery across Kabale and Kigezi.
                </p>
              </div>
            </div>

            {/* PRODUCT GRID FEED */}
            {/* Wrapper is totally transparent. The component itself forms the White Island. */}
            <div className="w-full">
              <OfficialProductFeed initialProducts={initialProducts} />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
