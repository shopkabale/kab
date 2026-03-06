"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import Image from "next/image";

export default function OfficialProductsManager() {
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOfficialProducts = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        
        // Filter ONLY products uploaded by the Admin/Official Store
        const officialItems = data.products.filter((p: any) => 
          p.isAdminUpload === true || 
          (p.sellerName && (p.sellerName.toLowerCase().includes("admin") || p.sellerName.toLowerCase().includes("official")))
        );
        
        setProducts(officialItems);
      } catch (error) {
        console.error("Failed to fetch products", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === "admin") {
      fetchOfficialProducts();
    }
  }, [user]);

  if (authLoading || loading) return <div className="py-20 text-center font-bold text-slate-500 animate-pulse">Loading Official Inventory...</div>;
  if (!user || user.role !== "admin") return null;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Official Store Manager</h1>
          <p className="text-slate-500 font-medium mt-1">Manage Kabale Online's internal inventory</p>
        </div>
        <Link href="/admin/upload" className="bg-[#D97706] text-white px-6 py-3 rounded-xl font-bold hover:bg-amber-600 transition-all shadow-md flex items-center gap-2">
          <span>+</span> Add New Item
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm uppercase tracking-wider text-slate-500">
                <th className="p-4 font-bold">Product</th>
                <th className="p-4 font-bold">Price</th>
                <th className="p-4 font-bold">Stock</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">No official products found.</td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden relative flex-shrink-0 border border-slate-200">
                          {product.images?.[0] ? (
                            <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                          ) : (
                            <span className="text-xs text-slate-400 absolute inset-0 flex items-center justify-center">No Img</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 line-clamp-1">{product.name || product.title}</p>
                          <p className="text-xs text-slate-500 uppercase tracking-widest">{product.publicId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-slate-700">UGX {Number(product.price).toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${Number(product.stock) > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {product.stock || 0} in stock
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">Active</span>
                    </td>
                    <td className="p-4 text-right">
                      {/* THIS IS THE MAGIC LINK: It sends them to the upload page with the ID attached! */}
                      <Link 
                        href={`/admin/upload?edit=${product.publicId}`}
                        className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 text-slate-600 hover:bg-[#D97706] hover:text-white transition-colors shadow-sm"
                        title="Edit Official Item"
                      >
                        ✏️
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}