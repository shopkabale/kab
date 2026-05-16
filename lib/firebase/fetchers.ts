import { unstable_cache } from "next/cache";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export const getCachedHomepageData = unstable_cache(
  async () => {
    const productsRef = collection(db, "products");

    // 1. DEFINE ALL QUERIES
    const basePoolQ = query(productsRef, orderBy("views", "desc"), limit(50));
    const trendingQ = query(productsRef, orderBy("views", "desc"), limit(12)); 
    const officialQ = query(productsRef, where("isOfficialStore", "==", true), limit(12));
    const latestQ = query(productsRef, orderBy("createdAt", "desc"), limit(12));
    const heroQ = query(productsRef, where("isHero", "==", true), limit(5));

    // NEW QUERIES FOR ELECTRONICS RESTRUCTURE
    const featuredCollectionQ = query(productsRef, where("isFeaturedCollection", "==", true), limit(12));
    const save4kQ = query(productsRef, where("isSave4k", "==", true), limit(12));
    // Curated by admin, keeping the UI predictable and controlled
    const handPickedQ = query(productsRef, where("isHandPicked", "==", true), limit(12));

    // 2. PARALLEL FETCHING
    const [
      basePoolSnap, trendingSnap, officialSnap, latestSnap, heroSnap,
      featuredCollectionSnap, save4kSnap, handPickedSnap
    ] = await Promise.all([
      getDocs(basePoolQ), getDocs(trendingQ), getDocs(officialQ), getDocs(latestQ), getDocs(heroQ),
      getDocs(featuredCollectionQ), getDocs(save4kQ), getDocs(handPickedQ)
    ]);

    // 3. MAP DATA TO ARRAYS
    return {
      basePool: basePoolSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)),
      trendingProducts: trendingSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)),
      officialProducts: officialSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)),
      latestProducts: latestSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)),
      heroProducts: heroSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)), 
      featuredCollection: featuredCollectionSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)),
      save4kProducts: save4kSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)),
      handPickedProducts: handPickedSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)),
    };
  },
  ['kabale-homepage-data'], 
  {
    revalidate: 86400, 
    tags: ['products'] 
  }
);
