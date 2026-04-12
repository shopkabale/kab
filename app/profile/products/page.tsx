"use client";

import { useAuth } from "@/components/AuthProvider";
import ListingsTab from "@/components/dashboard/ListingsTab";
import Link from "next/link";
import { ArrowLeft } from "lucide-react"; 

export default function ProductsPage() {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-10 text-center animate-pulse text-slate-400">Loading...</div>;
  if (!user) return <div className="p-10 text-center">Please log in.</div>;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 pb-24">
      <div className="bg-white px-4 py-4 border-b border-slate-200 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <Link href="/profile" className="p-2 -ml-2 bg-slate-100 rounded-full text-slate-600 active:bg-slate-200 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-lg font-black text-slate-900">My Products</h1>
      </div>
      <div className="p-4">
        {/* We pass true since if they click this, they likely intend to manage inventory */}
        <ListingsTab userId={user.id} hasInventory={true} />
      </div>
    </div>
  );
}
