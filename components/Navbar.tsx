// components/Navbar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import SearchBar from "@/components/SearchBar";

export default function Navbar({ bannerVisible }: { bannerVisible: boolean }) {
  const pathname = usePathname();
  const { user, loading, signIn, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  // Hide this navbar entirely on admin pages
  if (pathname?.startsWith("/admin")) {
    return null; 
  }

  // Helper to check if a link is active
  const isActive = (path: string) => pathname === path;

  // Helper to close menu
  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm transition-opacity xl:hidden"
          onClick={closeMenu}
        />
      )}

      <nav className={`fixed w-full ${bannerVisible ? "top-8" : "top-0"} bg-white/95 backdrop-blur-md border-b border-slate-200 z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 gap-4 sm:gap-6">

            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-black text-slate-900 tracking-tight">
                Kabale<span className="text-[#D97706]">Online</span>
              </Link>
            </div>

            {/* Desktop Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md justify-center">
              <SearchBar />
            </div>

            {/* ============================================== */}
            {/* DESKTOP MENU                                   */}
            {/* ============================================== */}
            <div className="hidden xl:flex items-center space-x-6">
              <Link href="/products" className={`text-sm font-semibold transition-colors ${isActive('/products') ? 'text-[#D97706]' : 'text-slate-600 hover:text-[#D97706]'}`}>All Items</Link>
              <Link href="/category/electronics" className={`text-sm font-semibold transition-colors ${isActive('/category/electronics') ? 'text-[#D97706]' : 'text-slate-600 hover:text-[#D97706]'}`}>Electronics</Link>
              <Link href="/category/agriculture" className={`text-sm font-semibold transition-colors ${isActive('/category/agriculture') ? 'text-[#D97706]' : 'text-slate-600 hover:text-[#D97706]'}`}>Agriculture</Link>
              <Link href="/category/student_item" className={`text-sm font-semibold transition-colors ${isActive('/category/student_item') ? 'text-[#D97706]' : 'text-slate-600 hover:text-[#D97706]'}`}>Student Market</Link>
              <Link href="/requests" className={`text-sm font-semibold transition-colors ${isActive('/requests') ? 'text-[#D97706]' : 'text-slate-600 hover:text-[#D97706]'}`}>Requests</Link>
              <Link href="/blog" className={`text-sm font-semibold transition-colors ${isActive('/blog') ? 'text-[#D97706]' : 'text-slate-600 hover:text-[#D97706]'}`}>Journal</Link>

              {/* Desktop AI Guide Link */}
              <Link href="/ai" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${isActive('/ai') ? 'text-[#D97706] bg-amber-50' : 'text-slate-700 hover:text-[#D97706] hover:bg-slate-50'}`}>
                <span className="text-[#D97706] text-base leading-none">✨</span> 
                <span className="text-sm font-bold">AI Guide</span>
              </Link>

              <div className="h-5 w-px bg-slate-200 mx-2"></div>

              <Link href="/sell" className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm">
                <span>➕</span> Post Your Item
              </Link>

              {/* Desktop User Authentication Display */}
              {loading ? (
                <div className="h-6 w-6 rounded-full border-2 border-[#D97706] border-t-transparent animate-spin ml-4"></div>
              ) : user ? (
                <div className="flex items-center gap-4 relative group ml-2">
                  <div className="flex flex-col text-right">
                    <span className="text-xs text-slate-500 font-medium">Hello,</span>
                    <span className="text-sm font-bold text-slate-900 leading-none">{(user.displayName || "User").split(' ')[0]}</span>
                  </div>
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-[#D97706] text-white flex items-center justify-center font-bold border-2 border-white shadow-sm cursor-pointer overflow-hidden">
                       {user.photoURL ? (
                         <img src={user.photoURL} alt="profile" className="w-full h-full object-cover" />
                       ) : (
                         (user.displayName || "U").charAt(0).toUpperCase()
                       )}
                    </div>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                      <Link href="/profile" className="block px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#D97706]">My Profile & Orders</Link>
                      <Link href="/sell" className="block px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#D97706]">My Listings</Link>
                      <hr className="my-2 border-slate-100" />
                      <button onClick={signOut} className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">Sign Out</button>
                    </div>
                  </div>
                </div>
              ) : (
                <button onClick={signIn} className="rounded-lg bg-white border-2 border-slate-200 px-5 py-2 text-sm font-bold text-slate-700 hover:border-[#D97706] hover:text-[#D97706] transition-colors ml-2">
                  Log In
                </button>
              )}
            </div>

            {/* ============================================== */}
            {/* MOBILE TOGGLE BUTTONS                          */}
            {/* ============================================== */}
            <div className="flex items-center xl:hidden gap-3">
               <Link href="/sell" className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm">
                Post Item
              </Link>
              
              {/* 🚀 SIMPLE ANIMATED HAMBURGER ICON 🚀 */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="relative z-50 flex flex-col justify-center items-center w-8 h-8 focus:outline-none text-slate-800"
                aria-label="Toggle menu"
              >
                <span className={`bg-current block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${isMobileMenuOpen ? 'rotate-45 translate-y-1' : '-translate-y-1'}`} />
                <span className={`bg-current block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm my-0.5 ${isMobileMenuOpen ? 'opacity-0' : 'opacity-100'}`} />
                <span className={`bg-current block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${isMobileMenuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* ============================================== */}
        {/* SIMPLE MOBILE DROPDOWN MENU                    */}
        {/* ============================================== */}
        <div 
          className={`xl:hidden absolute w-full bg-white border-t border-slate-200 shadow-xl transition-all duration-300 ease-in-out origin-top ${
            isMobileMenuOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'
          } max-h-[calc(100dvh-3.5rem)] overflow-y-auto overscroll-contain`}
        >
          {/* 🚀 DEEP PADDING ADDED HERE (pb-48) TO PREVENT CUTOFFS 🚀 */}
          <div className="flex flex-col px-6 pt-6 pb-48 space-y-5">
            
            {/* Mobile Search */}
            <div className="md:hidden mb-2">
              <SearchBar onSearch={closeMenu} />
            </div>

            {/* Simple List of Links */}
            <Link href="/products" onClick={closeMenu} className={`text-xl font-bold ${isActive('/products') ? 'text-[#D97706]' : 'text-slate-800 hover:text-[#D97706]'}`}>Browse All Items</Link>
            <Link href="/category/electronics" onClick={closeMenu} className={`text-xl font-bold ${isActive('/category/electronics') ? 'text-[#D97706]' : 'text-slate-800 hover:text-[#D97706]'}`}>Electronics</Link>
            <Link href="/category/agriculture" onClick={closeMenu} className={`text-xl font-bold ${isActive('/category/agriculture') ? 'text-[#D97706]' : 'text-slate-800 hover:text-[#D97706]'}`}>Agriculture</Link>
            <Link href="/category/student_item" onClick={closeMenu} className={`text-xl font-bold ${isActive('/category/student_item') ? 'text-[#D97706]' : 'text-slate-800 hover:text-[#D97706]'}`}>Student Market</Link>
            <Link href="/requests" onClick={closeMenu} className={`text-xl font-bold ${isActive('/requests') ? 'text-[#D97706]' : 'text-slate-800 hover:text-[#D97706]'}`}>Buyer Requests</Link>
            <Link href="/blog" onClick={closeMenu} className={`text-xl font-bold ${isActive('/blog') ? 'text-[#D97706]' : 'text-slate-800 hover:text-[#D97706]'}`}>Journal & News</Link>

            {/* AI Guide Link */}
            <Link href="/ai" onClick={closeMenu} className={`text-xl font-bold flex items-center gap-2 mt-2 ${isActive('/ai') ? 'text-[#D97706]' : 'text-[#D97706] hover:opacity-80'}`}>
              <span className="text-2xl leading-none">✨</span> AI Shopping Guide
            </Link>

            <hr className="border-slate-200 my-4" />

            {/* Simple Auth Section */}
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="h-8 w-8 rounded-full border-2 border-[#D97706] border-t-transparent animate-spin"></div>
              </div>
            ) : user ? (
              <div className="flex flex-col space-y-4">
                <div className="flex items-center gap-3">
                   <div className="w-12 h-12 rounded-full bg-[#D97706] text-white flex items-center justify-center font-bold overflow-hidden shadow-sm">
                       {user.photoURL ? <img src={user.photoURL} alt="profile" className="w-full h-full object-cover" /> : (user.displayName || "U").charAt(0).toUpperCase()}
                   </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Logged in as</p>
                    <p className="text-lg font-bold text-slate-900">{user.displayName || "Kabale User"}</p>
                  </div>
                </div>
                <Link href="/profile" onClick={closeMenu} className="w-full text-center rounded-xl bg-slate-100 px-4 py-3 text-lg font-bold text-slate-800 hover:bg-slate-200 transition-colors">
                  My Profile & Orders
                </Link>
                <button onClick={() => { signOut(); closeMenu(); }} className="w-full text-center rounded-xl bg-red-50 px-4 py-3 text-lg font-bold text-red-600 hover:bg-red-100 transition-colors">
                  Log Out
                </button>
              </div>
            ) : (
              <button onClick={() => { signIn(); closeMenu(); }} className="w-full flex justify-center rounded-xl bg-[#D97706] px-4 py-3.5 text-lg font-bold text-white shadow-sm hover:bg-amber-600 transition-colors">
                Log In / Register
              </button>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
