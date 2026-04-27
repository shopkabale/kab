"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FaWhatsapp, 
  FaFacebookF, 
  FaInstagram, 
  FaXTwitter,
  FaLocationDot,
  FaPhone,
  FaEnvelope,
  FaClock,
  FaTruckFast,
  FaTiktok
} from "react-icons/fa6";

export default function Footer() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  // Hide footer on admin pages
  if (pathname?.startsWith("/admin")) return null;

  const isActive = (path: string) => pathname === path;

  // Helper function to apply the gray/orange active logic for light mode
  const getLinkStyle = (path: string) => 
    `transition-colors block ${isActive(path) ? 'text-[#D97706] font-bold' : 'text-slate-500 hover:text-[#D97706]'}`;

  return (
    <footer className="bg-white text-slate-600 border-t border-slate-200 mt-auto text-xs md:text-sm">
      <div className="max-w-7xl mx-auto px-6 py-10 md:py-14">

        {/* ================================================= */}
        {/* MAIN GRID: 4 COLUMNS                              */}
        {/* ================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 mb-12">

          {/* 1. Contact Info Column */}
          <div className="col-span-2 lg:col-span-1">
            <Link
              href="/"
              className="text-xl md:text-2xl font-black text-slate-900 tracking-tight block mb-6"
            >
              Kabale<span className="text-[#D97706]">Online</span>
            </Link>

            <ul className="space-y-4 text-slate-500">
              <li className="flex items-start gap-3">
                <FaLocationDot className="mt-0.5 shrink-0 text-slate-400 text-base" /> 
                <span>Kabale, Uganda</span>
              </li>

              <li className="flex items-center gap-3">
                <FaPhone className="shrink-0 text-slate-400 text-base" /> 
                <a href="tel:+256759997376" className="hover:text-[#D97706] transition-colors">075 999 7376</a>
              </li>

              <li className="flex items-center gap-3">
                <FaEnvelope className="shrink-0 text-slate-400 text-base" /> 
                <a href="mailto:shopkabale@gmail.com" className="hover:text-[#D97706] transition-colors">shopkabale@gmail.com</a>
              </li>

              <li className="flex items-start gap-3">
                <FaClock className="mt-0.5 shrink-0 text-slate-400 text-base" /> 
                <span>Mon - Sun / 24 Hrs</span>
              </li>

              <li className="flex items-start gap-3">
                <FaTruckFast className="mt-0.5 shrink-0 text-[#D97706] text-base" /> 
                <span className="leading-snug text-slate-600">
                  Same day delivery
                  <br/>
                  <span className="text-[11px] text-slate-400 block mt-0.5">If ordered between 6:00 AM - 3:00 PM</span>
                </span>
              </li>
            </ul>
          </div>

          {/* 2. Marketplace Part 1 (Frontend Buckets) */}
          <div className="col-span-1">
            <h3 className="text-slate-900 font-black text-[11px] uppercase tracking-widest mb-4">
              Shop The Market
            </h3>
            <ul className="space-y-3">
              <li><Link href="/category/mega-bundles" className={getLinkStyle('/category/mega-bundles')}>Mega Bundles & Packs 📦</Link></li>
              <li><Link href="/category/campus-life" className={getLinkStyle('/category/campus-life')}>Campus Life & Study Gear 🎓</Link></li>
              <li><Link href="/category/tech-appliances" className={getLinkStyle('/category/tech-appliances')}>Tech, Gadgets & Appliances ⚡</Link></li>
            </ul>
          </div>

          {/* 3. Marketplace Part 2 (Frontend Buckets) */}
          <div className="col-span-1">
            <h3 className="text-slate-900 font-black text-[11px] uppercase tracking-widest mb-4">
              More Categories
            </h3>
            <ul className="space-y-3">
              <li><Link href="/category/food-groceries" className={getLinkStyle('/category/food-groceries')}>Farm Fresh & Groceries 🍅</Link></li>
              <li><Link href="/category/beauty-fashion" className={getLinkStyle('/category/beauty-fashion')}>Beauty, Health & Fashion ✨</Link></li>
              <li><Link href="/category/repairs-services" className={getLinkStyle('/category/repairs-services')}>Expert Repairs & Services 🛠️</Link></li>
            </ul>
          </div>

          {/* 4. Explore & Account Column */}
          <div className="col-span-1">
            <h3 className="text-slate-900 font-black text-[11px] uppercase tracking-widest mb-4">
              Account & Help
            </h3>
            <ul className="space-y-3">
              <li><Link href="/profile" className={getLinkStyle('/profile')}>My Profile</Link></li>
              <li><Link href="/invite" className={getLinkStyle('/invite')}>Refer & Earn Cash 💰</Link></li>
              <li><Link href="/sell" className={getLinkStyle('/sell')}>Sell on Kabale</Link></li>
              <li><Link href="/requests" className={getLinkStyle('/requests')}>Buyer Requests</Link></li>
              <li>
                <Link href="/ai" className={`${getLinkStyle('/ai')} flex items-center gap-1.5`}>
                  <svg className={`w-4 h-4 ${isActive('/ai') ? 'text-[#D97706]' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  AI Shopping Guide
                </Link>
              </li>
              <li><Link href="/guide" className={getLinkStyle('/guide')}>Need Help? / Docs</Link></li>
            </ul>
          </div>

        </div>

        {/* ================================================= */}
        {/* BRAND LINEAGE & CROSS-PROMOTION                   */}
        {/* ================================================= */}
        <div className="pt-8 border-t border-slate-200 flex flex-col space-y-8">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-6 lg:space-y-0">
            
            {/* The Logos & Links */}
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
              {/* Kabale Online Minor Logo */}
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="w-10 h-10 bg-white rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center shrink-0 p-1 shadow-sm">
                  <img src="/icon-512x512.png" alt="Kabale Online Logo" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                </div>
                <span className="font-bold text-slate-900 group-hover:text-[#D97706] transition-colors">
                  kabaleonline.com
                </span>
              </Link>

              <span className="hidden sm:block text-slate-300">|</span>

              {/* OkayNotice Logo */}
              <a href="https://okaynotice.com" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 group">
                <div className="w-10 h-10 bg-white rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center shrink-0 p-1 shadow-sm">
                  <img src="/512.png" alt="OkayNotice Logo" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                </div>
                <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  okaynotice.com
                </span>
              </a>
            </div>

            {/* Company Relationship */}
            <div className="text-sm font-medium text-slate-500 text-center lg:text-right bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
              <a href="https://okaynotice.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:text-blue-700 transition-colors">OkayNotice</a> is a proud product of Kabale Online.
            </div>
          </div>

          {/* ================================================= */}
          {/* COPYRIGHT & SOCIALS                               */}
          {/* ================================================= */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-6 border-t border-slate-100">
            <p className="text-slate-500 text-[11px] md:text-xs text-center md:text-left font-medium">
              © {currentYear} Kabale Online. All rights reserved.
            </p>

            <div className="flex items-center justify-center gap-6 text-slate-400 text-lg">
              <a href="https://wa.me/256759997376" target="_blank" rel="noopener noreferrer" className="hover:text-[#25D366] transition duration-200" aria-label="WhatsApp"><FaWhatsapp /></a>
              <a href="https://www.fb.com/l/6lp1kJRRR" target="_blank" rel="noopener noreferrer" className="hover:text-[#1877F2] transition duration-200" aria-label="Facebook"><FaFacebookF /></a>
              <a href="https://instagram.com/kabale.online" target="_blank" rel="noopener noreferrer" className="hover:text-[#E4405F] transition duration-200" aria-label="Instagram"><FaInstagram /></a>
              <a href="https://x.com/Kabale_Online" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition duration-200" aria-label="X"><FaXTwitter /></a>
              <a href="https://tiktok.com/@kabale.online" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition duration-200" aria-label="TikTok"><FaTiktok /></a>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
