"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { Product } from "@/types";

export default function AdminProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  // Pagination states
  const [lastDocId, setLastDocId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchProducts = async (isLoadMore = false) => {
    try {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      // Append the last document ID to the URL if we are loading more
      const url = new URL("/api/products", window.location.origin);
      if (isLoadMore && lastDocId) {
        url.searchParams.append("cursor", lastDocId);
      }
      url.searchParams.append("limit", "25"); // Ask for 25 at a time

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        const fetchedProducts = data.products || [];

        if (fetchedProducts.length < 25) {
          setHasMore(false); // No more products left in database
        }

        if (isLoadMore) {
          setProducts(prev => [...prev, ...fetchedProducts]);
        } else {
          setProducts(fetchedProducts);
        }

        if (fetchedProducts.length > 0) {
          setLastDocId(fetchedProducts[fetchedProducts.length - 1].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ============================================================================
  // INLINE CATEGORY QUICK-EDIT
  // ============================================================================
  const handleCategoryChange = async (productId: string, newCategory: string) => {
    if (!user || user.role !== "admin") return;
    setUpdatingId(productId);

    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: newCategory, adminId: user.id }),
      });

      if (res.ok) {
        // Update the UI instantly without reloading
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, category: newCategory } : p));
      } else {
        alert("Failed to update category.");
      }
    } catch (error) {
      console.error(error);
      alert("Error updating category.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleForceDelete = async (productId: string) => {
    if (!user || user.role !== "admin") return;
    const confirm = window.confirm("ADMIN ACTION: Are you sure you want to permanently delete this product from the marketplace?");
    if (!confirm) return;

    try {
      const res = await fetch(`/api/admin/products/${productId}?adminId=${user.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== productId));
        alert("Product permanently removed.");
      } else {
        alert("Failed to delete product.");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 md:pb-0">
      <div className="mb-8 border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-extrabold text-slate-900">Product Management</h1>
        <p className="text-slate-600 mt-2 font-medium">Review user uploads, fix categories, and remove spam.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-6 py-4">Item</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Quick Category Fix</th>
                <th className="px-6 py-4">Seller</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">Loading products...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">No products found in the marketplace.</td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden relative flex-shrink-0 border border-slate-200">
                          {product.images && product.images.length > 0 ? (
                            <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                          ) : (
                            <span className="text-[8px] text-slate-400 absolute inset-0 flex items-center justify-center">No Img</span>
                          )}
                        </div>
                        <div>
                          <Link href={`/item/${product.publicId || product.id}`} target="_blank" className="font-bold text-slate-900 hover:text-[#D97706] line-clamp-1">
                            {product.name}
                          </Link>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{product.publicId || product.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">
                      UGX {Number(product.price).toLocaleString()}
                    </td>
                    
                    {/* Inline Category Dropdown */}
                    <td className="px-6 py-4">
                      <select 
                        disabled={updatingId === product.id}
                        value={product.category || "uncategorized"}
                        onChange={(e) => handleCategoryChange(product.id, e.target.value)}
                        className={`text-xs font-bold rounded-lg border px-2 py-1.5 outline-none transition-colors ${updatingId === product.id ? 'opacity-50' : 'border-slate-300 bg-white hover:border-[#D97706]'}`}
                      >
                        <option value="uncategorized" disabled>Select...</option>
                        <option value="electronics">Electronics</option>
                        <option value="agriculture">Agriculture</option>
                        <option value="student_item">Student Market</option>
                      </select>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-700 truncate max-w-[120px]">{product.sellerName || "Unknown"}</p>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap space-x-2">
                      {/* Full Edit Link */}
                      <Link
                        href={`/admin/upload?edit=${product.publicId || product.id}`}
                        className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg transition-colors inline-block"
                      >
                        Edit Full
                      </Link>
                      <button
                        onClick={() => handleForceDelete(product.id)}
                        className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Load More Button */}
      {!loading && hasMore && (
        <div className="flex justify-center mb-8">
          <button 
            onClick={() => fetchProducts(true)}
            disabled={loadingMore}
            className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-70 flex items-center gap-2 shadow-sm"
          >
            {loadingMore ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Loading...</>
            ) : "Load Next 25 Products"}
          </button>
        </div>
      )}
    </div>
  );
}
