"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaBox, FaArrowLeft, FaShieldAlt, FaPhone, FaEnvelope, FaExclamationTriangle, FaUserCheck } from "react-icons/fa";

interface Seller {
  id: string;
  name: string;
  phone: string;
  email: string;
  productCount: number;
  isOrphan: boolean;
}

interface AuditData {
  totalOwners: number;
  totalProducts: number;
  sellers: Seller[];
}

export default function AdminInventoryAuditPage() {
  const [audit, setAudit] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAudit = async () => {
      try {
        const res = await fetch("/api/admin/seller-stats");
        if (res.ok) {
          const data = await res.json();
          setAudit(data);
        } else {
          console.error("Failed to fetch audit stats");
        }
      } catch (error) {
        console.error("Network error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAudit();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50">
        <FaShieldAlt className="text-[#D97706] text-3xl animate-pulse mb-3" />
        <h2 className="text-slate-900 font-black text-lg">Scanning Database...</h2>
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
          <span className="text-[#D97706] font-black tracking-widest uppercase text-[10px] mb-1 block">Security & Operations</span>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900">Inventory Ownership Audit</h1>
          <p className="text-slate-500 text-[13px] font-medium mt-1">A strict reverse-lookup of every product currently in the database.</p>
        </div>

        {/* TOP LEVEL STATS */}
        <div className="grid grid-cols-2 gap-4 mb-8 w-full">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm w-full flex flex-col">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <FaBox className="text-[16px]" />
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Total Live Items</p>
            </div>
            <p className="text-3xl md:text-4xl font-black text-[#D97706]">{audit?.totalProducts || 0}</p>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm w-full flex flex-col">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <FaUserCheck className="text-[16px]" />
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Unique Owners</p>
            </div>
            <p className="text-3xl md:text-4xl font-black text-slate-900">{audit?.totalOwners || 0}</p>
          </div>
        </div>

        {/* OWNERSHIP AUDIT LIST */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm w-full overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="font-black text-slate-900 text-[16px]">Ownership Breakdown</h2>
              <p className="text-[12px] text-slate-500 font-medium mt-1">Find out exactly who is attached to the {audit?.totalProducts} items.</p>
            </div>
          </div>

          <div className="flex flex-col">
            {audit?.sellers.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm font-bold">No products found in the database.</div>
            ) : (
              audit?.sellers.map((owner, index) => (
                <div key={owner.id} className={`flex flex-col md:flex-row md:items-center justify-between p-4 border-b border-slate-50 transition-colors gap-3 ${owner.isOrphan ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-slate-50'}`}>
                  
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-8 font-black text-lg flex-shrink-0 ${owner.isOrphan ? 'text-red-300' : 'text-slate-300'}`}>
                      #{index + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-black text-[14px] truncate ${owner.isOrphan ? 'text-red-900' : 'text-slate-900'}`}>
                          {owner.name}
                        </h3>
                        {owner.isOrphan && (
                          <span className="bg-red-200 text-red-800 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                            <FaExclamationTriangle /> Ghost
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`flex items-center gap-1 text-[11px] font-bold ${owner.isOrphan ? 'text-red-600' : 'text-slate-500'}`}>
                          <FaPhone className={owner.isOrphan ? 'text-red-400' : 'text-slate-400'} /> {owner.phone}
                        </span>
                        <span className={`flex items-center gap-1 text-[11px] font-bold ${owner.isOrphan ? 'text-red-600' : 'text-slate-500'}`}>
                          <FaEnvelope className={owner.isOrphan ? 'text-red-400' : 'text-slate-400'} /> {owner.email}
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-slate-400 mt-1">ID: {owner.id}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-12 md:pl-0 flex-shrink-0">
                    <span className={`px-3 py-1.5 rounded-lg font-black text-[12px] flex items-center gap-1.5 ${owner.isOrphan ? 'bg-red-200 text-red-900' : 'bg-slate-900 text-white'}`}>
                      <FaBox /> {owner.productCount} {owner.productCount === 1 ? 'Item' : 'Items'}
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
