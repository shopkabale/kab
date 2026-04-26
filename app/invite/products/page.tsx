"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { FaCheckCircle, FaLink, FaArrowLeft, FaShieldAlt } from "react-icons/fa";

export default function CreatorStudioPage() {
  const { user, loading } = useAuth();
  const [copied, setCopied] = useState<string | null>(null);
  const [promotableProducts, setPromotableProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchProducts = async () => {
      setProductsLoading(true);
      try {
        const res = await fetch(`/api/affiliate/products?page=${currentPage}`);
        if (res.ok) {
          const data = await res.json();
          setPromotableProducts(data.products || []);
          setHasMore(data.hasMore);
        }
      } catch (error) {
        console.error("Failed to load affiliate products", error);
      } finally {
        setProductsLoading(false);
      }
    };
    fetchProducts();
  }, [user, currentPage]);

  const calculateCommission = (price: number) => {
    if (price < 5000) return 300;
    return Math.min(Math.floor(price * 0.10), 3000);
  };

  const handleCopyLink = (link: string, id: string) => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
        <FaShieldAlt className="text-[#D97706] text-3xl animate-pulse" />
      </div>
    );
  }

  const referralCode = user.referralCode || "PENDING";

  return (
    <div className="w-full min-h-screen bg-slate-50 pb-10">
      <div className="max-w-[480px] md:max-w-2xl mx-auto p-4 pt-6">
        
        <Link href="/invite" className="inline-flex items-center gap-2 text-slate-500 font-bold text-[12px] mb-6 hover:text-slate-900 transition-colors uppercase tracking-wider">
          <FaArrowLeft /> Back to Dashboard
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900">Creator Studio</h1>
          <p className="text-slate-500 text-[14px] font-medium mt-1">Generate affiliate links for specific items to boost your conversions.</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm w-full">
          <div className="flex flex-col gap-3">
            {productsLoading ? (
               <div className="py-12 text-center text-slate-400 text-sm animate-pulse font-medium">Loading catalog...</div>
            ) : promotableProducts.length === 0 ? (
               <div className="py-12 text-center text-slate-400 text-sm font-medium">No official products found.</div>
            ) : (
              promotableProducts.map((product) => {
                const productLink = `https://www.kabaleonline.com/product/${product.publicId || product.id}?ref=${referralCode}`;
                const isCopied = copied === product.id;
                const estCommission = calculateCommission(product.price);

                return (
                  <div key={product.id} className="flex gap-3 border border-slate-100 p-2.5 rounded-xl hover:bg-slate-50 transition-colors items-center">
                    <div className="w-16 h-16 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h3 className="text-[13px] font-black text-slate-900 truncate">{product.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-slate-400 line-through font-medium">UGX {product.price.toLocaleString()}</span>
                        <span className="text-[10px] font-black text-green-700 bg-green-100 px-1.5 py-0.5 rounded tracking-wide uppercase">Earn {estCommission}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleCopyLink(productLink, product.id)}
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all border ${isCopied ? 'bg-green-100 text-green-600 border-transparent' : 'bg-slate-50 text-slate-400 hover:bg-[#D97706] hover:text-white hover:border-transparent border-slate-200'}`}
                    >
                      {isCopied ? <FaCheckCircle /> : <FaLink />}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex justify-between items-center mt-5 pt-3 border-t border-slate-100">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1 || productsLoading} className="text-[12px] font-black text-slate-500 hover:text-slate-900 transition-colors disabled:opacity-30">
              &larr; Prev
            </button>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Page {currentPage}</span>
            <button onClick={() => setCurrentPage(p => p + 1)} disabled={!hasMore || productsLoading} className="text-[12px] font-black text-[#D97706] hover:text-amber-700 transition-colors disabled:opacity-30">
              Next &rarr;
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
