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
      {/* Glassmorphism Background Blur Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm transition-opacity md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-4">
            
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-primary">
                Kabale Online
              </Link>
            </div>

            {/* Desktop Search Bar (Centered) */}
            <div className="hidden md:flex flex-1 max-w-md justify-center">
              <SearchBar />
            </div>
            
            {/* Desktop Navigation & Auth */}
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/electronics" className="text-slate-600 hover:text-primary text-sm font-medium transition-colors">
                Electronics
              </Link>
              <Link href="/agriculture" className="text-slate-600 hover:text-primary text-sm font-medium transition-colors">
                Agriculture
              </Link>
              <Link href="/students" className="text-slate-600 hover:text-primary text-sm font-medium transition-colors">
                Student Market
              </Link>

              <div className="h-4 w-px bg-slate-300"></div>

              {loading ? (
                <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
              ) : user ? (
                <div className="flex items-center gap-4">
                  <Link href="/profile" className="text-sm font-semibold text-primary hover:text-sky-600 transition-colors">
                    My Profile
                  </Link>
                  <button
                    onClick={signOut}
                    className="text-sm font-semibold text-slate-500 hover:text-red-500 transition-colors"
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <button
                  onClick={signIn}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 transition-colors"
                >
                  Log in
                </button>
              )}
            </div>

            {/* Mobile menu button (Hamburger) */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="relative z-50 inline-flex items-center justify-center p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
                aria-expanded={isMobileMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                {!isMobileMenuOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <div className={`md:hidden absolute w-full bg-white border-t border-slate-200 shadow-xl transition-all duration-300 ease-in-out origin-top ${isMobileMenuOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'}`}>
          
          {/* Mobile Search Bar */}
          <div className="px-4 pt-4 pb-2">
            <SearchBar />
          </div>

          <div className="px-4 py-4 space-y-2">
            <Link 
              href="/electronics" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-3 rounded-lg text-base font-semibold text-slate-700 hover:text-primary hover:bg-slate-50"
            >
              Electronics
            </Link>
            <Link 
              href="/agriculture" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-3 rounded-lg text-base font-semibold text-slate-700 hover:text-primary hover:bg-slate-50"
            >
              Agriculture
            </Link>
            <Link 
              href="/students" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-3 rounded-lg text-base font-semibold text-slate-700 hover:text-primary hover:bg-slate-50"
            >
              Student Market
            </Link>
          </div>
          
          {/* Mobile Authentication Controls */}
          <div className="px-4 pt-4 pb-6 border-t border-slate-100 bg-slate-50">
            {loading ? (
              <div className="flex justify-center py-2">
                <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
              </div>
            ) : user ? (
              <div className="space-y-4">
                <div className="px-3">
                  <p className="text-sm text-slate-500">Logged in as</p>
                  <p className="text-base font-bold text-slate-900">{user.displayName}</p>
                </div>
                <Link 
                  href="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-center rounded-lg bg-white border border-slate-200 px-4 py-3 text-base font-semibold text-slate-700 hover:bg-slate-100"
                >
                  My Profile & Orders
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-center rounded-lg bg-red-50 px-4 py-3 text-base font-semibold text-red-600 hover:bg-red-100"
                >
                  Log out
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  signIn();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex justify-center rounded-lg bg-primary px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-sky-500"
              >
                Log in with Google
              </button>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}