"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function Navbar() {
  const { user, loading, signIn, signOut } = useAuth();

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

          {/* Authentication Controls */}
          <div className="flex items-center">
            {loading ? (
              <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
            ) : user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-700 hidden sm:block">
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
        </div>
      </div>
    </nav>
  );
}