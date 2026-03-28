"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc } from "firebase/firestore"; 
import { db } from "@/lib/firebase/config";
import { Order } from "@/types";

export default function UnifiedDashboard() {
  const { user, loading: authLoading, signIn, signOut } = useAuth();
  const router = useRouter(); 

  // Tabs: Merging buyer and seller experiences smoothly
  const [activeTab, setActiveTab] = useState<"purchases" | "saved" | "listings" | "sales">("purchases");

  // State Management
  const [purchases, setPurchases] = useState<Order[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(true);

  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);

  const [listings, setListings] = useState<any[]>([]); 
  const [loadingListings, setLoadingListings] = useState(true);

  const [sales, setSales] = useState<Order[]>([]);
  const [loadingSales, setLoadingSales] = useState(true);
  const [updatingSaleId, setUpdatingSaleId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      if (!authLoading) {
        setLoadingPurchases(false); 
        setLoadingListings(false);
        setLoadingSaved(false);
        setLoadingSales(false);
      }
      return;
    }

    // 1. Fetch Purchases (Buyer)
    const fetchPurchases = async () => {
      try {
        const res = await fetch(`/api/orders/user?userId=${user.id}&t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setPurchases(data.orders || []);
        }
      } catch (error) { console.error(error); } 
      finally { setLoadingPurchases(false); }
    };

    // 2. Fetch Listings (Seller)
    const fetchListings = async () => {
      try {
        const res = await fetch(`/api/products/user?userId=${user.id}&t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setListings(data.products || []);
        }
      } catch (error) { console.error(error); } 
      finally { setLoadingListings(false); }
    };

    // 3. Fetch Sales (Seller Orders)
    const fetchSales = async () => {
      try {
        const res = await fetch(`/api/orders/seller?sellerId=${user.id}&t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setSales(data.orders || []);
        }
      } catch (error) { console.error(error); } 
      finally { setLoadingSales(false); }
    };

    // 4. Fetch Wishlist (Real-time Firestore)
    const fetchWishlist = () => {
      const wishlistRef = collection(db, "users", user.id, "wishlist");
      const q = query(wishlistRef, orderBy("savedAt", "desc"));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSavedItems(items);
        setLoadingSaved(false);
      }, (error) => {
        console.error("Error fetching wishlist:", error);
        setLoadingSaved(false);
      });

      return unsubscribe;
    };

    fetchPurchases(); 
    fetchListings();
    fetchSales();
    const unsubscribeWishlist = fetchWishlist();

    return () => {
      if (unsubscribeWishlist) unsubscribeWishlist();
    };
  }, [user, authLoading]);

  const isSeller = listings.length > 0 || sales.length > 0;

  // --- ACTIONS ---

  const handleRemoveSaved = async (productId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.id, "wishlist", productId));
    } catch (error) {
      alert("Failed to remove item. Please check your connection.");
    }
  };

  const handleToggleUrgent = async (product: any) => {
    if (!user) return;
    const now = Date.now();
    const isCurrentlyUrgent = product.isUrgent === true && product.urgentExpiresAt && product.urgentExpiresAt > now;
    const newIsUrgent = !isCurrentlyUrgent;
    const newExpiresAt = newIsUrgent ? now + (24 * 60 * 60 * 1000) : null; 

    try {
      await updateDoc(doc(db, "products", product.id), {
        isUrgent: newIsUrgent,
        urgentExpiresAt: newExpiresAt
      });
      // Optimistic UI update
      setListings(prev => prev.map(item => item.id === product.id ? { ...item, isUrgent: newIsUrgent, urgentExpiresAt: newExpiresAt } : item));
    } catch (error) {
      alert("Failed to update urgency status.");
    }
  };

  const handleDeleteAd = async (productId: string) => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to delete this ad? This action cannot be undone.")) return;

    try {
      await deleteDoc(doc(db, "products", productId));
      setListings(prev => prev.filter(item => item.id !== productId));
    } catch (error) {
      alert("Failed to delete ad. Something went wrong.");
    }
  };

  const handleSaleStatusChange = async (orderId: string, newStatus: string) => {
    if (newStatus === "cancelled") {
      alert("⚠️ To cancel an order, please contact Admin directly at 0759997376.");
      return;
    }

    setUpdatingSaleId(orderId);
    try {
      const res = await fetch("/api/orders/seller", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId: user?.id, orderId, newStatus })
      });

      if (res.ok) {
        setSales(prev => prev.map(order => order.id === orderId ? { ...order, status: newStatus as any } : order));
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to update status.");
      }
    } catch (error) {
      alert("Something went wrong updating the order.");
    } finally {
      setUpdatingSaleId(null);
    }
  };

  const handleLogout = () => {
    signOut();
    router.push("/"); 
  };

  // --- RENDER LOGIC ---

  if (authLoading) return <div className="py-20 text-center text-slate-500 font-bold animate-pulse">Loading dashboard...</div>;

  if (!user) {
    return (
      <div className="py-20 text-center px-4 max-w-sm mx-auto">
        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">🔒</div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Welcome to Kabale Online</h2>
        <p className="text-slate-600 mb-8 text-sm">Log in to manage your purchases, saved items, and local sales.</p>
        <button onClick={signIn} className="w-full bg-[#D97706] text-white py-3 rounded-xl font-bold hover:bg-amber-600 active:scale-95 transition-all shadow-sm">
          Log In or Create Account
        </button>
      </div>
    );
  }

  const safeName = user.displayName || "Kabale User";
  const safeInitial = safeName.charAt(0).toUpperCase();

  return (
    <div className="pb-24 max-w-2xl mx-auto bg-slate-50 min-h-screen sm:border-x sm:border-slate-200">
      
      {/* 1. TOP SECTION (User Overview) */}
      <div className="bg-white px-4 sm:px-6 pt-6 pb-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            {user.photoURL ? (
              <Image src={user.photoURL} alt={safeName} width={48} height={48} className="rounded-full object-cover border border-slate-200" />
            ) : (
              <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xl font-bold border border-amber-200">
                {safeInitial}
              </div>
            )}
            <div>
              <h1 className="text-lg font-extrabold text-slate-900">{safeName}</h1>
              <p className="text-slate-500 text-xs font-medium">{user.phoneNumber || user.email || "No contact info"}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-xs text-slate-400 font-bold hover:text-red-600 transition-colors bg-slate-50 px-3 py-1.5 rounded-md">Log Out</button>
        </div>
      </div>

      {/* 2. MAIN CONTENT AREA (Scrollable Tabs) */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="flex overflow-x-auto no-scrollbar scroll-smooth">
          <button onClick={() => setActiveTab("purchases")} className={`shrink-0 px-5 py-3.5 text-xs sm:text-sm font-bold text-center border-b-2 transition-colors ${activeTab === "purchases" ? "border-[#D97706] text-[#D97706]" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
            Purchases ({purchases.length})
          </button>
          <button onClick={() => setActiveTab("saved")} className={`shrink-0 px-5 py-3.5 text-xs sm:text-sm font-bold text-center border-b-2 transition-colors ${activeTab === "saved" ? "border-[#D97706] text-[#D97706]" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
            Saved ({savedItems.length})
          </button>
          {isSeller && (
            <>
              <button onClick={() => setActiveTab("listings")} className={`shrink-0 px-5 py-3.5 text-xs sm:text-sm font-bold text-center border-b-2 transition-colors ${activeTab === "listings" ? "border-[#D97706] text-[#D97706]" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
                My Ads ({listings.length})
              </button>
              <button onClick={() => setActiveTab("sales")} className={`shrink-0 px-5 py-3.5 text-xs sm:text-sm font-bold text-center border-b-2 transition-colors flex items-center gap-1 ${activeTab === "sales" ? "border-green-500 text-green-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
                Sales 📈
              </button>
            </>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6">
        
        {/* === TAB 1: PURCHASES === */}
        {activeTab === "purchases" && (
          <div className="space-y-3">
             {loadingPurchases ? (
              <div className="text-center py-10 text-slate-400 text-sm font-medium">Loading your orders...</div>
            ) : purchases.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 border-dashed p-8 text-center shadow-sm">
                <span className="text-4xl block mb-3">🛍️</span>
                <p className="text-slate-800 font-bold mb-1">No purchases yet</p>
                <Link href="/" className="inline-block mt-4 bg-[#D97706] text-white px-6 py-2.5 rounded-lg font-bold text-sm active:scale-95 shadow-sm">Start Shopping</Link>
              </div>
            ) : (
              purchases.map((order) => {
                const status = (order.status as string) || "pending";
                return (
                  <div key={order.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div>
                      <p className="text-xs text-[#D97706] font-mono font-bold mb-0.5">{order.orderNumber || "ORDER"}</p>
                      <p className="text-sm font-bold text-slate-900">Total: UGX {(Number(order.total) || 0).toLocaleString()}</p>
                      <p className="text-xs text-slate-500 mt-1">{new Date(order.createdAt || Date.now()).toLocaleDateString()}</p>
                    </div>
                    <span className={`self-start sm:self-auto text-[10px] font-bold px-2.5 py-1 rounded-sm uppercase tracking-wider ${
                      status === 'delivered' ? 'bg-green-100 text-green-700' : 
                      status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {status.replace(/_/g, ' ')}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* === TAB 2: SAVED ITEMS === */}
        {activeTab === "saved" && (
          <div>
            {loadingSaved ? (
              <div className="text-center py-10 text-slate-400 text-sm font-medium">Loading wishlist...</div>
            ) : savedItems.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 border-dashed p-8 text-center shadow-sm">
                <span className="text-4xl block mb-3">❤️</span>
                <p className="text-slate-800 font-bold mb-1">Your wishlist is empty</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {savedItems.map((item) => (
                  <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-2 sm:p-3 shadow-sm flex flex-col">
                    <Link href={`/product/${item.publicId || item.id}`} className="relative aspect-square w-full rounded-lg bg-slate-100 mb-2 overflow-hidden">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill className="object-cover" sizes="(max-width: 768px) 50vw, 33vw" />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-400">No Img</span>
                      )}
                    </Link>
                    <div className="flex-1">
                      <h3 className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight">{item.name}</h3>
                      <p className="text-sm font-extrabold text-slate-800 mt-1">UGX {(Number(item.price) || 0).toLocaleString()}</p>
                    </div>
                    <button onClick={() => handleRemoveSaved(item.id)} className="mt-3 w-full text-[11px] font-bold text-slate-500 bg-slate-50 py-1.5 rounded-md hover:text-red-600 hover:bg-red-50 transition-colors">
                      ✕ Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* === TAB 3: MY LISTINGS === */}
        {activeTab === "listings" && isSeller && (
          <div className="space-y-4">
             {listings.length === 0 ? (
               <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm">
                 <span className="text-4xl block mb-3">🏷️</span>
                 <p className="text-slate-800 font-bold mb-1">No active ads</p>
                 <Link href="/sell" className="inline-block mt-4 bg-[#D97706] text-white px-6 py-2.5 rounded-lg font-bold text-sm active:scale-95 shadow-sm">+ Post an Ad</Link>
               </div>
             ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {listings.map((product) => {
                   const isCurrentlyUrgent = product.isUrgent === true && product.urgentExpiresAt && product.urgentExpiresAt > Date.now();
                   
                   return (
                     <div key={product.id} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex flex-col relative">
                       
                       {isCurrentlyUrgent && (
                         <div className="absolute top-2 left-2 z-10 bg-rose-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm shadow-sm">
                           Urgent
                         </div>
                       )}

                       <div className="flex gap-3 mb-3">
                         <div className="w-20 h-20 bg-slate-100 rounded-lg flex-shrink-0 relative overflow-hidden">
                           {product.images?.[0] ? (
                             <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="80px" />
                           ) : (
                             <span className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-400">No Img</span>
                           )}
                         </div>
                         <div className="flex-1">
                           <h3 className="text-sm font-bold text-slate-900 leading-tight line-clamp-2">{product.name}</h3>
                           <p className="text-sm font-extrabold text-slate-800 mt-1">UGX {(Number(product.price) || 0).toLocaleString()}</p>
                         </div>
                       </div>

                       <div className="grid grid-cols-2 gap-2 mt-auto">
                         <button 
                           onClick={() => handleToggleUrgent(product)}
                           className={`col-span-2 text-[11px] font-bold py-2 rounded-lg border transition-all active:scale-95 ${
                             isCurrentlyUrgent ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-white text-slate-700 border-slate-200 shadow-sm"
                           }`}
                         >
                           {isCurrentlyUrgent ? "🔴 Cancel Urgency" : "⚡ Make Urgent (24h)"}
                         </button>
                         <Link href={`/edit/${product.publicId || product.id}`} className="text-[11px] font-bold text-center py-2 bg-slate-50 text-slate-700 rounded-lg active:bg-slate-100 border border-slate-100">Edit</Link>
                         <button onClick={() => handleDeleteAd(product.id)} className="text-[11px] font-bold text-center py-2 bg-red-50 text-red-600 rounded-lg active:bg-red-100 border border-red-100">Delete</button>
                       </div>
                     </div>
                   )
                 })}
               </div>
             )}
          </div>
        )}

        {/* === TAB 4: SALES (Seller Dashboard) === */}
        {activeTab === "sales" && isSeller && (
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Pending Fulfill</p>
                <p className="text-xl font-black text-slate-900">{sales.filter(o => ["pending", "confirmed", "out_for_delivery"].includes(o.status || "")).length}</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Total Earned</p>
                <p className="text-sm font-black text-green-600 truncate">UGX {sales.filter(o => o.status === "delivered").reduce((sum, order) => sum + (Number(order.total) || 0), 0).toLocaleString()}</p>
              </div>
            </div>

            {loadingSales ? (
              <div className="text-center py-10 text-slate-400 text-sm font-medium">Loading sales data...</div>
            ) : sales.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm font-medium bg-white rounded-xl border border-slate-200">No sales yet. Keep sharing your ads!</div>
            ) : (
              <div className="space-y-3">
                {sales.map((order) => {
                  const isCancelled = order.status === "cancelled";
                  
                  return (
                    <div key={order.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-mono text-[10px] font-bold text-[#D97706] mb-0.5">{order.orderNumber}</p>
                          <p className="text-sm font-bold text-slate-900">{order.items?.[0]?.productId || "Product"}</p>
                          <p className="text-xs font-extrabold text-slate-700 mt-0.5">UGX {(Number(order.total) || 0).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-500 uppercase">{order.buyerName}</p>
                          <a href={`tel:${order.contactPhone}`} className="text-xs font-bold text-[#D97706] mt-1 block">📞 {order.contactPhone || "Call"}</a>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100">
                        {updatingSaleId === order.id ? (
                          <div className="text-xs font-bold text-slate-400 text-center py-2">Updating...</div>
                        ) : isCancelled ? (
                          <div className="bg-red-50 text-red-700 text-[11px] font-bold text-center py-2 rounded-md">CANCELLED</div>
                        ) : (
                          <select
                            value={order.status || "pending"}
                            onChange={(e) => handleSaleStatusChange(order.id, e.target.value)}
                            className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#D97706]"
                          >
                            <option value="pending">⏳ Pending</option>
                            <option value="confirmed">✅ Confirmed</option>
                            <option value="out_for_delivery">🚚 Out for Delivery</option>
                            <option value="delivered">🎁 Delivered</option>
                            <option value="cancelled" disabled>❌ Cancel (Call Admin)</option>
                          </select>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* 4. BOTTOM SECTION (Growth Hooks) */}
      <div className="px-4 mt-4 pb-8 border-t border-slate-200 pt-6 bg-white sm:bg-transparent sm:border-t-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Grow your business</p>
        <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x pb-2">
          <div className="snap-start flex-shrink-0 w-[220px] bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 shadow-sm">
            <h4 className="text-sm font-bold text-amber-900 mb-1">🚀 Boost Listing</h4>
            <p className="text-[11px] text-amber-700 mb-3 leading-tight font-medium">Get 10x more views today. Free for a limited time!</p>
            <button className="text-[11px] font-bold bg-amber-200 text-amber-900 px-4 py-2 rounded-lg w-full active:bg-amber-300 transition-colors">Boost Now</button>
          </div>
          <div className="snap-start flex-shrink-0 w-[220px] bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm">
            <h4 className="text-sm font-bold text-blue-900 mb-1">🛡️ Get Verified</h4>
            <p className="text-[11px] text-blue-700 mb-3 leading-tight font-medium">Build trust with buyers by verifying your local business.</p>
            <button className="text-[11px] font-bold bg-blue-200 text-blue-900 px-4 py-2 rounded-lg w-full active:bg-blue-300 transition-colors">Verify Profile</button>
          </div>
        </div>
      </div>

      {/* 3. FLOATING ACTION BUTTON */}
      <Link 
        href="/sell" 
        className="fixed bottom-6 right-6 sm:bottom-10 sm:right-10 bg-[#D97706] text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-3xl pb-1 hover:bg-amber-600 active:scale-95 transition-transform z-50 border-2 border-white"
      >
        +
      </Link>

    </div>
  );
}
