import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import CategoryProductFeed from "@/components/CategoryProductFeed";

export const revalidate = 60; // Revalidate every minute so expired deals disappear fast

export default async function DealsPage({
  searchParams,
}: {
  searchParams: { campaign?: string };
}) {
  const campaignFilter = searchParams.campaign;

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

  // If a specific campaign is requested, filter further
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
  const products = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return (
    <div className="min-h-screen bg-transparent pb-12 pt-4 font-sans">
      <div className="w-full max-w-[1400px] mx-auto px-4">
        
        {/* Universal Header */}
        <div className="w-full bg-gradient-to-r from-[#FF6A00] to-[#e65f00] rounded-xl p-8 mb-8 text-white shadow-md">
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
            {pageTitle}
          </h1>
          <p className="text-white/80 font-medium max-w-xl">
            Grab these limited-time offers before they expire. Fast local delivery available on all items.
          </p>
        </div>

        {/* Reusing your feed component to display the grid */}
        <CategoryProductFeed 
           initialProducts={products} 
           categoryName="deals" 
           title={pageTitle} 
        />
        
      </div>
    </div>
  );
}
