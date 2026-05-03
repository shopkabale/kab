"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaStore, FaBox, FaArrowLeft, FaShieldAlt, FaPhone, FaEnvelope } from "react-icons/fa";

interface Seller {
  id: string;
  name: string;
  phone: string;
  email: string;
  productCount: number;
}

interface StatsData {
  totalSellers: number;
  totalProducts: number;
  sellers: Seller[];
}

export default function AdminSellersPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/seller-stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        } else {
          console.error("Failed to fetch seller stats");
        }
      } catch (error) {
        console.error("Network error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50">
        <FaShieldAlt className="text-[#D97706] text-3xl animate-pulse mb-3" />
        <h2 className="text-slate-900 font-black text-lg">Loading Seller Data...</h2>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50 pb-10">
      <div className="max-w-4xl mx-auto p-4 pt-8 w-full flex flex-col">
        
        <Link href="/admin" className="inline-flex items-center gap-2 text-slate-500 font-bold text-[12px] mb-6 hover:text-slate-900 transition-colors uppercase tracking-wider">
          <FaArrowLeft /> Back to Admin Hub
        </Link>

        <div className="mb-6 border-b border-slate-200 pb-4">
          <span className="text-[#D97706] font-black tracking-widest uppercase text-[10px] mb-1 block">Platform Analytics</span>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900">Seller Network</h1>
        </div>

        {/* TOP LEVEL STATS */}
        <div className="grid grid-cols-2 gap-4 mb-8 w-full">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm w-full flex flex-col">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <FaStore className="text-[16px]" />
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Total Sellers</p>
            </div>
            <p className="text-3xl md:text-4xl font-black text-slate-900">{stats?.totalSellers || 0}</p>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm w-full flex flex-col">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <FaBox className="text-[16px]" />
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Live Products</p>
            </div>
            <p className="text-3xl md:text-4xl font-black text-[#D97706]">{stats?.totalProducts || 0}</p>
          </div>
        </div>

        {/* SELLER LEADERBOARD */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm w-full overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="font-black text-slate-900 text-[16px]">Seller Inventory Leaderboard</h2>
            <p className="text-[12px] text-slate-500 font-medium mt-1">Ranked by volume of uploaded items.</p>
          </div>

          <div className="flex flex-col">
            {stats?.sellers.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm font-bold">No sellers found.</div>
            ) : (
              stats?.sellers.map((seller, index) => (
                <div key={seller.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors gap-3">
                  
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-8 font-black text-slate-300 text-lg flex-shrink-0">
                      #{index + 1}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-black text-slate-900 text-[14px] truncate">{seller.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500"><FaPhone className="text-slate-400" /> {seller.phone}</span>
                        <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500"><FaEnvelope className="text-slate-400" /> {seller.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-12 md:pl-0 flex-shrink-0">
                    <span className="bg-amber-100 text-[#D97706] px-3 py-1.5 rounded-lg font-black text-[12px] flex items-center gap-1.5">
                      <FaBox /> {seller.productCount} {seller.productCount === 1 ? 'Item' : 'Items'}
                    </span>
                  </div>

                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
