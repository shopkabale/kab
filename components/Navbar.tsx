"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import SearchBar from "@/components/SearchBar";
import { 
  FaWhatsapp, 
  FaFacebookF, 
  FaXTwitter, 
  FaInstagram,
  FaTiktok 
} from "react-icons/fa6";

export default function Navbar({ bannerVisible }: { bannerVisible: boolean }) {
  const pathname = usePathname();
  const { user, loading, signIn, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Lock body scroll AND broadcast state to hide other UI elements
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (isMobileMenuOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'unset';
      }
      window.dispatchEvent(new CustomEvent("mobileMenuState", { detail: isMobileMenuOpen }));
    }

    return () => { 
      if (typeof window !== "undefined") {
        document.body.style.overflow = 'unset'; 
        window.dispatchEvent(new CustomEvent("mobileMenuState", { detail: false }));
      }
    };
  }, [isMobileMenuOpen]);

  if (pathname?.startsWith("/admin")) return null; 

  const isActive = (path: string) => pathname === path;
  const closeMenu = () => setIsMobileMenuOpen(false);

  const ChevronRight = () => (
    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
  );

  return (
    <>
      {/* ============================================== */}
      {/* NAVBAR CONTAINER                               */}
      {/* ============================================== */}
      <nav className={`fixed w-full ${bannerVisible ? "top-8" : "top-0"} bg-white border-b-[3px] border-blue-500 z-40 transition-all shadow-sm`}>

        {/* === DESKTOP VIEW === */}
        <div className="hidden lg:flex max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 justify-between items-center h-16 gap-6">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-2xl font-black text-slate-900 tracking-tight">
              Kabale<span className="text-[#D97706]">Online</span>
            </Link>
          </div>

          <div className="flex-1 max-w-2xl w-full">
            <SearchBar />
          </div>

          <div className="flex items-center space-x-6">
            <Link href="/category/student_item" className={`text-sm font-bold uppercase tracking-wide transition-colors ${isActive('/category/student_item') ? 'text-[#D97706]' : 'text-slate-600 hover:text-[#D97706]'}`}>Student Market</Link>

            <Link href="/ai" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${isActive('/ai') ? 'text-[#D97706] bg-amber-50' : 'text-slate-700 hover:text-[#D97706] hover:bg-slate-50'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              <span className="text-sm font-bold uppercase tracking-wide">AI Guide</span>
            </Link>

            <Link href="/sell" className="flex items-center gap-2 bg-[#D97706] text-white px-5 py-2.5 rounded-md text-sm font-bold uppercase tracking-wide hover:bg-amber-600 transition-colors shadow-sm">
              Sell Now
            </Link>

            {loading ? (
              <div className="h-6 w-6 rounded-full border-2 border-[#D97706] border-t-transparent animate-spin ml-2"></div>
            ) : user ? (
              <div className="flex items-center gap-3 relative group ml-2">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold shadow-sm cursor-pointer overflow-hidden">
                     {user.photoURL ? <img src={user.photoURL} alt="profile" className="w-full h-full object-cover" /> : (user.displayName || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <div className="px-4 py-2 border-b border-slate-100 mb-1">
                      <p className="text-xs text-slate-500 font-medium">Logged in as</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{user.displayName || "User"}</p>
                    </div>
                    <Link href="/profile" className="block px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#D97706]">My Profile</Link>
                    <Link href="/sell" className="block px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#D97706]">My Listings</Link>
                    <button onClick={signOut} className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">Sign Out</button>
                  </div>
                </div>
              </div>
            ) : (
              <button onClick={signIn} className="text-sm font-bold uppercase tracking-wide text-slate-700 hover:text-[#D97706] transition-colors ml-2">
                Login
              </button>
            )}
          </div>
        </div>

        {/* === MOBILE VIEW (UPDATED FOR COMPACT HEIGHT) === */}
        <div className="lg:hidden flex flex-col w-full">
          {/* Changed h-14 to h-12 for a tighter top row */}
          <div className="flex items-center justify-between h-12 px-4">
            <div className="flex items-center gap-2.5">
              <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-900 focus:outline-none" aria-label="Open menu">
                {/* Scaled down icon from w-7 h-7 to w-6 h-6 to fit the shorter height */}
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <Link href="/" className="text-xl font-black text-slate-900 tracking-tight">
                Kabale<span className="text-[#D97706]">Online</span>
              </Link>
            </div>

            <div className="flex items-center gap-4 text-slate-800">
              {user ? (
                <Link href="/profile" aria-label="Profile">
                  <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </Link>
              ) : (
                <button onClick={signIn} aria-label="Login">
                  <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </button>
              )}

              <a 
                href="https://wa.me/256759997376" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="WhatsApp to Order" 
                className="relative text-[#25D366] hover:text-[#1EBE57] transition-colors"
              >
                <FaWhatsapp className="w-[22px] h-[22px]" />
              </a>
            </div>
          </div>

          {/* Reduced bottom padding from pb-3 to pb-2 */}
          <div className="px-3 pb-2 w-full">
             <SearchBar />
          </div>
        </div>
      </nav>

      {/* ============================================== */}
      {/* MOBILE MENU DRAWER                           */}
      {/* ============================================== */}
      {/* ... (Keep your existing mobile menu drawer code here exactly as is) ... */}
      <div 
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] xl:hidden transition-opacity duration-300 ${isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={closeMenu}
      />
      <div 
        className={`fixed top-0 left-0 h-[100dvh] w-[85vw] max-w-sm bg-white z-[100] xl:hidden flex flex-col shadow-2xl transition-transform duration-300 ease-in-out overflow-hidden ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center px-4 py-4 border-b border-slate-100 bg-white">
          <button onClick={closeMenu} className="mr-4 text-slate-900 focus:outline-none" aria-label="Close menu">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <Link href="/" onClick={closeMenu} className="text-xl font-black text-slate-900 tracking-tight flex-1">
            Kabale<span className="text-[#D97706]">Online</span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto bg-white flex flex-col">
          {/* Menu Links */}
          <Link href="/guide" onClick={closeMenu} className="flex justify-between items-center px-5 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <span className="text-[13px] font-bold text-slate-600 tracking-wide uppercase">Need Help?</span>
            <ChevronRight />
          </Link>

          {/* ... Rest of your menu items ... */}
          <div className="mt-auto bg-slate-50 border-t border-slate-100 p-5">
            <div className="flex justify-center gap-3 mb-6">
              {[
                { icon: FaWhatsapp, href: "https://wa.me/256759997376" }, 
                { icon: FaFacebookF, href: "https://www.fb.com/l/6lp1kJRRR" }, 
                { icon: FaInstagram, href: "https://instagram.com/kabale.online" },
                { icon: FaXTwitter, href: "https://x.com/Kabale_Online" },
                { icon: FaTiktok, href: "https://tiktok.com/@kabale.online" },
              ].map((social, idx) => (
                <a key={idx} href={social.href} target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-white border border-slate-200 text-slate-600 flex items-center justify-center rounded-full transition-colors hover:text-[#D97706] hover:border-[#D97706]">
                  <social.icon size={16} />
                </a>
              ))}
            </div>

            {user && (
              <button onClick={() => { signOut(); closeMenu(); }} className="w-full bg-white border border-slate-200 text-slate-700 py-3 rounded text-[15px] font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors">
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
