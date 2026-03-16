"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Order } from "@/types";
import SellerDashboard from "@/components/SellerDashboard";
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc } from "firebase/firestore"; 
import { db } from "@/lib/firebase/config";

export default function ProfilePage() {
  const { user, loading: authLoading, signIn, signOut } = useAuth();
  const router = useRouter(); 

  const [activeTab, setActiveTab] = useState<"purchases" | "saved" | "listings" | "seller">("purchases");

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const [listings, setListings] = useState<any[]>([]); 
  const [loadingListings, setLoadingListings] = useState(true);

  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);

  useEffect(() => {
    if (!user) {
      if (!authLoading) {
        setLoadingOrders(false); 
        setLoadingListings(false);
        setLoadingSaved(false);
      }
      return;
    }

    // 1. Fetch Orders (🔥 Added cache-busting to prevent stale data on refresh)
    const fetchOrders = async () => {
      try {
        const res = await fetch(`/api/orders/user?userId=${user.id}&t=${Date.now()}`, {
          cache: 'no-store'
        });
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch (error) {
        console.error(error);
      } finally { setLoadingOrders(false); }
    };

    // 2. Fetch Listings (🔥 Added cache-busting so Urgency toggles persist on refresh)
    const fetchListings = async () => {
      try {
        const res = await fetch(`/api/products/user?userId=${user.id}&t=${Date.now()}`, {
          cache: 'no-store'
        });
        if (res.ok) {
          const data = await res.json();
          setListings(data.products || []);
        }
      } catch (error) {
        console.error(error);
      } finally { setLoadingListings(false); }
    };

    // 3. Fetch Wishlist (⚡ Real-time listener from Firestore)
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

    fetchOrders(); 
    fetchListings();
    const unsubscribeWishlist = fetchWishlist();

    return () => {
      if (unsubscribeWishlist) unsubscribeWishlist();
    };
  }, [user, authLoading]);

  // Handle removing a saved item directly from the profile
  const handleRemoveSaved = async (productId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.id, "wishlist", productId));
    } catch (error) {
      console.error("Failed to remove item from wishlist", error);
      alert("Failed to remove item. Please check your connection.");
    }
  };

  // 🔥 THE URGENT TOGGLE LOGIC 🔥
  const handleToggleUrgent = async (product: any) => {
    if (!user) return;
    
    const now = Date.now();
    // Check if it's currently urgent
    const isCurrentlyUrgent = product.isUrgent === true && product.urgentExpiresAt && product.urgentExpiresAt > now;
    
    const newIsUrgent = !isCurrentlyUrgent;
    const newExpiresAt = newIsUrgent ? now + (24 * 60 * 60 * 1000) : null; // 24 hours from now or null

    try {
      const productRef = doc(db, "products", product.id);
      await updateDoc(productRef, {
        isUrgent: newIsUrgent,
        urgentExpiresAt: newExpiresAt
      });

      // Instantly update the local UI without needing a refresh
      setListings(prev => prev.map(item => 
        item.id === product.id 
          ? { ...item, isUrgent: newIsUrgent, urgentExpiresAt: newExpiresAt }
          : item
      ));

    } catch (error) {
      console.error("Failed to update urgency:", error);
      alert("Failed to update status. Please try again.");
    }
  };

  const handleDeleteAd = async (productId: string) => {
    if (!user) return;
    const isConfirmed = window.confirm("Are you sure you want to delete this ad? This action cannot be undone.");
    if (!isConfirmed) return;

    try {
      await deleteDoc(doc(db, "products", productId));
      setListings(prev => prev.filter(item => item.id !== productId));
      alert("Ad deleted successfully.");
    } catch (error) {
      console.error("Failed to delete ad:", error);
      alert("Failed to delete ad. Something went wrong.");
    }
  };

  const handleLogout = () => {
    signOut();
    router.push("/"); 
  };

  if (authLoading) return <div className="py-20 text-center text-slate-500 font-bold animate-pulse">Loading profile...</div>;

  if (!user) {
    return (
      <div className="py-20 text-center px-4 max-w-lg mx-auto">
        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl border border-slate-200">🔒</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">You Must Log In</h2>
        <p className="text-slate-600 mb-8 leading-relaxed">Please log in to your Kabale Online account to view your profile, manage your ads, and access your wishlist.</p>
        <button 
          onClick={signIn}
          className="bg-[#D97706] text-white px-8 py-3 rounded-xl font-bold hover:bg-amber-600 transition-colors shadow-md active:scale-95"
        >
          Log In or Create Account
        </button>
      </div>
    );
  }

  const safeDisplayName = user.displayName || "Kabale User";
  const safeInitial = safeDisplayName.charAt(0).toUpperCase();
  const safeRole = user.role || "customer";

  return (
    <div className="py-8 max-w-4xl mx-auto px-4 sm:px-0">

      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
        {user.photoURL ? (
          <Image src={user.photoURL} alt={safeDisplayName} width={96} height={96} className="rounded-full border-4 border-slate-50 object-cover shadow-sm flex-shrink-0" />
        ) : (
          <div className="w-24 h-24 bg-[#D97706] text-white rounded-full flex items-center justify-center text-3xl font-bold flex-shrink-0 shadow-inner border-2 border-amber-600">{safeInitial}</div>
        )}

        <div className="flex-grow">
          <h1 className="text-2xl font-extrabold text-slate-900">{safeDisplayName}</h1>
          <p className="text-slate-500 mb-3 font-medium">{user.email || "No email provided"}</p>
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 uppercase tracking-wide">
            {safeRole}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3 mt-4 sm:mt-0">
          <Link href="/sell" className="flex justify-center bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors items-center gap-2 shadow-md active:scale-95">
            <span>➕</span> Post New Ad
          </Link>
          <button 
            onClick={handleLogout} 
            className="flex justify-center bg-red-50 text-red-600 border border-transparent hover:border-red-200 px-6 py-3 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors items-center gap-2 active:scale-95"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 mb-8 no-scrollbar scroll-smooth">
        <button 
          onClick={() => setActiveTab("purchases")} 
          className={`shrink-0 px-4 sm:px-6 py-4 text-xs sm:text-sm font-bold text-center border-b-2 transition-colors flex flex-col sm:flex-row items-center justify-center gap-1 ${activeTab === "purchases" ? "border-[#D97706] text-[#D97706]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          <span>Purchases</span>
          <span className="opacity-70">({orders.length})</span>
        </button>

        <button 
          onClick={() => setActiveTab("saved")} 
          className={`shrink-0 px-4 sm:px-6 py-4 text-xs sm:text-sm font-bold text-center border-b-2 transition-colors flex flex-col sm:flex-row items-center justify-center gap-1 ${activeTab === "saved" ? "border-rose-500 text-rose-500" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          <span>❤️ Saved</span>
          <span className="opacity-70">({savedItems.length})</span>
        </button>

        <button 
          onClick={() => setActiveTab("listings")} 
          className={`shrink-0 px-4 sm:px-6 py-4 text-xs sm:text-sm font-bold text-center border-b-2 transition-colors flex flex-col sm:flex-row items-center justify-center gap-1 ${activeTab === "listings" ? "border-[#D97706] text-[#D97706]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          <span>My Ads</span>
          <span className="opacity-70">({listings.length})</span>
        </button>

        <button 
          onClick={() => setActiveTab("seller")} 
          className={`shrink-0 px-4 sm:px-6 py-4 text-xs sm:text-sm font-bold text-center border-b-2 transition-colors flex flex-col sm:flex-row items-center justify-center gap-1 ${activeTab === "seller" ? "border-amber-500 text-amber-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          <span>Dashboard</span>
          <span>📈</span>
        </button>
      </div>

      <div className="min-h-[400px]">

        {/* === PURCHASES TAB === */}
        {activeTab === "purchases" && (
           <div>
           {loadingOrders ? (
             <div className="text-center py-12 text-slate-500 font-medium">Loading your orders...</div>
           ) : orders.length === 0 ? (
             <div className="bg-slate-50 rounded-2xl border border-slate-200 border-dashed p-12 text-center max-w-lg mx-auto shadow-inner">
               <span className="text-5xl block mb-4">📦</span>
               <p className="text-slate-600 mb-4 font-bold text-lg">You haven't ordered anything yet.</p>
               <Link href="/" className="inline-block bg-[#D97706] text-white px-8 py-3 rounded-lg font-bold text-sm hover:bg-amber-600 transition-all shadow-md active:scale-95">Start shopping in Kabale</Link>
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

        {/* === SAVED ITEMS TAB === */}
        {activeTab === "saved" && (
          <div>
            {loadingSaved ? (
              <div className="text-center py-12 text-slate-500 font-medium">Loading your wishlist...</div>
            ) : savedItems.length === 0 ? (
              <div className="bg-slate-50 rounded-2xl border border-slate-200 border-dashed p-12 text-center max-w-lg mx-auto shadow-inner">
                <span className="text-5xl block mb-4">💔</span>
                <p className="text-slate-600 mb-6 font-medium text-lg">Your wishlist is completely empty.</p>
                <Link href="/" className="inline-block bg-[#D97706] text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-amber-600 transition-colors shadow-md active:scale-95">
                  Find Something to Buy
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {savedItems.map((item) => {
                  const safeName = item.name || "Unnamed Item";
                  const safePrice = Number(item.price) || 0;
                  const safeId = item.publicId || item.id;

                  return (
                    <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex flex-col gap-3 hover:shadow-md transition-shadow">
                      <Link href={`/product/${safeId}`} className="relative aspect-square w-full rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200 group">
                        {item.image ? (
                          <Image src={item.image} alt={safeName} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <span className="text-[10px] text-slate-400 absolute inset-0 flex items-center justify-center">No Img</span>
                        )}
                      </Link>

                      <div className="flex-grow flex flex-col">
                        <Link href={`/product/${safeId}`} className="text-sm font-bold text-slate-900 hover:text-[#D97706] line-clamp-2 leading-tight mb-1">
                          {safeName}
                        </Link>
                        <div className="text-sm font-extrabold text-slate-900 mt-auto">
                          UGX {safePrice.toLocaleString()}
                        </div>
                      </div>

                      <div className="pt-2 mt-1 border-t border-slate-100">
                        <button 
                          onClick={() => handleRemoveSaved(item.id)}
                          className="w-full text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 py-2 rounded transition-colors"
                        >
                          ✕ Remove from Wishlist
                        </button>
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
              <div className="text-center py-12 text-slate-500 font-medium">Loading your items...</div>
            ) : listings.length === 0 ? (
              <div className="bg-slate-50 rounded-2xl border border-slate-200 border-dashed p-12 text-center max-w-lg mx-auto shadow-inner">
                <span className="text-5xl block mb-4">📢</span>
                <p className="text-slate-600 mb-6 font-medium text-lg">You haven't posted any items for sale yet.</p>
                <Link href="/sell" className="inline-block bg-slate-900 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-slate-800 transition-colors shadow-md active:scale-95">
                  Post Your First Ad
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {listings.map((product) => {
                  const safeName = product.name || "Unnamed Item";
                  const safePrice = Number(product.price) || 0;
                  const safeId = product.publicId || product.id;
                  const hasImages = Array.isArray(product.images) && product.images.length > 0;
                  
                  // 🔥 Check if it's currently urgent
                  const isCurrentlyUrgent = product.isUrgent === true && product.urgentExpiresAt && product.urgentExpiresAt > Date.now();

                  return (
                    <div key={product.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex flex-col gap-3 hover:shadow-md transition-shadow relative">
                      
                      {/* Show visual indicator on the card if it's currently urgent */}
                      {isCurrentlyUrgent && (
                        <div className="absolute top-4 right-4 z-10 bg-gradient-to-tr from-amber-400 to-rose-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md animate-pulse">
                          Urgent
                        </div>
                      )}

                      <Link href={`/product/${safeId}`} className="relative aspect-square w-full rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200 group">
                        {hasImages ? (
                          <Image src={product.images[0]} alt={safeName} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <span className="text-[10px] text-slate-400 absolute inset-0 flex items-center justify-center">No Img</span>
                        )}
                      </Link>

                      <div className="flex-grow flex flex-col">
                        <Link href={`/product/${safeId}`} className="text-sm font-bold text-slate-900 hover:text-[#D97706] line-clamp-2 leading-tight mb-1">
                          {safeName}
                        </Link>
                        <div className="text-sm font-extrabold text-slate-900 mt-auto">
                          UGX {safePrice.toLocaleString()}
                        </div>
                      </div>

                      {/* 🔥 THE ACTIONS ROW WITH THE URGENCY TOGGLE 🔥 */}
                      <div className="flex flex-col border-t border-slate-100 pt-3 mt-1 gap-2">
                        
                        {/* Toggle Button */}
                        <button 
                          onClick={() => handleToggleUrgent(product)}
                          className={`w-full text-[11px] font-bold py-2 rounded-lg border transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 ${
                            isCurrentlyUrgent
                              ? "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                          }`}
                        >
                          {isCurrentlyUrgent ? (
                            <><span>🔴</span> Cancel Urgency</>
                          ) : (
                            <><span>⚡</span> Make Urgent (24h)</>
                          )}
                        </button>

                        {/* Edit & Delete */}
                        <div className="flex items-center justify-between gap-2 pt-0.5">
                          <Link 
                            href={`/edit/${safeId}`}
                            className="text-xs font-bold text-sky-600 bg-sky-50 px-2 py-1.5 rounded-lg flex-1 text-center border border-transparent hover:border-sky-100 transition-all active:scale-95"
                          >
                            Edit
                          </Link>
                          <button 
                            onClick={() => handleDeleteAd(product.id)}
                            className="text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 px-2 py-1.5 rounded-lg flex-1 text-center border border-transparent hover:border-red-100 transition-all active:scale-95"
                          >
                            Delete
                          </button>
                        </div>

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
