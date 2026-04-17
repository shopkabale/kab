"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useCart } from "@/context/CartContext"; 
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
  const { cartCount } = useCart(); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Determine base path for dynamic Smart Browse filtering
  const browseBase = pathname === '/' ? '/products' : pathname;

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

            {/* VIEW MORE DROPDOWN */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors text-slate-700 hover:text-[#D97706] hover:bg-slate-50 cursor-pointer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" /></svg>
                <span className="text-sm font-bold uppercase tracking-wide">View More</span>
                <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </button>

              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="px-5 pb-2 border-b border-slate-100">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Categories</p>
                  <Link href="/officialStore" className="block py-1.5 text-[14px] font-medium text-slate-700 hover:text-[#D97706]">Official Store</Link>
                  <Link href="/ladies" className="block py-1.5 text-[14px] font-medium text-slate-700 hover:text-[#D97706]">Ladies' Picks</Link>
                  <Link href="/category/electronics" className="block py-1.5 text-[14px] font-medium text-slate-700 hover:text-[#D97706]">Electronics</Link>
                  <Link href="/category/agriculture" className="block py-1.5 text-[14px] font-medium text-slate-700 hover:text-[#D97706]">Agriculture</Link>
                  <Link href="/products" className="block py-1.5 text-[14px] font-bold text-[#D97706] mt-1">View All Products &rarr;</Link>
                </div>
                <div className="px-5 pt-3">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Explore</p>
                  <Link href="/requests" className="block py-1.5 text-[14px] font-medium text-slate-700 hover:text-[#D97706]">Buyer Requests</Link>
                  <Link href="/ai" className="block py-1.5 text-[14px] font-medium text-slate-700 hover:text-[#D97706]">AI Shopping Guide</Link>
                  <Link href="/blog" className="block py-1.5 text-[14px] font-medium text-slate-700 hover:text-[#D97706]">Journal & Updates</Link>
                  <Link href="/guide" className="block py-1.5 text-[14px] font-medium text-slate-700 hover:text-[#D97706]">Documentation</Link>
                </div>
              </div>
            </div>

            {/* DESKTOP CART ICON */}
            <Link href="/cart" className="relative p-1 text-slate-700 hover:text-[#D97706] transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/4 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                  {cartCount}
                </span>
              )}
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

        {/* === MOBILE VIEW === */}
        <div className="lg:hidden flex flex-col w-full">
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-900 focus:outline-none" aria-label="Open menu">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <Link href="/" className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                Kabale<span className="text-[#D97706]">Online</span>
              </Link>
            </div>

            <div className="flex items-center gap-4 text-slate-800">

              <Link href="/cart" className="relative p-1 text-slate-700 hover:text-[#D97706] transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                    {cartCount}
                  </span>
                )}
              </Link>

              {user ? (
                <Link href="/profile" aria-label="Profile">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </Link>
              ) : (
                <button onClick={signIn} aria-label="Login">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </button>
              )}

              <a 
                href="https://wa.me/256759997376" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="WhatsApp to Order" 
                className="relative text-[#25D366] hover:text-[#1EBE57] transition-colors"
              >
                <FaWhatsapp className="w-6 h-6" />
              </a>
            </div>
          </div>

          <div className="px-3 pb-3 w-full">
             <SearchBar />
          </div>
        </div>
      </nav>

      {/* ============================================== */}
      {/* MOBILE MENU DRAWER                           */}
      {/* ============================================== */}
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

          <Link href="/guide" onClick={closeMenu} className="flex justify-between items-center px-5 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <span className="text-[13px] font-bold text-slate-600 tracking-wide uppercase">Need Help?</span>
            <ChevronRight />
          </Link>

          <div className="border-b border-slate-100 py-2">
            <Link href="/profile" onClick={closeMenu} className="flex justify-between items-center px-5 py-2 mb-1">
              <span className="text-[13px] font-bold text-slate-600 tracking-wide uppercase">My Account</span>
              <ChevronRight />
            </Link>

            {!loading && !user && (
              <div className="px-5 py-2 flex gap-3">
                <button onClick={() => { signIn(); closeMenu(); }} className="flex-1 border border-[#D97706] text-[#D97706] rounded py-1.5 text-sm font-bold hover:bg-amber-50">Login</button>
              </div>
            )}

            <div className="flex flex-col">
              <Link href="/cart" onClick={closeMenu} className="flex justify-between items-center px-5 py-3 text-slate-700 hover:bg-slate-50 transition-colors">
                <div className="flex items-center">
                  <svg className="w-6 h-6 mr-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  <span className="text-[15px] font-bold text-slate-900">My Cart</span>
                </div>
                {cartCount > 0 && (
                  <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">{cartCount}</span>
                )}
              </Link>

              <Link href="/profile" onClick={closeMenu} className="flex items-center px-5 py-3 text-slate-700 hover:bg-slate-50 transition-colors">
                <svg className="w-6 h-6 mr-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                <span className="text-[15px]">Orders</span>
              </Link>

              <Link href="/sell" onClick={closeMenu} className="flex items-center px-5 py-3 text-slate-700 hover:bg-slate-50 transition-colors">
                <svg className="w-6 h-6 mr-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4" /></svg>
                <span className="text-[15px]">Sell on Kabale</span>
              </Link>
            </div>
          </div>

          {/* ============================================== */}
          {/* QUICK SHOP - MOBILE UI                         */}
          {/* ============================================== */}
          <div className="border-b border-slate-100 py-2">
            <div className="flex justify-between items-center px-5 py-2 mb-1">
              <span className="text-[13px] font-bold text-slate-600 tracking-wide uppercase">Quick Shop</span>
            </div>
            <div className="flex flex-col pb-2">
              <Link href="/category/electronics?max=50000" onClick={closeMenu} className="flex items-center px-5 py-3 text-slate-700 hover:bg-slate-50 transition-colors">
                <svg className="w-6 h-6 mr-4 text-[#D97706]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                <span className="text-[15px] font-medium">Gadgets &lt; 50k</span>
              </Link>
              <Link href="/category/student_item?max=100000" onClick={closeMenu} className="flex items-center px-5 py-3 text-slate-700 hover:bg-slate-50 transition-colors">
                <svg className="w-6 h-6 mr-4 text-[#D97706]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 14v7" /></svg>
                <span className="text-[15px] font-medium">Student Gear &lt; 100k</span>
              </Link>
            </div>
          </div>

          {/* ============================================== */}
          {/* SMART BROWSE - MOBILE UI                       */}
          {/* ============================================== */}
          <div className="border-b border-slate-100 py-2 bg-amber-50/30">
            <div className="flex justify-between items-center px-5 py-2 mb-1">
              <span className="text-[13px] font-bold text-[#D97706] tracking-wide uppercase">Smart Browse</span>
            </div>
            <div className="flex flex-col pb-2">
              <Link href={`${browseBase}?sort=popular`} onClick={closeMenu} className="flex items-center px-5 py-3 text-slate-700 hover:bg-slate-50 transition-colors">
                <svg className="w-6 h-6 mr-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>
                <span className="text-[15px] font-medium">Top Rated / Popular</span>
              </Link>
              <Link href={`${browseBase}?sort=new`} onClick={closeMenu} className="flex items-center px-5 py-3 text-slate-700 hover:bg-slate-50 transition-colors">
                <svg className="w-6 h-6 mr-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                <span className="text-[15px] font-medium">New Arrivals</span>
              </Link>
            </div>
          </div>

          <div className="border-b border-slate-100 py-2">
            <div className="flex justify-between items-center px-5 py-2 mb-1">
              <span className="text-[13px] font-bold text-slate-600 tracking-wide uppercase">Our Categories</span>
              <Link href="/products" onClick={closeMenu} className="text-[13px] font-medium text-[#D97706]">See All</Link>
            </div>

            <div className="flex flex-col pb-2">
              <Link href="/officialStore" onClick={closeMenu} className="flex items-center px-5 py-3 text-slate-700 hover:bg-slate-50 transition-colors">
                <svg className="w-6 h-6 mr-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                <span className="text-[15px]">Official Store</span>
              </Link>

              <Link href="/ladies" onClick={closeMenu} className="flex items-center px-5 py-3 text-slate-700 hover:bg-slate-50 transition-colors">
                <svg className="w-6 h-6 mr-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                <span className="text-[15px]">Ladies' Picks</span>
              </Link>

              <Link href="/category/student_item" onClick={closeMenu} className="flex items-center px-5 py-3 text-slate-700 hover:bg-slate-50 transition-colors">
                <svg className="w-6 h-6 mr-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 14l9-5-9-5-9 5 9 5z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 14v7" /></svg>
                <span className="text-[15px]">Student Market</span>
              </Link>

              <Link href="/category/electronics" onClick={closeMenu} className="flex items-center px-5 py-3 text-slate-700 hover:bg-slate-50 transition-colors">
                <svg className="w-6 h-6 mr-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <span className="text-[15px]">Electronics</span>
              </Link>

              <Link href="/category/agriculture" onClick={closeMenu} className="flex items-center px-5 py-3 text-slate-700 hover:bg-slate-50 transition-colors">
                <svg className="w-6 h-6 mr-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                <span className="text-[15px]">Agriculture</span>
              </Link>
            </div>
          </div>

          <div className="py-2 mb-6">
             <div className="px-5 py-2 mb-1">
              <span className="text-[13px] font-bold text-slate-600 tracking-wide uppercase">Explore More</span>
            </div>
            <Link href="/requests" onClick={closeMenu} className="flex items-center px-5 py-3 text-slate-700 hover:bg-slate-50 transition-colors">
              <svg className="w-6 h-6 mr-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
              <span className="text-[15px]">Buyer Requests</span>
            </Link>
            <Link href="/ai" onClick={closeMenu} className="flex items-center px-5 py-3 text-slate-700 hover:bg-slate-50 transition-colors">
              <svg className="w-6 h-6 mr-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              <span className="text-[15px]">AI Shopping Guide</span>
            </Link>
            <Link href="/blog" onClick={closeMenu} className="flex items-center px-5 py-3 text-slate-700 hover:bg-slate-50 transition-colors">
              <svg className="w-6 h-6 mr-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H14" /></svg>
              <span className="text-[15px]">Journal & Updates</span>
            </Link>
          </div>

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
