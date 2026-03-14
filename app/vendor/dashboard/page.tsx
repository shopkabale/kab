"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Store } from "@/types";

export default function VendorDashboardOverview() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    outOfStock: 0,
  });

  useEffect(() => {
    // Security redirect: Kick out users who aren't vendors
    if (!authLoading && user?.role !== "vendor") {
      router.push("/profile");
      return;
    }

    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        // 1. Fetch the user's Store document
        const storeQuery = query(collection(db, "stores"), where("vendorId", "==", user.id));
        const storeSnapshot = await getDocs(storeQuery);

        if (!storeSnapshot.empty) {
          const storeData = { id: storeSnapshot.docs[0].id, ...storeSnapshot.docs[0].data() } as Store;
          setStore(storeData);

          // 2. Fetch basic product stats for this specific store
          const productsQuery = query(collection(db, "products"), where("sellerId", "==", user.id));
          const productsSnapshot = await getDocs(productsQuery);
          
          let totalProducts = 0;
          let outOfStock = 0;

          productsSnapshot.forEach((doc) => {
            totalProducts++;
            const productData = doc.data();
            if (productData.stock <= 0 || productData.status === "sold_out") {
              outOfStock++;
            }
          });

          setStats({ totalProducts, outOfStock });
        } else {
          // Edge case: They have the vendor role but no store doc exists
          router.push("/store/upgrade");
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!store) return null;

  // Calculate Subscription Days Remaining
  const now = Date.now();
  const expiresAt = store.expiresAt || now;
  const msRemaining = expiresAt - now;
  const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
  const isExpired = daysRemaining <= 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Welcome back, {store.name}</h1>
          <p className="text-slate-500 mt-1">Here is what is happening with your Kabale Online store today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href={`/store/${store.slug}`}
            target="_blank"
            className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-5 py-2.5 rounded-xl font-bold text-sm transition-colors"
          >
            View Public Store
          </Link>
          <Link 
            href="/vendor/products/new"
            className="bg-amber-500 text-white hover:bg-amber-600 px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-colors"
          >
            + Add Product
          </Link>
        </div>
      </div>

      {/* Subscription Alert (Only shows if expiring soon or expired) */}
      {isExpired ? (
        <div className="bg-red-50 border border-red-200 p-6 rounded-2xl flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
          <div>
            <h3 className="text-red-800 font-bold text-lg">Subscription Expired</h3>
            <p className="text-red-600 text-sm mt-1">Your store is currently hidden from the marketplace. Renew to restore access.</p>
          </div>
          <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold shadow-sm whitespace-nowrap">
            Renew for 20,000 UGX
          </button>
        </div>
      ) : daysRemaining <= 5 ? (
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
          <div>
            <h3 className="text-amber-800 font-bold text-lg">Subscription Expiring Soon</h3>
            <p className="text-amber-700 text-sm mt-1">Your store subscription expires in <span className="font-extrabold">{daysRemaining} days</span>.</p>
          </div>
          <button className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg font-bold shadow-sm whitespace-nowrap">
            Extend Subscription
          </button>
        </div>
      ) : null}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Products */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-bold text-sm uppercase tracking-wider">Total Products</h3>
            <span className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-lg">📦</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{stats.totalProducts}</div>
          <Link href="/vendor/products" className="text-blue-600 text-sm font-bold mt-4 hover:underline">Manage inventory →</Link>
        </div>

        {/* Stock Warnings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-bold text-sm uppercase tracking-wider">Out of Stock</h3>
            <span className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-lg">⚠️</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{stats.outOfStock}</div>
          <Link href="/vendor/products?filter=empty" className="text-red-600 text-sm font-bold mt-4 hover:underline">Update quantities →</Link>
        </div>

        {/* Store Rating Placeholder */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-bold text-sm uppercase tracking-wider">Store Rating</h3>
            <span className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center text-lg">⭐</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {store.rating ? store.rating.toFixed(1) : "New"} 
            <span className="text-lg text-slate-400 font-normal ml-1">/ 5.0</span>
          </div>
          <p className="text-slate-500 text-sm font-medium mt-4">Based on {store.ratingCount || 0} reviews</p>
        </div>

        {/* Subscription Status */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-bold text-sm uppercase tracking-wider">Subscription</h3>
            <span className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center text-lg">💳</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {isExpired ? "Expired" : "Active"}
          </div>
          <p className="text-slate-500 text-sm font-medium mt-4">
            {!isExpired && `${daysRemaining} days remaining`}
          </p>
        </div>

      </div>

    </div>
  );
}
