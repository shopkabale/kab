"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth(); // Let your custom hook do all the heavy lifting
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Keep the VIP cookie fresh or clear it based on the user's role
  useEffect(() => {
    if (!loading) {
      if (user?.role === "admin") {
        document.cookie = "kabale_admin_session=true; path=/; max-age=86400; secure; samesite=strict";
      } else {
        document.cookie = "kabale_admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-slate-500 bg-slate-50">
        <div className="w-8 h-8 border-4 border-[#D97706] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold animate-pulse">Verifying Admin Credentials...</p>
      </div>
    );
  }

  // Reject if there is no user, OR if they don't have the secure admin role
  if (!user || user.role !== "admin") {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 px-4 text-center">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 text-4xl shadow-sm">⛔</div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-4">Classified Area</h1>
        <p className="text-slate-600 mb-8 max-w-md">You need Administrator privileges to access the Command Center.</p>
        <Link href="/" className="bg-[#D97706] text-white px-8 py-4 rounded-xl font-bold hover:bg-amber-600 transition-colors shadow-md">
          Return to Marketplace
        </Link>
      </div>
    );
  }

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: "📊" },
    { name: "Official Store", href: "/admin/official", icon: "🏪" },
{ name: "WhatsApp Inbox", href: "/admin/inbox", icon: "💬" },
{ name: "Verifications", href: "/admin/verify", icon: "🛡️" },
    { name: "Upload Official Item", href: "/admin/upload", icon: "✨" }, 
    { name: "All Products", href: "/admin/products", icon: "📦" },
    { name: "Blogs Center", href: "/admin/blog", icon: "💬" },
    { name: "Orders", href: "/admin/orders", icon: "🛒" },
    { name: "Users", href: "/admin/users", icon: "👥" },
    { name: "Search Logs", href: "/admin/searches", icon: "🔍" },
  ];

  const safeDisplayName = user.displayName || "Admin";
  const safeFirstLetter = safeDisplayName.charAt(0) || "A";

  return (
    <div className="fixed inset-0 z-50 flex bg-slate-50 overflow-hidden font-sans">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-72 bg-slate-950 text-white flex-col flex-shrink-0 shadow-2xl z-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950 opacity-50 pointer-events-none"></div>
        <div className="h-20 flex items-center px-8 border-b border-slate-800 relative z-10">
          <Link href="/" className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span className="text-3xl">🛡️</span>
            <div>Kabale<span className="text-[#D97706]">Admin</span></div>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-8 px-4 space-y-2 relative z-10">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href} className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all duration-200 ${isActive ? "bg-[#D97706] text-white shadow-lg shadow-amber-900/20 translate-x-1" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
                <span className={`text-xl ${isActive ? 'opacity-100' : 'opacity-70'}`}>{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-6 border-t border-slate-800 relative z-10 bg-slate-950/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#D97706] to-amber-400 flex items-center justify-center font-black text-white shadow-inner text-lg">
              {safeFirstLetter}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{safeDisplayName}</p>
              <p className="text-[10px] text-[#D97706] uppercase tracking-widest font-black mt-0.5">System Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE OVERLAY & SLIDING MENU */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      <aside className={`fixed inset-y-0 left-0 w-72 bg-slate-950 text-white flex flex-col z-50 transform transition-transform duration-300 ease-in-out md:hidden shadow-2xl ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800">
          <Link href="/" className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <span>🛡️</span> Kabale<span className="text-[#D97706]">Admin</span>
          </Link>
          <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href} className={`flex items-center gap-4 px-4 py-3.5 rounded-xl font-bold transition-all ${isActive ? "bg-[#D97706] text-white shadow-md" : "text-slate-400 hover:bg-slate-800"}`}>
                <span className="text-xl">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10 bg-slate-50/50">
        <header className="md:hidden h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 shadow-sm sticky top-0 z-30">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <Link href="/admin" className="text-lg font-black tracking-tight text-slate-900 absolute left-1/2 -translate-x-1/2">
            Kabale<span className="text-[#D97706]">Admin</span>
          </Link>
          <div className="w-8 h-8 rounded-full bg-[#D97706] text-white flex items-center justify-center font-bold text-xs shadow-md">
            {safeFirstLetter}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-10">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
