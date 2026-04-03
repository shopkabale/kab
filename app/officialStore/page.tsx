import type { Metadata } from "next";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import OfficialProductFeed from "@/components/OfficialProductFeed";

// Forces the page to always fetch the freshest inventory
export const dynamic = "force-dynamic";

// ==========================================
// SEO & OPEN GRAPH METADATA
// ==========================================
export const metadata: Metadata = {
  title: "Official Store ⭐ | Kabale Online",
  description: "Shop premium, verified products sold directly by Kabale Online. Guaranteed quality, secure mobile payments, and fast delivery across Kabale and Kigezi.",
  keywords: [
    "Kabale Online Official Store", 
    "verified products Kabale", 
    "secure shopping Uganda", 
    "Kigezi e-commerce", 
    "buy premium items Kabale"
  ],
  openGraph: {
    title: "Official Store ⭐ | Kabale Online",
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
    title: "Official Store ⭐ | Kabale Online",
    description: "Shop premium, verified products sold directly by Kabale Online. Guaranteed quality and fast delivery.",
    images: ["/official-og-image.jpg"],
  },
};

const PAGE_SIZE = 20;

export default async function OfficialStorePage() {
  // Fetch INITIAL batch of products where the admin uploaded them directly
  const officialQ = query(
    collection(db, "products"), 
    where("isAdminUpload", "==", true),
    orderBy("createdAt", "desc"), // Ensures newest are first
    limit(PAGE_SIZE)
  );

  const officialSnap = await getDocs(officialQ);
  
  // Clean data so it can be passed safely to the Client Component
  const initialProducts = officialSnap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      // Convert Timestamps to numbers to prevent Next.js serialization errors
      createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : data.createdAt
    };
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

      {/* PRODUCT GRID USING THE NEW CLIENT FEED */}
      <section className="w-full max-w-[1200px] mx-auto px-3 sm:px-4 mt-8 md:mt-12">
        <OfficialProductFeed initialProducts={initialProducts} />
      </section>

    </div>
  );
}
