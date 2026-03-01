"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { Order, Product } from "@/types";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"purchases" | "listings">("purchases");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [listings, setListings] = useState<Product[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      try {
        const res = await fetch(`/api/orders/user?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch (error) {
        console.error(error);
      } finally { setLoadingOrders(false); }
    };

    const fetchListings = async () => {
      if (!user) return;
      try {
        const res = await fetch(`/api/products/user?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setListings(data.products || []);
        }
      } catch (error) {
        console.error(error);
      } finally { setLoadingListings(false); }
    };

    if (user) {
      fetchOrders(); fetchListings();
    } else if (!authLoading) {
      setLoadingOrders(false); setLoadingListings(false);
    }
  }, [user, authLoading]);

  const handleDeleteAd = async (productId: string) => {
    if (!user) return;
    const isConfirmed = window.confirm("Are you sure you want to delete this ad? This action cannot be undone.");
    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/products/${productId}?userId=${user.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setListings(prev => prev.filter(item => item.id !== productId));
        alert("Ad deleted successfully.");
      } else {
        alert("Failed to delete ad.");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    }
  };

  if (authLoading) return <div className="py-20 text-center text-slate-500">Loading profile...</div>;

  if (!user) {
    return (
      <div className="py-20 text-center px-4">
        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">🔒</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Please Log In</h2>
        <p className="text-slate-600 mb-8">You must be logged in to view your profile and manage items.</p>
      </div>
    );
  }

  // SAFE FALLBACKS FOR USER DATA
  const safeDisplayName = user.displayName || "Kabale User";
  const safeInitial = safeDisplayName.charAt(0).toUpperCase();
  const safeRole = user.role || "customer";

  return (
    <div className="py-8 max-w-4xl mx-auto px-4 sm:px-0">
      
      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-center gap-6">
        {user.photoURL ? (
          <Image src={user.photoURL} alt={safeDisplayName} width={96} height={96} className="rounded-full border-4 border-slate-50 object-cover" />
        ) : (
          <div className="w-24 h-24 bg-primary text-white rounded-full flex items-center justify-center text-3xl font-bold">{safeInitial}</div>
        )}
        <div className="text-center sm:text-left flex-grow">
          <h1 className="text-2xl font-bold text-slate-900">{safeDisplayName}</h1>
          <p className="text-slate-500 mb-2">{user.email || "No email provided"}</p>
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 uppercase tracking-wide">
            {safeRole}
          </div>
        </div>
        <Link href="/sell" className="hidden sm:flex bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors items-center gap-2 shadow-sm">
          <span>➕</span> Post New Ad
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-8 overflow-x-auto scrollbar-hide">
        <button onClick={() => setActiveTab("purchases")} className={`px-6 py-4 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === "purchases" ? "border-primary text-primary" : "border-transparent text-slate-500"}`}>
          My Purchases ({orders.length})
        </button>
        <button onClick={() => setActiveTab("listings")} className={`px-6 py-4 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === "listings" ? "border-primary text-primary" : "border-transparent text-slate-500"}`}>
          My Ads & Listings ({listings.length})
        </button>
      </div>

      <div className="min-h-[400px]">
        
        {/* === PURCHASES TAB === */}
        {activeTab === "purchases" && (
           <div>
           {loadingOrders ? (
             <div className="text-center py-12 text-slate-500">Loading your purchases...</div>
           ) : orders.length === 0 ? (
             <div className="bg-slate-50 rounded-2xl border border-slate-200 border-dashed p-12 text-center">
               <p className="text-slate-600 mb-4 font-medium">You haven't placed any orders yet.</p>
               <Link href="/products" className="text-primary font-bold hover:underline">Start shopping</Link>
             </div>
           ) : (
             <div className="space-y-4">
               {orders.map((order) => {
                 // SAFE FALLBACKS FOR LEGACY ORDERS
                 const safeOrderNumber = order.orderNumber || "LEGACY-ORD";
                 const safeTotal = Number(order.total) || 0;
                 const safeStatus = order.status || "pending";
                 const safeDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "Unknown Date";

                 return (
                   <div key={order.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                     <div>
                       <p className="font-mono text-sm font-extrabold text-primary mb-1">{safeOrderNumber}</p>
                       <p className="text-xs text-slate-500 mb-2">{safeDate}</p>
                       <div className="text-sm text-slate-700">
                         <span className="font-medium">Total:</span> UGX {safeTotal.toLocaleString()} (COD)
                       </div>
                     </div>
                     <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                       <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                         safeStatus === 'pending' ? 'bg-amber-100 text-amber-800' :
                         safeStatus === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                         safeStatus === 'out_for_delivery' ? 'bg-purple-100 text-purple-800' :
                         'bg-green-100 text-green-800'
                       }`}>
                         {safeStatus.replace(/_/g, ' ')}
                       </span>
                     </div>
                   </div>
                 );
               })}
             </div>
           )}
         </div>
        )}

        {/* === LISTINGS TAB === */}
        {activeTab === "listings" && (
          <div>
            {loadingListings ? (
              <div className="text-center py-12 text-slate-500">Loading your listings...</div>
            ) : listings.length === 0 ? (
              <div className="bg-slate-50 rounded-2xl border border-slate-200 border-dashed p-12 text-center">
                <p className="text-slate-600 mb-4 font-medium">You haven't posted any items for sale yet.</p>
                <Link href="/sell" className="inline-block bg-primary text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-sky-500 transition-colors">
                  Post your first Ad
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {listings.map((product) => {
                  // SAFE FALLBACKS FOR LEGACY PRODUCTS
                  const safeName = product.name || "Unnamed Item";
                  const safePrice = Number(product.price) || 0;
                  const safeStatus = product.status || "active";
                  const safeId = product.publicId || product.id;
                  const hasImages = Array.isArray(product.images) && product.images.length > 0;

                  return (
                    <div key={product.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row gap-4">
                      <Link href={`/item/${safeId}`} className="relative h-24 w-24 sm:h-20 sm:w-20 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200 group">
                        {hasImages ? (
                          <Image src={product.images[0]} alt={safeName} fill className="object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <span className="text-[10px] text-slate-400 absolute inset-0 flex items-center justify-center">No Img</span>
                        )}
                      </Link>
                      
                      <div className="flex-grow flex flex-col justify-between">
                        <div>
                          <Link href={`/item/${safeId}`} className="text-sm font-bold text-slate-900 hover:text-primary line-clamp-1">
                            {safeName}
                          </Link>
                          <p className="text-xs text-slate-500 mt-1">ID: {product.publicId || product.id.slice(0, 8)}</p>
                        </div>
                        <div className="text-sm font-bold text-slate-900 mt-2 sm:mt-0">
                          UGX {safePrice.toLocaleString()}
                        </div>
                      </div>

                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 gap-2 sm:gap-0">
                        <Link 
                          href={`/edit/${safeId}`}
                          className="text-xs font-bold text-sky-600 hover:text-sky-800 bg-sky-50 px-3 py-1.5 rounded-md transition-colors"
                        >
                          Edit Ad
                        </Link>
                        <button 
                          onClick={() => handleDeleteAd(product.id)}
                          className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 px-3 py-1.5 rounded-md transition-colors sm:mt-2"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}