export const dynamic = "force-dynamic";

import { Metadata } from "next";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import CategoryProductFeed from "@/components/CategoryProductFeed";
import Link from "next/link";
import { ZapOff, Home, Zap } from "lucide-react";
import DealCountdown from "@/components/DealCountdown";

// ==========================================
// 1. DYNAMIC SEO DICTIONARIES
// ==========================================
const campaignDisplayNames: Record<string, string> = {
  "flash-sales": "Flash Sales",
  "weekend-deals": "Weekend Deals",
  "clearance": "Clearance Sale",
  "student-deals": "Student Deals",
  "mega-sale": "Mega Sale"
};

const campaignDescriptions: Record<string, string> = {
  "flash-sales": "Grab massive discounts before time runs out! Shop the best flash sales on electronics and accessories in Kabale.",
  "weekend-deals": "Exclusive weekend price drops! Upgrade your gadgets with fast local delivery from Kabale Online.",
  "clearance": "Huge clearance markdowns! Get these products at unbeatable prices before they are gone forever.",
  "student-deals": "Special student discounts for campus essentials. Save big on tech and accessories for your hostel.",
  "mega-sale": "Our biggest deals of the season! Massive savings on top-rated electronics and more."
};

// ==========================================
// 2. DYNAMIC METADATA GENERATOR (OG & SEO)
// ==========================================
export async function generateMetadata({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}): Promise<Metadata> {
  const rawCampaign = searchParams?.campaign;
  const campaignFilter = Array.isArray(rawCampaign) ? rawCampaign[0] : rawCampaign;

  // Generate exact title
  const baseTitle = campaignFilter && campaignDisplayNames[campaignFilter]
    ? campaignDisplayNames[campaignFilter]
    : campaignFilter
    ? campaignFilter.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    : "Active Deals & Discounts";

  const pageTitle = `${baseTitle} | Kabale Online`;

  // Generate exact description
  const description = campaignFilter && campaignDescriptions[campaignFilter]
    ? campaignDescriptions[campaignFilter]
    : "Discover the best deals, discounts, and flash sales on Kabale Online. Fast local delivery available on all items in Kabale.";

  const currentUrl = `https://www.kabaleonline.com/deals${campaignFilter ? `?campaign=${campaignFilter}` : ''}`;
  
  // 🔥 BUILD THE DYNAMIC OG IMAGE URL FOR THE DEALS PAGE
  const ogImage = `https://www.kabaleonline.com/api/og?title=${encodeURIComponent(baseTitle)}&desc=${encodeURIComponent(description)}`;

  return {
    title: pageTitle,
    description: description,
    alternates: {
      canonical: currentUrl,
    },
    openGraph: {
      title: pageTitle,
      description: description,
      url: currentUrl,
      siteName: "Kabale Online",
      images: [{ url: ogImage, width: 1200, height: 630, alt: baseTitle }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: description,
      images: [ogImage],
    },
  };
}

// ==========================================
// 3. MAIN PAGE COMPONENT
// ==========================================
export default async function DealsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const rawCampaign = searchParams?.campaign;
  const campaignFilter = Array.isArray(rawCampaign) ? rawCampaign[0] : rawCampaign;

  const pageTitle = campaignFilter && campaignDisplayNames[campaignFilter]
    ? campaignDisplayNames[campaignFilter]
    : campaignFilter
    ? campaignFilter.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
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
  const validProducts: any[] = [];
  let earliestEndDate = "";

  // 1. PURE READ-ONLY FILTERING 
  snap.docs.forEach(document => {
    const data = document.data();
    const endTime = new Date(data.saleEndDate || 0).getTime();

    if (endTime > now) {
      validProducts.push({
        id: document.id,
        publicId: data.publicId || document.id,
        name: data.name || data.title || "Product",
        price: Number(data.price) || 0,
        originalPrice: Number(data.originalPrice) || 0,
        images: Array.isArray(data.images) ? data.images : [],
        category: data.category || "electronics",
        status: data.status || "available",
        stock: data.stock !== undefined ? Number(data.stock) : 1,
        isSale: Boolean(data.isSale),
        campaignType: data.campaignType || "",
        saleEndDate: data.saleEndDate || "",
        createdAt: data.createdAt?.seconds ? data.createdAt.seconds * 1000 : Date.now(),
      });

      if (!earliestEndDate || new Date(data.saleEndDate) < new Date(earliestEndDate)) {
        earliestEndDate = data.saleEndDate;
      }
    }
  });

  // STRUCTURED DATA FOR GOOGLE SEARCH
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": pageTitle,
    "description": campaignFilter && campaignDescriptions[campaignFilter] ? campaignDescriptions[campaignFilter] : "Active deals on Kabale Online",
    "url": `https://www.kabaleonline.com/deals${campaignFilter ? `?campaign=${campaignFilter}` : ''}`,
  };

  return (
    <div className="min-h-screen bg-transparent pb-12 pt-4 font-sans selection:bg-[#FF6A00] selection:text-white">
      {/* INJECT JSON-LD FOR GOOGLE */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="w-full max-w-[1400px] mx-auto px-4">

        {/* Universal Banner Header */}
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
              {campaignFilter && campaignDescriptions[campaignFilter] 
                ? campaignDescriptions[campaignFilter] 
                : "Grab these limited-time offers before they expire. Fast local delivery available."}
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
        {validProducts.length > 0 ? (
          <CategoryProductFeed 
             initialProducts={validProducts} 
             categoryName="deals" 
             title={pageTitle as string} 
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
