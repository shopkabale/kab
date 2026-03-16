"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { optimizeImage } from "@/lib/utils"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore"; // 🔥 IMPORT FIRESTORE
import { db } from "@/lib/firebase/config";

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

          setProducts(filtered);
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
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-[#D97706] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="font-bold text-slate-500 animate-pulse">Searching Kabale Online for "{query}"...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Search Results</h1>
        <p className="text-slate-600 font-medium">
          Found {products.length} {products.length === 1 ? "result" : "results"} for <span className="text-[#D97706] font-bold">"{query}"</span>
        </p>
      </div>

      {products.length === 0 ? (
        // 🔥 THE NEW INTENT-CATCHER UI 🔥
        <div className="bg-white rounded-3xl p-6 sm:p-12 text-center border border-slate-200 shadow-sm max-w-2xl mx-auto">
          <span className="text-6xl mb-4 block">🕵️‍♂️</span>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">We couldn't find "{query}"</h2>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            But don't give up yet! New items are posted by locals every single day.
          </p>

          {alertSuccess ? (
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-2xl p-6 mb-8 animate-in fade-in zoom-in duration-300">
              <span className="text-4xl block mb-2">✅</span>
              <h3 className="font-bold text-lg mb-1">Alert Setup Complete!</h3>
              <p className="text-sm">We'll message you at <strong>{contactInfo}</strong> the exact moment someone posts this item in Kabale.</p>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 mb-8 text-left shadow-inner">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🔔</span>
                <h3 className="font-bold text-slate-900 text-lg">Want us to notify you?</h3>
              </div>
              <p className="text-sm text-slate-600 mb-5">
                Drop your WhatsApp number or email below. The second a seller lists "{query}", you'll be the first to know.
              </p>
              
              <form onSubmit={handleCreateAlert} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  required
                  placeholder="e.g. 07... or email"
                  className="flex-grow px-4 py-3.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#D97706] outline-none shadow-sm"
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

          <Link href="/" className="inline-block text-slate-500 font-bold hover:text-[#D97706] transition-colors">
            ← Continue browsing categories
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => {
            const optimizedImageUrl = product.images?.[0] ? optimizeImage(product.images[0]) : null;

            return (
              <Link key={product.id} href={`/product/${product.publicId || product.id}`} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 group flex flex-col">
                {/* Product Image */}
                <div className="aspect-square relative bg-slate-100 overflow-hidden">
                  {optimizedImageUrl ? (
                    <Image 
                      src={optimizedImageUrl} 
                      alt={product.title || product.name} 
                      fill 
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-300">No Image</div>
                  )}
                </div>

                {/* Product Details */}
                <div className="p-4 flex flex-col flex-grow">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{product.category.replace(/_/g, ' ')}</span>
                  <h3 className="font-bold text-slate-900 line-clamp-2 mb-2 group-hover:text-[#D97706] transition-colors">
                    {product.title || product.name}
                  </h3>
                  <div className="mt-auto pt-2">
                    <p className="text-lg font-black text-[#D97706]">UGX {Number(product.price).toLocaleString()}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Main Page Component wrapped in Suspense for Next.js build requirements
export default function SearchPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center font-bold text-slate-500">Preparing search...</div>}>
      <SearchResults />
    </Suspense>
  );
}
