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

// Imported uniform icons for the mobile drawer (Only the 6 we need)
import { 
  Package, 
  Bed, 
  Laptop, 
  Leaf, 
  Sparkles, 
  Wrench 
} from "lucide-react";

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

  // 🔥 THE 6 NEW HYBRID FRONTEND BUCKETS
  const categoryLinks = [
    { label: "Mega Bundles & Packs", href: "/category/mega-bundles", Icon: Package },
    { label: "Campus Life & Study Gear", href: "/category/campus-life", Icon: Bed },
    { label: "Tech, Gadgets & Appliances", href: "/category/tech-appliances", Icon: Laptop },
    { label: "Farm Fresh & Groceries", href: "/category/food-groceries", Icon: Leaf },
    { label: "Beauty, Health & Fashion", href: "/category/beauty-fashion", Icon: Sparkles },
    { label: "Expert Repairs & Services", href: "/category/repairs-services", Icon: Wrench }
  ];

  return (
    <>
      {/* ============================================== */}
      {/* NAVBAR CONTAINER                               */}
      {/* ============================================== */}
      <nav className={`fixed w-full ${bannerVisible ? "top-8" : "top-0"} bg-white border-b-[3px] border-amber-600 z-40 transition-all shadow-sm`}>

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
            {/* Quick access link updated to the new Campus Life bucket */}
            <Link href="/category/campus-life" className={`text-sm font-bold uppercase tracking-wide transition-colors ${isActive('/category/campus-life') ? 'text-[#D97706]' : 'text-slate-600 hover:text-[#D97706]'}`}>Campus Life</Link>

            {/* VIEW MORE DROPDOWN */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors text-slate-700 hover:text-[#D97706] hover:bg-slate-50 cursor-pointer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" /></svg>
                <span className="text-sm font-bold uppercase tracking-wide">View More</span>
                <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </button>

              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="px-5 pb-2 border-b border-slate-100">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Shop The Market</p>
                  <Link href="/category/mega-bundles" className="block py-1.5 text-[14px] font-medium text-slate-700 hover:text-[#D97706]">Mega Bundles & Packs</Link>
                  <Link href="/category/campus-life" className="block py-1.5 text-[14px] font-medium text-slate-700 hover:text-[#D97706]">Campus Life & Study Gear</Link>
                  <Link href="/category/tech-appliances" className="block py-1.5 text-[14px] font-medium text-slate-700 hover:text-[#D97706]">Tech, Gadgets & Appliances</Link>
                  <Link href="/category/food-groceries" className="block py-1.5 text-[14px] font-medium text-slate-700 hover:text-[#D97706]">Farm Fresh & Groceries</Link>
                  <Link href="/category/beauty-fashion" className="block py-1.5 text-[14px] font-medium text-slate-700 hover:text-[#D97706]">Beauty, Health & Fashion</Link>
                  <Link href="/category/repairs-services" className="block py-1.5 text-[14px] font-medium text-slate-700 hover:text-[#D97706]">Expert Repairs & Services</Link>
                  <Link href="/products" className="block py-1.5 text-[14px] font-bold text-[#D97706] mt-1">View All Categories &rarr;</Link>
                </div>
                <div className="px-5 pt-3">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Explore</p>
                  <Link href="/invite" className="block py-1.5 text-[14px] font-bold text-[#D97706] hover:text-amber-700">Refer & Earn 💰</Link>
                  <Link href="/requests" className="block py-1.5 text-[14px] font-medium text-slate-700 hover:text-[#D97706]">Buyer Requests</Link>
                  <Link href="/ai" className="block py-1.5 text-[14px] font-medium text-slate-700 hover:text-[#D97706]">AI Shopping Guide</Link>
                  <Link href="/blog" className="block py-1.5 text-[14px] font-medium text-slate-700 hover:text-[#D97706]">Journal & Updates</Link>
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
                    <Link href="/invite" className="block px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-[#D97706]">Partner Dashboard</Link>
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

          <Link href="/guide" onClick={closeMenu} className={`flex justify-between items-center px-5 py-4 border-b border-slate-100 transition-colors ${isActive('/guide') ? 'bg-amber-50/50' : 'hover:bg-slate-50'}`}>
            <span className={`text-[13px] font-black tracking-wide uppercase ${isActive('/guide') ? 'text-[#D97706]' : 'text-slate-900'}`}>Need Help?</span>
            <ChevronRight />
          </Link>

          <div className="border-b border-slate-100 py-2">
            <Link href="/profile" onClick={closeMenu} className={`flex justify-between items-center px-5 py-2 mb-1 ${isActive('/profile') ? 'bg-amber-50/50 rounded-lg mx-2' : ''}`}>
              <span className={`text-[13px] font-black tracking-wide uppercase ${isActive('/profile') ? 'text-[#D97706]' : 'text-slate-900'}`}>My Account</span>
              {!isActive('/profile') && <ChevronRight />}
            </Link>

            {!loading && !user && (
              <div className="px-5 py-2 flex gap-3">
                <button onClick={() => { signIn(); closeMenu(); }} className="flex-1 border border-[#D97706] text-[#D97706] rounded py-1.5 text-sm font-bold hover:bg-amber-50">Login</button>
              </div>
            )}

            <div className="flex flex-col">
              <Link href="/cart" onClick={closeMenu} className={`flex justify-between items-center px-5 py-3 transition-colors ${isActive('/cart') ? 'text-[#D97706] bg-amber-50/50 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}>
                <div className="flex items-center">
                  <svg className={`w-6 h-6 mr-4 ${isActive('/cart') ? 'text-[#D97706]' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  <span className="text-[15px] font-medium">My Cart</span>
                </div>
                {cartCount > 0 && (
                  <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">{cartCount}</span>
                )}
              </Link>

              <Link href="/profile" onClick={closeMenu} className={`flex items-center px-5 py-3 transition-colors ${isActive('/profile') ? 'text-[#D97706] bg-amber-50/50 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}>
                <svg className={`w-6 h-6 mr-4 ${isActive('/profile') ? 'text-[#D97706]' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                <span className="text-[15px] font-medium">Orders</span>
              </Link>

              <Link href="/sell" onClick={closeMenu} className={`flex items-center px-5 py-3 transition-colors ${isActive('/sell') ? 'text-[#D97706] bg-amber-50/50 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}>
                <svg className={`w-6 h-6 mr-4 ${isActive('/sell') ? 'text-[#D97706]' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4" /></svg>
                <span className="text-[15px] font-medium">Sell on Kabale</span>
              </Link>

              <Link href="/invite" onClick={closeMenu} className={`flex items-center px-5 py-3 transition-colors ${isActive('/invite') ? 'text-[#D97706] bg-amber-50/50 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}>
                <svg className={`w-6 h-6 mr-4 ${isActive('/invite') ? 'text-[#D97706]' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-[15px] font-medium">Refer & Earn Cash 💰</span>
              </Link>
            </div>
          </div>

          {/* ============================================== */}
          {/* QUICK SHOP - MOBILE UI                         */}
          {/* ============================================== */}
          <div className="border-b border-slate-100 py-2">
            <div className="flex justify-between items-center px-5 py-2 mb-1">
              <span className="text-[13px] font-black text-slate-900 tracking-wide uppercase">Quick Shop</span>
            </div>
            <div className="flex flex-col pb-2">
              <Link href="/category/tech-appliances?max=50000" onClick={closeMenu} className="flex items-center px-5 py-3 text-slate-500 hover:bg-slate-50 transition-colors">
                <svg className="w-6 h-6 mr-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                <span className="text-[15px] font-medium">Gadgets &lt; 50k</span>
              </Link>
              <Link href="/category/campus-life?max=100000" onClick={closeMenu} className="flex items-center px-5 py-3 text-slate-500 hover:bg-slate-50 transition-colors">
                <svg className="w-6 h-6 mr-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 14v7" /></svg>
                <span className="text-[15px] font-medium">Campus Gear &lt; 100k</span>
              </Link>
            </div>
          </div>

          {/* ============================================== */}
          {/* SMART BROWSE - MOBILE UI                       */}
          {/* ============================================== */}
          <div className="border-b border-slate-100 py-2">
            <div className="flex justify-between items-center px-5 py-2 mb-1">
              <span className="text-[13px] font-black text-slate-900 tracking-wide uppercase">Smart Browse</span>
            </div>
            <div className="flex flex-col pb-2">
              <Link href={`${browseBase}?sort=popular`} onClick={closeMenu} className="flex items-center px-5 py-3 text-slate-500 hover:bg-slate-50 transition-colors">
                <svg className="w-6 h-6 mr-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>
                <span className="text-[15px] font-medium">Top Rated / Popular</span>
              </Link>
              <Link href={`${browseBase}?sort=new`} onClick={closeMenu} className="flex items-center px-5 py-3 text-slate-500 hover:bg-slate-50 transition-colors">
                <svg className="w-6 h-6 mr-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                <span className="text-[15px] font-medium">New Arrivals</span>
              </Link>
            </div>
          </div>

          {/* ============================================== */}
          {/* DYNAMIC CATEGORIES LOOP - MOBILE UI            */}
          {/* ============================================== */}
          <div className="border-b border-slate-100 py-2">
            <div className="flex justify-between items-center px-5 py-2 mb-1">
              <span className="text-[13px] font-black text-slate-900 tracking-wide uppercase">Shop The Market</span>
              <Link href="/products" onClick={closeMenu} className="text-[13px] font-medium text-[#D97706]">See All</Link>
            </div>

            <div className="flex flex-col pb-2">
              {categoryLinks.map(({ label, href, Icon }) => (
                <Link 
                  key={label}
                  href={href} 
                  onClick={closeMenu} 
                  className={`flex items-center px-5 py-3 transition-colors ${isActive(href) ? 'text-[#D97706] bg-amber-50/50 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <Icon className={`w-6 h-6 mr-4 ${isActive(href) ? 'text-[#D97706]' : 'text-slate-400'}`} />
                  <span className="text-[15px] font-medium">{label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="py-2 mb-6">
             <div className="px-5 py-2 mb-1">
              <span className="text-[13px] font-black text-slate-900 tracking-wide uppercase">Explore More</span>
            </div>
            <Link href="/requests" onClick={closeMenu} className={`flex items-center px-5 py-3 transition-colors ${isActive('/requests') ? 'text-[#D97706] bg-amber-50/50 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}>
              <svg className={`w-6 h-6 mr-4 ${isActive('/requests') ? 'text-[#D97706]' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
              <span className="text-[15px] font-medium">Buyer Requests</span>
            </Link>
            <Link href="/ai" onClick={closeMenu} className={`flex items-center px-5 py-3 transition-colors ${isActive('/ai') ? 'text-[#D97706] bg-amber-50/50 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}>
              <svg className={`w-6 h-6 mr-4 ${isActive('/ai') ? 'text-[#D97706]' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              <span className="text-[15px] font-medium">AI Shopping Guide</span>
            </Link>
            <Link href="/blog" onClick={closeMenu} className={`flex items-center px-5 py-3 transition-colors ${isActive('/blog') ? 'text-[#D97706] bg-amber-50/50 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}>
              <svg className={`w-6 h-6 mr-4 ${isActive('/blog') ? 'text-[#D97706]' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H14" /></svg>
              <span className="text-[15px] font-medium">Journal & Updates</span>
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
                <a key={idx} href={social.href} target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-white border border-slate-200 text-slate-400 flex items-center justify-center rounded-full transition-colors hover:text-[#D97706] hover:border-[#D97706]">
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
