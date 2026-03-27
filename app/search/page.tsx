"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { optimizeImage } from "@/lib/utils"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
// 🔥 IMPORT HOMEPAGE PRODUCT SECTION
import ProductSection from "@/components/ProductSection";

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔥 NEW STATE FOR THE "NOTIFY ME" FEATURE
  const [contactInfo, setContactInfo] = useState("");
  const [isSubmittingAlert, setIsSubmittingAlert] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState(false);

  useEffect(() => {
    const fetchAndFilterProducts = async () => {
      setLoading(true);
      setAlertSuccess(false); // Reset success state on new search
      setContactInfo("");
      try {
        const res = await fetch("/api/products");
        const data = await res.json();

        if (data.products) {
          const searchTerm = query.toLowerCase();
          const filtered = data.products.filter((product: any) => {
            const titleMatch = (product.title || product.name || "").toLowerCase().includes(searchTerm);
            const categoryMatch = (product.category || "").toLowerCase().includes(searchTerm);
            const descMatch = (product.description || "").toLowerCase().includes(searchTerm);

            return titleMatch || categoryMatch || descMatch;
          });

          // 🔥 OPTIMIZE IMAGES BEFORE SETTING STATE
          const optimizedFilteredProducts = filtered.map((product: any) => {
            if (!product.images || product.images.length === 0) return product;
            return {
              ...product,
              images: product.images.map((img: string) => optimizeImage(img))
            };
          });

          setProducts(optimizedFilteredProducts);
        }
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    };

    if (query) {
      fetchAndFilterProducts();
    } else {
      setProducts([]);
      setLoading(false);
    }
  }, [query]);

  // 🔥 HANDLER FOR CREATING THE ALERT
  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactInfo.trim() || !query.trim()) return;

    setIsSubmittingAlert(true);
    try {
      await addDoc(collection(db, "search_alerts"), {
        query: query.toLowerCase(),
        contact: contactInfo,
        createdAt: serverTimestamp(),
        status: "active", // Can be used later to mark as "fulfilled"
      });
      setAlertSuccess(true);
    } catch (error) {
      console.error("Failed to create alert:", error);
      alert("Failed to set up alert. Please try again.");
    } finally {
      setIsSubmittingAlert(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center bg-slate-50 dark:bg-[#0a0a0a] min-h-screen">
        <div className="w-10 h-10 border-4 border-[#D97706] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="font-bold text-slate-500 animate-pulse">Searching Kabale Online for "{query}"...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a]">
      <div className="max-w-[1600px] mx-auto py-8 px-4 sm:px-6">
        
        {/* HEADER SECTION */}
        <div className="mb-8 max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">
            Search Results
          </h1>
          <p className="text-slate-600 dark:text-slate-400 font-medium text-sm md:text-base">
            Found {products.length} {products.length === 1 ? "result" : "results"} for <span className="text-[#D97706] font-bold">"{query}"</span>
          </p>
        </div>

        {products.length === 0 ? (
          // 🔥 THE INTENT-CATCHER UI 🔥
          <div className="bg-white dark:bg-[#111] rounded-3xl p-6 sm:p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm max-w-2xl mx-auto">
            <span className="text-6xl mb-4 block">🕵️‍♂️</span>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">We couldn't find "{query}"</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
              But don't give up yet! New items are posted by locals every single day.
            </p>

            {alertSuccess ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 rounded-2xl p-6 mb-8 animate-in fade-in zoom-in duration-300">
                <span className="text-4xl block mb-2">✅</span>
                <h3 className="font-bold text-lg mb-1">Alert Setup Complete!</h3>
                <p className="text-sm">We'll message you at <strong>{contactInfo}</strong> the exact moment someone posts this item in Kabale.</p>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 sm:p-8 mb-8 text-left shadow-inner">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🔔</span>
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">Want us to notify you?</h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">
                  Drop your WhatsApp number or email below. The second a seller lists "{query}", you'll be the first to know.
                </p>

                <form onSubmit={handleCreateAlert} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    required
                    placeholder="e.g. 07... or email"
                    className="flex-grow px-4 py-3.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#D97706] outline-none shadow-sm"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    disabled={isSubmittingAlert}
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingAlert}
                    className="bg-[#D97706] text-white px-8 py-3.5 rounded-xl font-bold hover:bg-amber-600 transition-colors shadow-md disabled:opacity-70 whitespace-nowrap flex justify-center items-center"
                  >
                    {isSubmittingAlert ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      "Notify Me"
                    )}
                  </button>
                </form>
              </div>
            )}

            <Link href="/" className="inline-block text-slate-500 dark:text-slate-400 font-bold hover:text-[#D97706] dark:hover:text-[#D97706] transition-colors">
              ← Continue browsing categories
            </Link>
          </div>
        ) : (
          // 🔥 REPLACED HARDCODED GRID WITH PRODUCTSECTION 🔥
          <div className="px-2 sm:px-0 pb-12">
            <ProductSection products={products} />
          </div>
        )}
      </div>
    </div>
  );
}

// Main Page Component wrapped in Suspense for Next.js build requirements
export default function SearchPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center font-bold text-slate-500 bg-slate-50 dark:bg-[#0a0a0a] min-h-screen">Preparing search...</div>}>
      <SearchResults />
    </Suspense>
  );
}
