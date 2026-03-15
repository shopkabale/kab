"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";
import { Order, Product } from "@/types";

export default function VendorAnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Security redirect
    if (!authLoading && user?.role !== "vendor") {
      router.push("/profile");
      return;
    }

    const fetchAnalyticsData = async () => {
      if (!user) return;
      
      try {
        // Fetch both Orders and Products simultaneously for performance
        const [ordersRes, productsRes] = await Promise.all([
          fetch(`/api/orders/vendor?sellerId=${user.id}`),
          fetch(`/api/products/user?userId=${user.id}`)
        ]);

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setOrders(ordersData.orders || []);
        }

        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProducts(productsData.products || []);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAnalyticsData();
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- ANALYTICS CALCULATIONS ---
  
  // 1. Revenue (Only count 'delivered' orders for actual earnings)
  const totalRevenue = orders
    .filter(order => order.status === "delivered")
    .reduce((sum, order) => sum + (Number(order.total) || 0), 0);

  // 2. Pending Revenue (Orders not yet delivered)
  const pendingRevenue = orders
    .filter(order => order.status !== "delivered")
    .reduce((sum, order) => sum + (Number(order.total) || 0), 0);

  // 3. Total Product Views
  const totalViews = products.reduce((sum, product) => sum + (product.views || 0), 0);

  // 4. Conversion Rate Approximation (Total Orders / Total Views)
  const conversionRate = totalViews > 0 ? ((orders.length / totalViews) * 100).toFixed(1) : "0.0";

  // 5. Top Performing Products (Sorted by lowest stock / assumed most sales)
  const topProducts = [...products]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Store Analytics 📈</h1>
        <p className="text-slate-500 mt-2 font-medium">Track your performance, sales, and product views on Kabale Online.</p>
      </div>

      {/* Top Level Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-2xl shadow-lg text-white">
          <p className="text-emerald-100 text-xs font-black uppercase tracking-wider mb-2">Total Earnings</p>
          <div className="text-3xl font-black mb-1">UGX {totalRevenue.toLocaleString()}</div>
          <p className="text-sm font-medium text-emerald-100">From delivered orders</p>
        </div>

        {/* Pending Revenue */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <p className="text-slate-400 text-xs font-black uppercase tracking-wider mb-2">Pending Cash</p>
          <div className="text-3xl font-black text-slate-900 mb-1">UGX {pendingRevenue.toLocaleString()}</div>
          <p className="text-sm font-medium text-amber-500">Awaiting delivery</p>
        </div>

        {/* Store Views */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <p className="text-slate-400 text-xs font-black uppercase tracking-wider mb-2">Total Product Views</p>
          <div className="text-3xl font-black text-slate-900 mb-1">{totalViews.toLocaleString()}</div>
          <p className="text-sm font-medium text-blue-500">Across {products.length} items</p>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <p className="text-slate-400 text-xs font-black uppercase tracking-wider mb-2">Conversion Rate</p>
          <div className="text-3xl font-black text-slate-900 mb-1">{conversionRate}%</div>
          <p className="text-sm font-medium text-purple-500">Views to Orders</p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Order Status Breakdown (CSS Bar Chart) */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-6">Order Pipeline</h2>
          
          <div className="space-y-5">
            {["pending", "confirmed", "out_for_delivery", "delivered"].map((status) => {
              const count = orders.filter(o => o.status === status).length;
              const percentage = orders.length > 0 ? Math.round((count / orders.length) * 100) : 0;
              
              const colorClass = 
                status === 'delivered' ? 'bg-green-500' :
                status === 'out_for_delivery' ? 'bg-purple-500' :
                status === 'confirmed' ? 'bg-blue-500' : 'bg-amber-500';

              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-bold text-slate-700 uppercase text-xs">{status.replace(/_/g, ' ')}</span>
                    <span className="font-black text-slate-900">{count}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div className={`${colorClass} h-2.5 rounded-full transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Performing Products */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Most Viewed Products</h2>
            <button onClick={() => router.push('/vendor/products')} className="text-sm font-bold text-amber-600 hover:text-amber-700">View All →</button>
          </div>

          {topProducts.length === 0 ? (
            <div className="text-center py-8 text-slate-500 font-medium">No product data available yet.</div>
          ) : (
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  
                  {/* Rank Number */}
                  <div className="w-8 flex-shrink-0 text-center font-black text-slate-300 text-xl">
                    #{index + 1}
                  </div>

                  {/* Thumbnail */}
                  <div className="relative h-12 w-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                    {product.images?.[0] ? (
                      <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-400 font-bold uppercase">No Img</div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-grow min-w-0">
                    <h3 className="text-sm font-black text-slate-900 truncate uppercase">{product.name}</h3>
                    <p className="text-xs font-bold text-amber-600">UGX {Number(product.price).toLocaleString()}</p>
                  </div>

                  {/* Views Stat */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-black text-slate-900">{product.views || 0}</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Views</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
