"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndFilterProducts = async () => {
      setLoading(true);
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
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
          <span className="text-6xl mb-4 block">🕵️‍♂️</span>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">No exact matches found</h2>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">We couldn't find anything matching "{query}". Try checking your spelling or using more general terms.</p>
          <Link href="/" className="bg-[#D97706] text-white px-8 py-3 rounded-xl font-bold hover:bg-amber-600 transition-colors shadow-md">
            Browse All Categories
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <Link key={product.id} href={`/product/${product.publicId || product.id}`} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 group flex flex-col">
              {/* Product Image */}
              <div className="aspect-square relative bg-slate-100 overflow-hidden">
                {product.images?.[0] ? (
                  <Image 
                    src={product.images[0]} 
                    alt={product.title || product.name} 
                    fill 
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
          ))}
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
