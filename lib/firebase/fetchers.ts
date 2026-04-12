import { unstable_cache } from "next/cache";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

// We wrap your entire homepage fetching logic in the cache shield.
// It will only execute if the cache is empty or if you wipe the 'products' tag.
export const getCachedHomepageData = unstable_cache(
  async () => {
    // console.log("🔥 FETCHING FROM FIREBASE: This should only happen when cache is broken!");

    const productsRef = collection(db, "products");

    // 1. DEFINE ALL QUERIES
    const basePoolQ = query(productsRef, orderBy("views", "desc"), limit(50));
    const trendingQ = query(productsRef, orderBy("aiScore", "desc"), limit(10));
    const officialQ = query(productsRef, where("isAdminUpload", "==", true), limit(12));
    const approvedQ = query(productsRef, where("isApprovedQuality", "==", true), limit(12));
    const boostedQ = query(productsRef, where("isBoosted", "==", true), limit(6));
    const featuredQ = query(productsRef, where("isFeatured", "==", true), limit(6));
    const latestQ = query(productsRef, orderBy("createdAt", "desc"), limit(12));
    const ladiesQ = query(productsRef, where("ladies_home", "==", true), limit(12));
    const watchQ = query(productsRef, where("watch_home", "==", true), limit(12));
    const electronicsQ = query(productsRef, where("category", "==", "electronics"), limit(12));
    const studentQ = query(productsRef, where("category", "==", "student_item"), limit(12));
    const agriQ = query(productsRef, where("category", "==", "agriculture"), limit(12));
    
    // 🔥 NEW: Dedicated query ONLY for Hero products (Guaranteeing up to 5)
    const heroQ = query(productsRef, where("isHero", "==", true), limit(5));

    // 2. PARALLEL FETCHING
    const [
      basePoolSnap, trendingSnap, officialSnap, approvedSnap, 
      boostedSnap, featuredSnap, latestSnap, ladiesSnap, 
      watchSnap, electronicsSnap, studentSnap, agriSnap,
      heroSnap // 🔥 Added to Promise.all
    ] = await Promise.all([
      getDocs(basePoolQ), getDocs(trendingQ), getDocs(officialQ), getDocs(approvedQ),
      getDocs(boostedQ), getDocs(featuredQ), getDocs(latestQ), getDocs(ladiesQ),
      getDocs(watchQ), getDocs(electronicsQ), getDocs(studentQ), getDocs(agriQ),
      getDocs(heroQ) // 🔥 Execute Hero Query
    ]);

    // 3. MAP DATA TO ARRAYS
    // We map them here so Next.js caches pure JSON arrays, saving processing time on the homepage.
    return {
      basePool: basePoolSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)),
      trendingProducts: trendingSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)),
      officialProducts: officialSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)),
      approvedProducts: approvedSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)),
      boostedProducts: boostedSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)),
      featuredProducts: featuredSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)),
      latestProducts: latestSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)),
      ladiesProducts: ladiesSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)),
      watchProducts: watchSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)),
      electronicsProducts: electronicsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)),
      studentProducts: studentSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)),
      agriProducts: agriSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)),
      heroProducts: heroSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)), // 🔥 Export Hero Array
    };
  },
  ['kabale-homepage-data'], // 4. The unique internal key for this data
  {
    revalidate: 86400, // Fallback: rebuild automatically once a day just in case
    tags: ['products'] // 🔥 THE MAGIC TAG: We hit this tag from our API to clear the cache instantly
  }
);
