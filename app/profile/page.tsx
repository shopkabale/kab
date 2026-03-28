"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc, getDoc } from "firebase/firestore"; 
import { db } from "@/lib/firebase/config";
import { Order } from "@/types";

export default function UnifiedDashboard() {
  const { user, loading: authLoading, signIn, signOut } = useAuth();
  const router = useRouter(); 

  const [activeTab, setActiveTab] = useState<"purchases" | "saved" | "listings" | "sales">("listings");

  // Data States
  const [purchases, setPurchases] = useState<Order[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(true);
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [listings, setListings] = useState<any[]>([]); 
  const [loadingListings, setLoadingListings] = useState(true);
  const [sales, setSales] = useState<Order[]>([]);
  const [loadingSales, setLoadingSales] = useState(true);

  // Growth & Premium Feature States
  const [verificationStatus, setVerificationStatus] = useState<"unverified" | "pending" | "verified">("unverified");
  const [isVerifying, setIsVerifying] = useState(false);
  const [boostingId, setBoostingId] = useState<string | null>(null);
  const [featuringId, setFeaturingId] = useState<string | null>(null);

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

    // Fetch User Verification Status
    const fetchUserStatus = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.id));
        if (userDoc.exists() && userDoc.data().verificationStatus) {
          setVerificationStatus(userDoc.data().verificationStatus);
        }
      } catch (error) { console.error("Error fetching user status", error); }
    };

    // Fetch Purchases
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

    // Fetch Listings
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

    // Fetch Sales
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

    // Fetch Wishlist (Real-time)
    const fetchWishlist = () => {
      const wishlistRef = collection(db, "users", user.id, "wishlist");
      const q = query(wishlistRef, orderBy("savedAt", "desc"));
      return onSnapshot(q, (snapshot) => {
        setSavedItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoadingSaved(false);
      }, () => setLoadingSaved(false));
    };

    fetchUserStatus();
    fetchPurchases(); 
    fetchListings();
    fetchSales();
    const unsubscribeWishlist = fetchWishlist();

    return () => { if (unsubscribeWishlist) unsubscribeWishlist(); };
  }, [user, authLoading]);

  // --- STANDARD ACTIONS ---
  const handleRemoveSaved = async (productId: string) => {
    if (!user) return;
    try { await deleteDoc(doc(db, "users", user.id, "wishlist", productId)); } 
    catch (error) { alert("Failed to remove item."); }
  };

  const handleToggleUrgent = async (product: any) => {
    if (!user) return;
    const now = Date.now();
    const isCurrentlyUrgent = product.isUrgent === true && product.urgentExpiresAt && product.urgentExpiresAt > now;
    const newIsUrgent = !isCurrentlyUrgent;
    const newExpiresAt = newIsUrgent ? now + (24 * 60 * 60 * 1000) : null; 

    try {
      await updateDoc(doc(db, "products", product.id), { isUrgent: newIsUrgent, urgentExpiresAt: newExpiresAt });
      setListings(prev => prev.map(item => item.id === product.id ? { ...item, isUrgent: newIsUrgent, urgentExpiresAt: newExpiresAt } : item));
    } catch (error) { alert("Failed to update urgency status."); }
  };

  const handleDeleteAd = async (productId: string) => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to delete this ad? This action cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "products", productId));
      setListings(prev => prev.filter(item => item.id !== productId));
    } catch (error) { alert("Failed to delete ad."); }
  };

  const handleMarkAsSold = async (productId: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "products", productId), { status: "sold" });
      setListings(prev => prev.map(item => item.id === productId ? { ...item, status: "sold" } : item));
    } catch (error) { alert("Failed to mark as sold."); }
  };

  const handleSaleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/orders/seller", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId: user?.id, orderId, newStatus })
      });
      if (res.ok) {
        setSales(prev => prev.map(order => order.id === orderId ? { ...order, status: newStatus as any } : order));
      } else { alert("Failed to update status."); }
    } catch (error) { alert("Something went wrong updating the order."); }
  };

  // --- PREMIUM / GROWTH ACTIONS ---

  const handleVerifyProfile = async () => {
    if (!user) return;
    setIsVerifying(true);
    try {
      const res = await fetch("/api/users/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!res.ok) throw new Error("Verification failed");
      setVerificationStatus("pending");
      alert("🛡️ Success! Your profile is now under review by Admin.");
    } catch (error) {
      alert("Network error. Please try again.");
    } finally { setIsVerifying(false); }
  };

  const handleBoostListing = async (productId: string) => {
    if (!user) return;
    setBoostingId(productId);
    try {
      const res = await fetch("/api/products/boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, userId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setListings(prev => prev.map(item => item.id === productId ? { ...item, isBoosted: true, boostExpiresAt: data.boostExpiresAt } : item));
      alert("🚀 Success! Your listing is now boosted for 24 hours.");
    } catch (error: any) {
      alert(error.message || "Network error. Please try again.");
    } finally { setBoostingId(null); }
  };

  const handleFeatureItem = async (productId: string) => {
    if (!user) return;
    setFeaturingId(productId);
    try {
      const res = await fetch("/api/products/feature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, userId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setListings(prev => prev.map(item => item.id === productId ? { ...item, isFeatured: true, featureExpiresAt: data.featureExpiresAt } : item));
      alert("⭐ Success! Your item is now pinned to the homepage for 7 days.");
    } catch (error: any) {
      alert(error.message || "Network error. Please try again.");
    } finally { setFeaturingId(null); }
  };


  // --- RENDER ---
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

  const safeName = user.displayName || "Samuel";
  const safeEmail = user.email || "No email provided";

  return (
    <div className="pb-24 max-w-md mx-auto bg-slate-50 min-h-screen sm:border-x sm:border-slate-200 shadow-sm relative">
      
      {/* 1. TOP SECTION (User Overview) */}
      <div className="bg-white px-4 pt-6 pb-5 border-b border-slate-200">
        <div className="flex items-center gap-3 mb-5">
          {user.photoURL ? (
            <Image src={user.photoURL} alt={safeName} width={56} height={56} className="rounded-full object-cover border-2 border-slate-100" />
          ) : (
            <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-2xl font-bold border border-amber-200">
              {safeName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              {safeName}
              {verificationStatus === "verified" && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wide border bg-blue-50 text-blue-600 border-blue-200">
                  ✓ Verified
                </span>
              )}
            </h1>
            <p className="text-slate-500 text-xs font-medium">{safeEmail}</p>
          </div>
          <button onClick={signOut} className="text-[10px] text-slate-400 font-bold hover:text-red-600 bg-slate-50 px-2 py-1.5 rounded-md">Log Out</button>
        </div>

        <div className="flex gap-3">
          <Link href="/sell" className="flex-1 bg-[#D97706] text-white py-2.5 rounded-lg font-bold text-sm text-center shadow-sm active:scale-95 transition-transform">
            + Sell Item
          </Link>
          <Link href="/" className="flex-1 bg-slate-100 text-slate-800 py-2.5 rounded-lg font-bold text-sm text-center active:scale-95 transition-transform">
            Browse Items
          </Link>
        </div>
      </div>

      {/* 2. MAIN CONTENT AREA (Tabbed Interface) */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 flex overflow-x-auto no-scrollbar">
        <button onClick={() => setActiveTab("listings")} className={`flex-1 min-w-[100px] py-3 text-xs font-bold text-center border-b-2 transition-colors ${activeTab === "listings" ? "border-[#D97706] text-[#D97706]" : "border-transparent text-slate-500"}`}>
          My Listings
        </button>
        <button onClick={() => setActiveTab("sales")} className={`flex-1 min-w-[100px] py-3 text-xs font-bold text-center border-b-2 transition-colors ${activeTab === "sales" ? "border-[#D97706] text-[#D97706]" : "border-transparent text-slate-500"}`}>
          Orders
        </button>
        <button onClick={() => setActiveTab("purchases")} className={`flex-1 min-w-[100px] py-3 text-xs font-bold text-center border-b-2 transition-colors ${activeTab === "purchases" ? "border-[#D97706] text-[#D97706]" : "border-transparent text-slate-500"}`}>
          Purchases
        </button>
        <button onClick={() => setActiveTab("saved")} className={`flex-1 min-w-[100px] py-3 text-xs font-bold text-center border-b-2 transition-colors ${activeTab === "saved" ? "border-[#D97706] text-[#D97706]" : "border-transparent text-slate-500"}`}>
          Saved
        </button>
      </div>

      <div className="p-4">
        
        {/* === TAB 1: MY LISTINGS (Seller Focus) === */}
        {activeTab === "listings" && (
          <div className="space-y-4">
             {loadingListings ? (
               <div className="text-center py-10 text-slate-400 text-sm">Loading listings...</div>
             ) : listings.length === 0 ? (
               <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm">
                 <span className="text-4xl block mb-3">🛍️</span>
                 <p className="text-slate-800 font-bold mb-1">Start selling in under 60 seconds</p>
                 <Link href="/sell" className="inline-block mt-3 bg-[#D97706] text-white px-6 py-2 rounded-lg font-bold text-sm active:scale-95 shadow-sm">+ Sell Item</Link>
               </div>
             ) : (
               listings.map((item) => {
                 const isSold = item.status === "sold";
                 const isPending = item.status === "pending";
                 const now = Date.now();
                 const isBoostedActive = item.isBoosted && item.boostExpiresAt > now;
                 const isFeaturedActive = item.isFeatured && item.featureExpiresAt > now;

                 return (
                   <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex flex-col gap-3">
                     <div className="flex gap-3">
                       <div className="w-20 h-20 bg-slate-100 rounded-lg flex-shrink-0 relative overflow-hidden border border-slate-200">
                         {item.images?.[0] ? (
                           <Image src={item.images[0]} alt={item.name} fill className="object-cover" sizes="80px" />
                         ) : <span className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-400">No Img</span>}
                         {isFeaturedActive && <span className="absolute bottom-0 left-0 right-0 bg-amber-500 text-white text-[8px] font-black text-center py-0.5 uppercase tracking-widest">Featured</span>}
                       </div>
                       <div className="flex-1 flex flex-col justify-between py-0.5">
                         <div>
                           <h3 className="text-sm font-bold text-slate-900 leading-tight line-clamp-1">{item.name}</h3>
                           <p className="text-sm font-extrabold text-slate-800 mt-1">UGX {(Number(item.price) || 0).toLocaleString()}</p>
                         </div>
                         <div className="flex items-center gap-2 mt-2">
                           <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide ${isSold ? "bg-slate-100 text-slate-600" : isPending ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                             {isSold ? "Sold" : isPending ? "Pending" : "Active"}
                           </span>
                           {isBoostedActive && <span className="text-[10px] text-amber-600 font-bold">🚀 Boosted</span>}
                         </div>
                       </div>
                     </div>

                     {/* Action Controls */}
                     <div className="grid grid-cols-2 gap-2 border-t border-slate-50 pt-3">
                       <Link href={`/edit/${item.publicId || item.id}`} className="text-[11px] font-bold text-center py-2 bg-slate-50 text-slate-600 rounded-md border border-slate-200 active:bg-slate-100">Edit</Link>
                       <button onClick={() => handleDeleteAd(item.id)} className="text-[11px] font-bold text-center py-2 bg-red-50 text-red-600 rounded-md active:bg-red-100 border border-red-100">Delete</button>
                       <button onClick={() => handleMarkAsSold(item.id)} disabled={isSold} className="text-[11px] font-bold text-center py-2 bg-slate-50 text-slate-600 rounded-md active:bg-slate-100 disabled:opacity-50 border border-slate-200">Mark Sold</button>
                       <button onClick={() => handleToggleUrgent(item)} className="text-[11px] font-bold py-2 rounded-md border border-slate-200 text-slate-600 bg-slate-50">
                         {item.isUrgent && item.urgentExpiresAt > now ? "🔴 Cancel Urgent" : "⚡ Make Urgent"}
                       </button>
                     </div>

                     {/* Premium Growth Controls */}
                     {!isSold && (
                       <div className="flex gap-2 mt-1">
                         <button 
                           onClick={() => handleBoostListing(item.id)} 
                           disabled={isBoostedActive || boostingId === item.id}
                           className={`flex-1 text-[11px] font-bold py-2 rounded-md transition-colors ${isBoostedActive ? "bg-green-50 text-green-700 opacity-80" : "bg-amber-100 text-amber-900 active:bg-amber-200"}`}
                         >
                           {boostingId === item.id ? "..." : isBoostedActive ? "🚀 Boost Active" : "🚀 Boost (24h)"}
                         </button>
                         <button 
                           onClick={() => handleFeatureItem(item.id)} 
                           disabled={isFeaturedActive || featuringId === item.id}
                           className={`flex-1 text-[11px] font-bold py-2 rounded-md transition-colors ${isFeaturedActive ? "bg-green-50 text-green-700 opacity-80" : "bg-slate-900 text-white active:bg-slate-800"}`}
                         >
                           {featuringId === item.id ? "..." : isFeaturedActive ? "⭐ Feature Active" : "⭐ Feature (7d)"}
                         </button>
                       </div>
                     )}
                   </div>
                 )
               })
             )}
          </div>
        )}

        {/* === TAB 2: ORDERS (Sales) === */}
        {activeTab === "sales" && (
          <div className="space-y-3">
            {loadingSales ? (
              <div className="text-center py-10 text-slate-400 text-sm">Loading orders...</div>
            ) : sales.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm">
                <span className="text-4xl block mb-3">📦</span>
                <p className="text-slate-800 font-bold mb-1">Your orders will appear here</p>
              </div>
            ) : (
              sales.map((order) => {
                const status = order.status || "pending";
                return (
                  <div key={order.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-xs text-slate-500 font-medium mb-0.5">Buyer: <span className="font-bold text-slate-800">{order.buyerName || order.contactPhone || "Guest"}</span></p>
                        <p className="text-sm font-bold text-slate-900">{order.items?.[0]?.productId || "Product Name"}</p>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-1 rounded-sm uppercase tracking-wide ${status === 'delivered' ? 'bg-green-100 text-green-700' : status === 'confirmed' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {status === 'pending' ? 'Awaiting Payment' : status === 'confirmed' ? 'Paid' : status === 'delivered' ? 'Completed' : status}
                      </span>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => handleSaleStatusChange(order.id, 'confirmed')} disabled={status !== 'pending'} className="flex-1 text-[11px] font-bold py-2 border border-slate-200 text-slate-700 rounded-lg active:bg-slate-50 disabled:opacity-50">Mark as Paid</button>
                      <button onClick={() => handleSaleStatusChange(order.id, 'delivered')} disabled={status === 'delivered'} className="flex-1 text-[11px] font-bold py-2 bg-slate-900 text-white rounded-lg active:bg-slate-800 disabled:opacity-50">Complete</button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* === TAB 3 & 4 (Purchases & Saved) === */}
        {activeTab === "purchases" && (
           <div className="space-y-3">
             {purchases.length === 0 ? <p className="text-center text-sm text-slate-500 py-10">No purchases yet.</p> : purchases.map(order => (
               <div key={order.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                 <div><p className="font-bold text-sm text-slate-900">Order {order.orderNumber}</p><p className="text-xs text-slate-500">UGX {(Number(order.total) || 0).toLocaleString()}</p></div>
                 <span className="text-[9px] font-bold bg-slate-100 px-2 py-1 rounded-sm uppercase">{order.status || 'pending'}</span>
               </div>
             ))}
           </div>
        )}

        {activeTab === "saved" && (
           <div className="grid grid-cols-2 gap-3">
             {savedItems.length === 0 ? <p className="col-span-2 text-center text-sm text-slate-500 py-10">Wishlist empty.</p> : savedItems.map(item => (
               <div key={item.id} className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                  <Link href={`/product/${item.publicId || item.id}`}>
                    <div className="aspect-square bg-slate-100 rounded-lg mb-2 relative overflow-hidden border border-slate-100">
                      {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" sizes="50vw" />}
                    </div>
                    <h3 className="text-xs font-bold line-clamp-1 text-slate-900">{item.name}</h3>
                  </Link>
                  <button onClick={() => handleRemoveSaved(item.id)} className="text-[10px] text-red-500 font-bold mt-2 w-full text-left py-1">✕ Remove</button>
               </div>
             ))}
           </div>
        )}

      </div>

      {/* 4. BOTTOM SECTION (Growth Hooks) */}
      <div className="px-4 mt-2 pb-8 pt-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Grow your business</p>
        <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x pb-2">
          
          <div className="snap-start flex-shrink-0 w-[200px] bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">🚀 Boost Listing</h4>
              <p className="text-[10px] text-slate-500 mb-2 leading-tight">Get 10x more views today. Click "Boost" on your active ads!</p>
            </div>
            <button onClick={() => setActiveTab('listings')} className="text-[10px] font-bold bg-amber-100 text-amber-900 px-3 py-1.5 rounded-md w-full">Go to Listings</button>
          </div>

          {verificationStatus !== "verified" && (
            <div className="snap-start flex-shrink-0 w-[200px] bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">🛡️ Get Verified</h4>
                <p className="text-[10px] text-slate-500 mb-2 leading-tight">Build trust with buyers by verifying your local business.</p>
              </div>
              <button 
                onClick={handleVerifyProfile}
                disabled={verificationStatus === "pending" || isVerifying}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-md w-full transition-colors ${verificationStatus === "pending" ? "bg-slate-100 text-slate-500" : "bg-blue-100 text-blue-900 active:bg-blue-200"}`}
              >
                {isVerifying ? "Submitting..." : verificationStatus === "pending" ? "Review Pending ⏳" : "Verify Profile"}
              </button>
            </div>
          )}

          <div className="snap-start flex-shrink-0 w-[200px] bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">⭐ Feature Item</h4>
              <p className="text-[10px] text-slate-500 mb-2 leading-tight">Pin your item to the top of the homepage for 7 days.</p>
            </div>
            <button onClick={() => setActiveTab('listings')} className="text-[10px] font-bold bg-slate-900 text-white px-3 py-1.5 rounded-md w-full">Go to Listings</button>
          </div>

        </div>
      </div>

      {/* 3. FLOATING ACTION BUTTON */}
      <Link 
        href="/sell" 
        className="fixed bottom-6 right-6 absolute sm:bottom-10 sm:-right-6 bg-[#D97706] text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-3xl pb-1 hover:bg-amber-600 active:scale-95 transition-transform z-50 border-2 border-white"
      >
        +
      </Link>

    </div>
  );
}
