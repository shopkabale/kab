import useSWR from "swr";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config"; // 👉 Adjust this path if your db export is different

const fetchLatestProducts = async () => {
  const productsRef = collection(db, "products");
  // Grabbing the 10 absolute newest items
  const q = query(productsRef, orderBy("createdAt", "desc"), limit(10)); 
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export function useLiveFeed(fallbackData: any[] = []) {
  const { data, error, isLoading, isValidating } = useSWR(
    "live-feed-products", 
    fetchLatestProducts,
    {
      fallbackData,           // Uses SSR data first so there is NO loading blank screen
      refreshInterval: 30000, // Silently checks Firebase every 30 seconds for new drops
      revalidateOnFocus: true,// Instantly checks if they leave the tab and come back
    }
  );

  return {
    liveProducts: data,
    isLoading,
    isError: error,
    isValidating
  };
}
