"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { Product } from "@/types";

export default function VendorProductsPage() {
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user) return;
      try {
        const res = await fetch(`/api/products/user?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProducts();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const handleDelete = async (productId: string) => {
    if (!user) return;
    const isConfirmed = window.confirm("Are you sure you want to delete this product? This action cannot be undone.");
    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/products/${productId}?userId=${user.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((item) => item.id !== productId));
        alert("Product deleted successfully.");
      } else {
        alert("Failed to delete product.");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong while deleting.");
    }
  };

  // Filter products based on search input
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    product.publicId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const now = Date.now();

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Inventory Management</h1>
          <p className="text-slate-500 mt-1">Manage your {products.length} products, update stock, and boost visibility.</p>
        </div>
        <Link 
          href="/sell" 
          className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-sm transition-colors text-center"
        >
          + Add New Product
        </Link>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <span className="text-slate-400 text-xl ml-2">🔍</span>
        <input 
          type="text"
          placeholder="Search by product name or ID..."
          className="w-full outline-none bg-transparent text-slate-700 py-1"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Products Display */}
      {filteredProducts.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-12 text-center">
          <div className="text-4xl mb-4">📦</div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No products found</h3>
          <p className="text-slate-500 mb-6">You haven't added any items that match your search.</p>
          <Link href="/sell" className="text-amber-600 font-bold hover:underline">
            Post your first item now
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          
          {/* Desktop Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <div className="col-span-5">Product</div>
            <div className="col-span-2 text-center">Price</div>
            <div className="col-span-2 text-center">Stock</div>
            <div className="col-span-3 text-right pr-4">Actions</div>
          </div>

          {/* Product Rows */}
          <div className="divide-y divide-slate-100">
            {filteredProducts.map((product) => {
              const safeName = product.name || "Unnamed Item";
              const safePrice = Number(product.price) || 0;
              const safeStock = Number(product.stock) || 0;
              const safeId = product.publicId || product.id;
              const hasImages = Array.isArray(product.images) && product.images.length > 0;
              
              // Check active promotions based on the schema and timestamp logic
              const isFeatured = product.featured && product.featuredUntil && product.featuredUntil > now;
              const isUrgent = product.urgent && product.urgentUntil && product.urgentUntil > now;

              return (
                <div key={product.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center hover:bg-slate-50 transition-colors">
                  
                  {/* Product Info (Col 1-5) */}
                  <div className="col-span-1 md:col-span-5 flex items-center gap-4">
                    <div className="relative h-20 w-20 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200">
                      {hasImages ? (
                        <Image src={product.images[0]} alt={safeName} fill className="object-cover" />
                      ) : (
                        <span className="text-[10px] text-slate-400 absolute inset-0 flex items-center justify-center">No Img</span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{safeName}</h3>
                      <p className="text-xs text-slate-500 mt-1">ID: {safeId}</p>
                      
                      {/* Mobile Badges */}
                      <div className="flex gap-2 mt-2 md:hidden">
                        {safeStock <= 0 && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded">SOLD OUT</span>}
                        {isFeatured && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded">FEATURED</span>}
                        {isUrgent && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded">URGENT</span>}
                      </div>
                    </div>
                  </div>

                  {/* Price (Col 6-7) */}
                  <div className="col-span-1 md:col-span-2 flex justify-between md:justify-center items-center text-sm">
                    <span className="md:hidden text-slate-500 text-xs font-bold uppercase">Price:</span>
                    <span className="font-bold text-slate-900">UGX {safePrice.toLocaleString()}</span>
                  </div>

                  {/* Stock (Col 8-9) */}
                  <div className="col-span-1 md:col-span-2 flex flex-col items-start md:items-center text-sm gap-1">
                    <div className="flex justify-between w-full md:w-auto md:justify-center items-center">
                      <span className="md:hidden text-slate-500 text-xs font-bold uppercase">Stock:</span>
                      <span className={`font-bold ${safeStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {safeStock > 0 ? `${safeStock} available` : 'Sold Out'}
                      </span>
                    </div>
                    
                    {/* Desktop Badges */}
                    <div className="hidden md:flex flex-wrap justify-center gap-1 mt-1">
                      {isFeatured && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded">Featured</span>}
                      {isUrgent && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded">Urgent</span>}
                    </div>
                  </div>

                  {/* Actions (Col 10-12) */}
                  <div className="col-span-1 md:col-span-3 flex items-center justify-end gap-2 pt-3 border-t border-slate-100 md:border-0 md:pt-0">
                    {/* Future Promotion Button Route */}
                    <Link 
                      href={`/vendor/promote/${product.id}`}
                      className="text-xs font-bold text-amber-600 hover:text-amber-800 bg-amber-50 px-3 py-2 rounded-lg transition-colors border border-amber-100"
                    >
                      Boost 🚀
                    </Link>
                    
                    <Link 
                      href={`/edit/${safeId}`}
                      className="text-xs font-bold text-sky-600 hover:text-sky-800 bg-sky-50 px-3 py-2 rounded-lg transition-colors"
                    >
                      Edit
                    </Link>
                    
                    <button 
                      onClick={() => handleDelete(product.id)}
                      className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 px-3 py-2 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
