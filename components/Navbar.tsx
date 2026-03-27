"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { 
  FaWhatsapp, 
  FaFacebookF, 
  FaTiktok, 
  FaXTwitter, 
  FaYoutube, 
  FaLinkedinIn, 
  FaInstagram 
} from "react-icons/fa6";

export default function Navbar({ bannerVisible }: { bannerVisible: boolean }) {
  const pathname = usePathname();
  const { user, loading, signIn, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    // Cleanup on unmount
    return () => { document.body.style.overflow = 'unset'; };
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
      {/* ============================================== */}
      {/* DESKTOP NAVBAR (Search Removed)                */}
      {/* ============================================== */}
      <nav className={`fixed w-full ${bannerVisible ? "top-8" : "top-0"} bg-white/95 backdrop-blur-md border-b border-slate-200 z-40 transition-all`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-2xl font-black text-slate-900 tracking-tight">
                Kabale<span className="text-[#D97706]">Online</span>
              </Link>
            </div>

            {/* Desktop Menu */}
            <div className="hidden xl:flex items-center space-x-7">
              <Link href="/products" className={`text-sm font-bold uppercase tracking-wide transition-colors ${isActive('/products') ? 'text-[#D97706]' : 'text-slate-600 hover:text-[#D97706]'}`}>All Items</Link>
              <Link href="/category/electronics" className={`text-sm font-bold uppercase tracking-wide transition-colors ${isActive('/category/electronics') ? 'text-[#D97706]' : 'text-slate-600 hover:text-[#D97706]'}`}>Electronics</Link>
              <Link href="/category/agriculture" className={`text-sm font-bold uppercase tracking-wide transition-colors ${isActive('/category/agriculture') ? 'text-[#D97706]' : 'text-slate-600 hover:text-[#D97706]'}`}>Agriculture</Link>
              <Link href="/category/student_item" className={`text-sm font-bold uppercase tracking-wide transition-colors ${isActive('/category/student_item') ? 'text-[#D97706]' : 'text-slate-600 hover:text-[#D97706]'}`}>Student Market</Link>
              <Link href="/blog" className={`text-sm font-bold uppercase tracking-wide transition-colors ${isActive('/blog') ? 'text-[#D97706]' : 'text-slate-600 hover:text-[#D97706]'}`}>Journal</Link>

              {/* Desktop AI Guide Link */}
              <Link href="/ai" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${isActive('/ai') ? 'text-[#D97706] bg-amber-50' : 'text-slate-700 hover:text-[#D97706] hover:bg-slate-50'}`}>
                <span className="text-[#D97706] text-sm leading-none">✨</span> 
                <span className="text-sm font-bold uppercase tracking-wide">AI Guide</span>
              </Link>

              <div className="h-6 w-px bg-slate-200 mx-1"></div>

              <Link href="/sell" className="flex items-center gap-2 bg-[#D97706] text-white px-5 py-2.5 rounded-md text-sm font-bold uppercase tracking-wide hover:bg-amber-600 transition-colors shadow-sm">
                Sell Now
              </Link>

              {/* Desktop User Authentication Display */}
              {loading ? (
                <div className="h-6 w-6 rounded-full border-2 border-[#D97706] border-t-transparent animate-spin ml-2"></div>
              ) : user ? (
                <div className="flex items-center gap-3 relative group ml-2">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold shadow-sm cursor-pointer overflow-hidden">
                       {user.photoURL ? (
                         <img src={user.photoURL} alt="profile" className="w-full h-full object-cover" />
                       ) : (
                         (user.displayName || "U").charAt(0).toUpperCase()
                       )}
                    </div>
                    {/* Hover Dropdown */}
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
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
                  Login / Register
                </button>
              )}
            </div>

            {/* Mobile Hamburger Toggle */}
            <div className="flex items-center xl:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="text-slate-900 p-2 focus:outline-none"
                aria-label="Open menu"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* ============================================== */}
      {/* APP-STYLE FULLSCREEN MOBILE MENU               */}
      {/* ============================================== */}
      
      {/* Backdrop (Darkens the page behind the drawer) */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 xl:hidden transition-opacity duration-300 ${isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={closeMenu}
      />

      {/* Slide-in Drawer */}
      <div 
        className={`fixed top-0 left-0 h-[100dvh] w-[85vw] max-w-sm bg-white z-50 xl:hidden flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Mobile Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 bg-white">
          <Link href="/" onClick={closeMenu} className="text-2xl font-black text-slate-900 tracking-tight">
            Kabale<span className="text-[#D97706]">Online</span>
          </Link>
          <button 
            onClick={closeMenu}
            className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto bg-white flex flex-col">
          
          {/* Auth Section (Sleek side-by-side buttons) */}
          <div className="flex gap-3 p-6 bg-slate-50/50 border-b border-slate-100">
            {loading ? (
              <div className="w-full flex justify-center py-2"><div className="h-6 w-6 rounded-full border-2 border-[#D97706] border-t-transparent animate-spin"></div></div>
            ) : user ? (
              <>
                <Link href="/profile" onClick={closeMenu} className="flex-1 bg-white border border-slate-200 text-slate-800 font-bold text-xs uppercase tracking-widest py-3.5 text-center shadow-sm hover:border-[#D97706] hover:text-[#D97706] transition-colors">
                  Profile
                </Link>
                <button onClick={() => { signOut(); closeMenu(); }} className="flex-1 bg-white border border-slate-200 text-slate-800 font-bold text-xs uppercase tracking-widest py-3.5 text-center shadow-sm hover:border-red-500 hover:text-red-600 transition-colors">
                  Logout
                </button>
              </>
            ) : (
              <>
                <button onClick={() => { signIn(); closeMenu(); }} className="flex-1 bg-white border border-slate-200 text-slate-800 font-bold text-xs uppercase tracking-widest py-3.5 shadow-sm hover:border-[#D97706] hover:text-[#D97706] transition-colors">
                  Login
                </button>
                <button onClick={() => { signIn(); closeMenu(); }} className="flex-1 bg-white border border-slate-200 text-slate-800 font-bold text-xs uppercase tracking-widest py-3.5 shadow-sm hover:border-[#D97706] hover:text-[#D97706] transition-colors">
                  Register
                </button>
              </>
            )}
          </div>

          {/* Navigation Links (Uppercase, separated by borders) */}
          <div className="flex flex-col text-sm font-bold text-slate-600 uppercase tracking-widest">
            {[
              { label: "Home", href: "/" },
              { label: "All Items", href: "/products" },
              { label: "Electronics", href: "/category/electronics" },
              { label: "Agriculture", href: "/category/agriculture" },
              { label: "Student Market", href: "/category/student_item" },
              { label: "Requests", href: "/requests" },
              { label: "Blog", href: "/blog" },
              { label: "AI Guide ✨", href: "/ai", color: "text-[#D97706]" },
            ].map((link, idx) => (
              <Link 
                key={idx} 
                href={link.href} 
                onClick={closeMenu}
                className={`px-6 py-4 border-b border-slate-100 hover:bg-slate-50 hover:pl-8 transition-all duration-200 ${link.color || ''} ${isActive(link.href) ? 'text-[#D97706] bg-amber-50/30 pl-8 border-l-4 border-l-[#D97706]' : 'border-l-4 border-l-transparent'}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Bottom Call-to-Action & Socials */}
          <div className="mt-auto p-6 bg-slate-50/50">
            <Link 
              href="/sell" 
              onClick={closeMenu}
              className="block w-full bg-[#3f4e24] hover:bg-[#2d3819] text-white text-center py-4 text-sm font-bold uppercase tracking-widest rounded-sm transition-colors shadow-sm mb-8"
            >
              Sell Now
            </Link>

            <div className="mb-2">
              <p className="text-slate-800 font-medium mb-4 text-base">Our social network pages</p>
              <div className="flex flex-wrap gap-2">
                {/* Social Icons matching the screenshot layout */}
                {[
                  { icon: FaWhatsapp, href: "#" },
                  { icon: FaFacebookF, href: "#" },
                  { icon: FaTiktok, href: "#" },
                  { icon: FaXTwitter, href: "#" },
                  { icon: FaYoutube, href: "#" },
                  { icon: FaLinkedinIn, href: "#" },
                  { icon: FaInstagram, href: "#" },
                ].map((social, idx) => (
                  <a 
                    key={idx} 
                    href={social.href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-[#424242] hover:bg-[#D97706] text-white flex items-center justify-center rounded-sm transition-colors"
                  >
                    <social.icon size={18} />
                  </a>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
