"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Order, Product } from "@/types";
import SellerDashboard from "@/components/SellerDashboard";

export default function ProfilePage() {
  // 1. PULL signIn AND signOut DIRECTLY FROM YOUR AUTH PROVIDER
  const { user, loading: authLoading, signIn, signOut } = useAuth();
  const router = useRouter(); 
  const [activeTab, setActiveTab] = useState<"purchases" | "listings" | "seller">("purchases");

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

  const handleLogout = () => {
    signOut();
    router.push("/"); // Gently redirect them to the home page after logging out
  };

  if (authLoading) return <div className="py-20 text-center text-slate-500">Loading profile...</div>;

  if (!user) {
    return (
      <div className="py-20 text-center px-4">
        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">🔒</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Please Log In</h2>
        <p className="text-slate-600 mb-8">You must be logged in to view your profile and manage items.</p>
        {/* 2. USING YOUR signIn LOGIC */}
        <button 
          onClick={signIn}
          className="bg-[#D97706] text-white px-8 py-3 rounded-xl font-bold hover:bg-amber-600 transition-colors shadow-sm"
        >
          Log In to Continue
        </button>
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
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
        {user.photoURL ? (
          <Image src={user.photoURL} alt={safeDisplayName} width={96} height={96} className="rounded-full border-4 border-slate-50 object-cover" />
        ) : (
          <div className="w-24 h-24 bg-[#D97706] text-white rounded-full flex items-center justify-center text-3xl font-bold flex-shrink-0">{safeInitial}</div>
        )}
        
        <div className="flex-grow">
          <h1 className="text-2xl font-bold text-slate-900">{safeDisplayName}</h1>
          <p className="text-slate-500 mb-3">{user.email || "No email provided"}</p>
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 uppercase tracking-wide">
            {safeRole}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3 mt-4 sm:mt-0">
          <Link href="/sell" className="flex justify-center bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors items-center gap-2 shadow-sm">
            <span>➕</span> Post New Ad
          </Link>
          {/* 3. USING YOUR signOut LOGIC */}
          <button 
            onClick={handleLogout} 
            className="flex justify-center bg-red-50 text-red-600 border border-transparent hover:border-red-200 px-6 py-3 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors items-center gap-2"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 sm:flex sm:flex-row border-b border-slate-200 mb-8">
        <button 
          onClick={() => setActiveTab("purchases")} 
          className={`px-2 sm:px-6 py-4 text-xs sm:text-sm font-bold text-center sm:text-left border-b-2 transition-colors flex flex-col sm:block items-center justify-center ${activeTab === "purchases" ? "border-[#D97706] text-[#D97706]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          <span>Purchases</span>
          <span className="sm:ml-1 opacity-70">({orders.length})</span>
        </button>
        <button 
          onClick={() => setActiveTab("listings")} 
          className={`px-2 sm:px-6 py-4 text-xs sm:text-sm font-bold text-center sm:text-left border-b-2 transition-colors flex flex-col sm:block items-center justify-center ${activeTab === "listings" ? "border-[#D97706] text-[#D97706]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          <span>My Ads</span>
          <span className="sm:ml-1 opacity-70">({listings.length})</span>
        </button>
        <button 
          onClick={() => setActiveTab("seller")} 
          className={`px-2 sm:px-6 py-4 text-xs sm:text-sm font-bold text-center sm:text-left border-b-2 transition-colors flex flex-col sm:block items-center justify-center ${activeTab === "seller" ? "border-amber-500 text-amber-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          <span>Dashboard</span>
          <span className="sm:hidden mt-1">📈</span>
          <span className="hidden sm:inline sm:ml-1">📈</span>
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
               <Link href="/products" className="text-[#D97706] font-bold hover:underline">Start shopping</Link>
             </div>
           ) : (
             <div className="space-y-4">
               {orders.map((order) => {
                 const safeOrderNumber = order.orderNumber || "LEGACY-ORD";
                 const safeTotal = Number(order.total) || 0;
                 const safeStatus = order.status || "pending";
                 const safeDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "Unknown Date";

                 return (
                   <div key={order.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                     <div>
                       <p className="font-mono text-sm font-extrabold text-[#D97706] mb-1">{safeOrderNumber}</p>
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
                <Link href="/sell" className="inline-block bg-[#D97706] text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-amber-600 transition-colors">
                  Post your first Ad
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {listings.map((product) => {
                  const safeName = product.name || "Unnamed Item";
                  const safePrice = Number(product.price) || 0;
                  const safeId = product.publicId || product.id;
                  const hasImages = Array.isArray(product.images) && product.images.length > 0;

                  return (
                    <div key={product.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex flex-col gap-3 hover:shadow-md transition-shadow">
                      {/* Image - Now takes full width of the card */}
                      <Link href={`/product/${safeId}`} className="relative aspect-square w-full rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200 group">
                        {hasImages ? (
                          <Image src={product.images[0]} alt={safeName} fill className="object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <span className="text-[10px] text-slate-400 absolute inset-0 flex items-center justify-center">No Img</span>
                        )}
                      </Link>

                      {/* Text Details */}
                      <div className="flex-grow flex flex-col">
                        <Link href={`/product/${safeId}`} className="text-sm font-bold text-slate-900 hover:text-[#D97706] line-clamp-2 leading-tight mb-1">
                          {safeName}
                        </Link>
                        <div className="text-sm font-extrabold text-slate-900 mt-auto">
                          UGX {safePrice.toLocaleString()}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1 gap-2">
                        <Link 
                          href={`/edit/${safeId}`}
                          className="text-xs font-bold text-sky-600 hover:bg-sky-50 px-2 py-1.5 rounded flex-1 text-center border border-transparent hover:border-sky-100 transition-all"
                        >
                          Edit
                        </Link>
                        <button 
                          onClick={() => handleDeleteAd(product.id)}
                          className="text-xs font-bold text-red-600 hover:bg-red-50 px-2 py-1.5 rounded flex-1 text-center border border-transparent hover:border-red-100 transition-all"
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

        {/* === SELLER DASHBOARD TAB === */}
        {activeTab === "seller" && (
          <SellerDashboard userId={user.id} />
        )}

      </div>
    </div>
  );
}
