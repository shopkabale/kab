"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function Navbar() {
  const { user, loading, signIn, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full bg-white border-b border-slate-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-xl font-bold text-primary">
              Kabale Online
            </Link>
          </div>
          
          {/* Desktop Navigation Links */}
          <div className="hidden md:flex space-x-8">
            <Link href="/electronics" className="text-slate-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">
              Electronics
            </Link>
            <Link href="/agriculture" className="text-slate-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">
              Agriculture
            </Link>
            <Link href="/students" className="text-slate-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">
              Student Market
            </Link>
          </div>

          {/* Desktop Authentication Controls */}
          <div className="hidden md:flex items-center">
            {loading ? (
              <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
            ) : user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-700">
                  Hi, {user.displayName}
                </span>
                <button
                  onClick={signOut}
                  className="text-sm font-semibold text-slate-600 hover:text-red-500 transition-colors"
                >
                  Log out
                </button>
              </div>
            ) : (
              <button
                onClick={signIn}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 transition-colors"
              >
                Log in with Google
              </button>
            )}
          </div>

          {/* Mobile menu button (Hamburger) */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon when menu is closed */}
              {!isMobileMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                /* Icon when menu is open */
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link 
              href="/electronics" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-primary hover:bg-slate-50"
            >
              Electronics
            </Link>
            <Link 
              href="/agriculture" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-primary hover:bg-slate-50"
            >
              Agriculture
            </Link>
            <Link 
              href="/students" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-primary hover:bg-slate-50"
            >
              Student Market
            </Link>
          </div>
          
          {/* Mobile Authentication Controls */}
          <div className="pt-4 pb-3 border-t border-slate-200">
            {loading ? (
              <div className="px-5 flex justify-center">
                <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
              </div>
            ) : user ? (
              <div className="px-5 space-y-3">
                <div className="text-base font-medium text-slate-800">
                  {user.displayName}
                </div>
                <button
                  onClick={() => {
                    signOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left text-base font-medium text-slate-600 hover:text-red-500"
                >
                  Log out
                </button>
              </div>
            ) : (
              <div className="px-5">
                <button
                  onClick={() => {
                    signIn();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex justify-center rounded-md bg-primary px-4 py-2 text-base font-semibold text-white shadow-sm hover:bg-sky-500"
                >
                  Log in with Google
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}