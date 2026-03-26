"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

export default function AdminOverview() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalSearches: 0,
    totalBotChats: 0, // 👈 NEW: Unique phone numbers that interacted
    totalMessages: 0, // 👈 NEW: Total messages sent/received
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!user || user.role !== "admin") return;
      try {
        const res = await fetch(`/api/admin/stats?adminId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  return (
    <div className="max-w-6xl mx-auto pb-20 md:pb-0">
      <div className="mb-8 border-b border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Dashboard Overview</h1>
          <p className="text-slate-600 mt-2 font-medium">System health, marketplace metrics, and bot activity at a glance.</p>
        </div>
        <div className="bg-primary/10 text-primary px-4 py-2 rounded-lg font-bold text-sm border border-primary/20 shadow-sm">
          Admin Mode Active
        </div>
      </div>

      {loading ? (
        // 👈 Expanded skeleton loaders to 7 cards, adjusted grid to 4 columns
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-pulse h-32"></div>
          ))}
        </div>
      ) : (
        // 👈 Changed grid layout to gracefully wrap 7 cards
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden xl:col-span-2">
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl">💰</div>
            </div>
            <div className="relative z-10">
              <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Platform Volume</p>
              <h3 className="text-2xl sm:text-4xl font-black text-slate-900">UGX {stats.totalRevenue.toLocaleString()}</h3>
            </div>
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">👥</div>
            </div>
            <div>
              <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Users</p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900">{stats.totalUsers}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">📦</div>
            </div>
            <div>
              <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Active Products</p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900">{stats.totalProducts}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl">🛒</div>
            </div>
            <div>
              <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Orders</p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900">{stats.totalOrders}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl">🔍</div>
            </div>
            <div>
              <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Search Queries</p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900">{stats.totalSearches || 0}</h3>
            </div>
          </div>

          {/* 👈 NEW CARD: Bot Chats Started */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center text-xl">🤖</div>
            </div>
            <div>
              <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Bot Chats</p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900">{stats.totalBotChats || 0}</h3>
            </div>
          </div>

          {/* 👈 NEW CARD: Total Messages Sent */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl">💬</div>
            </div>
            <div>
              <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Messages</p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900">{stats.totalMessages || 0}</h3>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
