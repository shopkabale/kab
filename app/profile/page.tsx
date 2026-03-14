"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { Order, Product } from "@/types";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"purchases" | "listings">("purchases");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [listings, setListings] = useState<Product[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);

  // Redirect premium vendors to their dashboard
  useEffect(() => {
    if (user && user.role === "vendor") {
      router.push("/vendor/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      try {
        const res = await fetch(`/api/orders/user?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch (error) { console.error(error); } 
      finally { setLoadingOrders(false); }
    };

    const fetchListings = async () => {
      if (!user) return;
      try {
        const res = await fetch(`/api/products/user?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setListings(data.products || []);
        }
      } catch (error) { console.error(error); } 
      finally { setLoadingListings(false); }
    };

    if (user && user.role !== "vendor") {
      fetchOrders(); 
      fetchListings();
    } else if (!authLoading) {
      setLoadingOrders(false); 
      setLoadingListings(false);
    }
  }, [user, authLoading]);

  const handleDeleteAd = async (productId: string) => {
    if (!user) return;
    const isConfirmed = window.confirm("Are you sure you want to delete this ad?");
    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/products/${productId}?userId=${user.id}`, { method: "DELETE" });
      if (res.ok) {
        setListings(prev => prev.filter(item => item.id !== productId));
      }
    } catch (error) { console.error(error); }
  };

  if (authLoading || (user && user.role === "vendor")) {
    return <div className="py-20 text-center text-slate-500 font-bold">Loading Kabale Online Profile...</div>;
  }

  if (!user) {
    return (
      <div className="py-20 text-center px-4">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Please Log In</h2>
        <Link href="/" className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold">Go Home</Link>
      </div>
    );
  }

  const safeDisplayName = user.displayName || "Kabale User";
  const safeInitial = safeDisplayName.charAt(0).toUpperCase();

  return (
    <div className="py-8 max-w-6xl mx-auto px-4">
      
      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 mb-6 flex flex-col sm:flex-row items-center gap-6">
        {user.photoURL ? (
          <Image src={user.photoURL} alt={safeDisplayName} width={80} height={80} className="rounded-full border-4 border-slate-50 object-cover" />
        ) : (
          <div className="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center text-3xl font-bold">{safeInitial}</div>
        )}
        <div className="text-center sm:text-left flex-grow">
          <h1 className="text-2xl font-black text-slate-900">{safeDisplayName}</h1>
          <div className="inline-flex items-center px-3 py-1 mt-1 rounded-full text-[10px] font-black bg-sky-100 text-sky-800 uppercase tracking-widest">
            {user.role || "customer"}
          </div>
        </div>
        <Link href="/sell" className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-md">
          ➕ Post New Ad
        </Link>
      </div>

      {/* Store Upgrade Promo Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 rounded-2xl p-6 mb-8 text-white shadow-xl border-b-4 border-orange-800">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h2 className="text-xl font-black uppercase tracking-tight">Open Your Professional Store 🏪</h2>
            <p className="text-amber-50 text-sm mt-1 max-w-lg opacity-95">
              Get a custom URL, shop analytics, and a verified badge for only <span className="font-black text-white underline">UGX 20,000 / month.</span> Boost your trust in Kabale!
            </p>
          </div>
          <Link 
            href="/store/upgrade" 
            className="w-full md:w-auto bg-white text-orange-600 px-10 py-3 rounded-xl font-black text-center text-sm hover:bg-slate-100 transition-all shadow-lg"
          >
            UPGRADE NOW
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-8 overflow-x-auto scrollbar-hide">
        <button onClick={() => setActiveTab("purchases")} className={`px-6 py-4 text-sm font-black whitespace-nowrap border-b-2 transition-colors ${activeTab === "purchases" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
          MY PURCHASES ({orders.length})
        </button>
        <button onClick={() => setActiveTab("listings")} className={`px-6 py-4 text-sm font-black whitespace-nowrap border-b-2 transition-colors ${activeTab === "listings" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
          MY ADS & LISTINGS ({listings.length})
        </button>
      </div>

      <div className="min-h-[400px]">
        {activeTab === "purchases" && (
           <div className="space-y-4">
             {loadingOrders ? <p className="text-center py-10">Loading...</p> : orders.length === 0 ? (
               <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 font-bold">No purchases yet.</div>
             ) : (
               orders.map((order) => (
                 <div key={order.id} className="bg-white rounded-xl border border-slate-200 p-5 flex justify-between items-center shadow-sm">
                   <div>
                     <p className="font-black text-primary text-sm">{order.orderNumber}</p>
                     <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                   </div>
                   <div className="text-right font-black text-slate-900 uppercase text-xs">{order.status}</div>
                 </div>
               ))
             )}
           </div>
        )}

        {activeTab === "listings" && (
          <div>
            {loadingListings ? <p className="text-center py-10">Loading...</p> : listings.length === 0 ? (
               <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 font-bold">No ads posted yet.</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {listings.map((product) => (
                  <div key={product.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-sm group">
                    <div className="relative aspect-square bg-slate-100">
                      {product.images?.[0] ? (
                        <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-300 text-[10px]">No Image</div>
                      )}
                    </div>
                    <div className="p-3 flex-grow">
                      <h3 className="text-xs font-black text-slate-900 line-clamp-1 uppercase tracking-tight">{product.name}</h3>
                      <p className="text-amber-600 font-black text-sm mt-1">UGX {Number(product.price).toLocaleString()}</p>
                    </div>
                    <div className="grid grid-cols-2 border-t border-slate-100">
                      <Link href={`/edit/${product.publicId || product.id}`} className="py-2 text-center text-[10px] font-black text-sky-600 hover:bg-sky-50 border-r border-slate-100 transition-colors uppercase">
                        Edit
                      </Link>
                      <button onClick={() => handleDeleteAd(product.id)} className="py-2 text-center text-[10px] font-black text-red-500 hover:bg-red-50 transition-colors uppercase">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
