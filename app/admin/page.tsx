"use client";

import { useEffect, useState } from "react";

export default function AdminOverview() {
  const [loading, setLoading] = useState(true);

  // We will wire this up to a real API in Phase 2
  const stats = {
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
  };

  useEffect(() => {
    // Simulate fetching dashboard stats
    setTimeout(() => setLoading(false), 800);
  }, []);

  return (
    <div className="max-w-6xl mx-auto pb-20 md:pb-0">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-600 mt-2 font-medium">System health and marketplace metrics at a glance.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-pulse h-32"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">👥</div>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Users</p>
              <h3 className="text-3xl font-black text-slate-900">{stats.totalUsers}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">📦</div>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Active Products</p>
              <h3 className="text-3xl font-black text-slate-900">{stats.totalProducts}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl">🛒</div>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Orders</p>
              <h3 className="text-3xl font-black text-slate-900">{stats.totalOrders}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl">💰</div>
            </div>
            <div className="relative z-10">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Platform Volume</p>
              <h3 className="text-2xl font-black text-slate-900">UGX {stats.totalRevenue.toLocaleString()}</h3>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-xl"></div>
          </div>

        </div>
      )}

      {/* Placeholder for Quick Actions */}
      <div className="bg-slate-900 rounded-3xl p-8 text-white mt-8 shadow-xl">
        <h2 className="text-xl font-bold mb-2">Welcome to your Command Center</h2>
        <p className="text-slate-400 mb-6 max-w-2xl">Use the sidebar to navigate through your products, manage COD orders, and oversee your registered users and vendors.</p>
      </div>

    </div>
  );
}