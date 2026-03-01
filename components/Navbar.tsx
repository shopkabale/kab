"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import SearchBar from "@/components/SearchBar";

export default function Navbar() {
  const { user, loading, signIn, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Prevent scrolling on the body when the mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Glassmorphism Background Blur Overlay for Mobile Menu */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm transition-opacity xl:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-4 sm:gap-6">
            
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-black text-slate-900 tracking-tight">
                Kabale<span className="text-primary">Online</span>
              </Link>
            </div>

            {/* Desktop Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md justify-center">
              <SearchBar />
            </div>
            
            {/* Desktop Navigation & Auth (Visible on large screens) */}
            <div className="hidden xl:flex items-center space-x-6">
              <Link href="/products" className="text-slate-600 hover:text-primary text-sm font-semibold transition-colors">
                All Items
              </Link>
              <Link href="/category/electronics" className="text-slate-600 hover:text-primary text-sm font-semibold transition-colors">
                Electronics
              </Link>
              <Link href="/category/agriculture" className="text-slate-600 hover:text-primary text-sm font-semibold transition-colors">
                Agriculture
              </Link>
              <Link href="/category/student_item" className="text-slate-600 hover:text-primary text-sm font-semibold transition-colors">
                Student Market
              </Link>

              <div className="h-5 w-px bg-slate-200 mx-2"></div>

              {/* Prominent Sell Button */}
              <Link href="/sell" className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm">
                <span>➕</span> Post Ad
              </Link>

              {loading ? (
                <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin ml-4"></div>
              ) : user ? (
                <div className="flex items-center gap-4 relative group ml-2">
                  <div className="flex flex-col text-right">
                    <span className="text-xs text-slate-500 font-medium">Hello,</span>
                    <span className="text-sm font-bold text-slate-900 leading-none">{user.displayName.split(' ')[0]}</span>
                  </div>
                  {/* Hover Dropdown for Profile Actions */}
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold border-2 border-white shadow-sm cursor-pointer overflow-hidden">
                       {user.photoURL ? (
                         <img src={user.photoURL} alt="profile" className="w-full h-full object-cover" />
                       ) : user.displayName.charAt(0)}
                    </div>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                      <Link href="/profile" className="block px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-primary">
                        My Profile & Orders
                      </Link>
                      <Link href="/sell" className="block px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-primary">
                        My Listings
                      </Link>
                      <hr className="my-2 border-slate-100" />
                      <button onClick={signOut} className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={signIn}
                  className="rounded-lg bg-white border-2 border-slate-200 px-5 py-2 text-sm font-bold text-slate-700 hover:border-primary hover:text-primary transition-colors ml-2"
                >
                  Log In
                </button>
              )}
            </div>

            {/* Mobile & Tablet Controls (Visible on smaller screens) */}
            <div className="flex items-center xl:hidden gap-3">
               <Link href="/sell" className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm">
                Post Ad
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="relative z-50 inline-flex items-center justify-center p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              >
                <span className="sr-only">Open main menu</span>
                {!isMobileMenuOpen ? (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <div className={`xl:hidden absolute w-full bg-white border-t border-slate-200 shadow-xl transition-all duration-300 ease-in-out origin-top ${isMobileMenuOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'}`}>
          
          {/* Mobile Search Bar */}
          <div className="px-4 pt-4 pb-2 md:hidden">
            <SearchBar />
          </div>

          <div className="px-4 py-4 space-y-2 border-b border-slate-100">
            <Link href="/products" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 rounded-lg text-base font-semibold text-slate-700 hover:text-primary hover:bg-slate-50">
              Browse All Items
            </Link>
            <Link href="/category/electronics" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 rounded-lg text-base font-semibold text-slate-700 hover:text-primary hover:bg-slate-50">
              Electronics
            </Link>
            <Link href="/category/agriculture" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 rounded-lg text-base font-semibold text-slate-700 hover:text-primary hover:bg-slate-50">
              Agriculture
            </Link>
            <Link href="/category/student_item" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 rounded-lg text-base font-semibold text-slate-700 hover:text-primary hover:bg-slate-50">
              Student Market
            </Link>
          </div>
          
          {/* Mobile Auth Section */}
          <div className="px-4 pt-4 pb-6 bg-slate-50">
            {loading ? (
              <div className="flex justify-center py-2">
                <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
              </div>
            ) : user ? (
              <div className="space-y-3">
                <div className="px-3 pb-2 flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold overflow-hidden">
                       {user.photoURL ? <img src={user.photoURL} alt="profile" className="w-full h-full object-cover" /> : user.displayName.charAt(0)}
                   </div>
                  <div>
                    <p className="text-xs text-slate-500">Logged in as</p>
                    <p className="text-sm font-bold text-slate-900">{user.displayName}</p>
                  </div>
                </div>
                <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-center rounded-lg bg-white border border-slate-200 px-4 py-3 text-base font-semibold text-slate-700 hover:bg-slate-100">
                  My Profile & Orders
                </Link>
                <button onClick={() => { signOut(); setIsMobileMenuOpen(false); }} className="w-full text-center rounded-lg bg-red-50 px-4 py-3 text-base font-semibold text-red-600 hover:bg-red-100">
                  Log Out
                </button>
              </div>
            ) : (
              <button onClick={() => { signIn(); setIsMobileMenuOpen(false); }} className="w-full flex justify-center rounded-lg bg-primary px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-sky-500">
                Log In / Register
              </button>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}