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

  return (
    <footer className="bg-white text-slate-600 border-t border-slate-200 mt-auto text-xs md:text-sm">
      <div className="max-w-7xl mx-auto px-6 py-10 md:py-14">

        {/* Main Grid: 4 columns on desktop, 2 columns on mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 mb-12">

          {/* Brand & Contact Info (Spans full width on mobile, 1 col on desktop) */}
          <div className="col-span-2 lg:col-span-1">
            <Link
              href="/"
              className="text-xl md:text-2xl font-black text-slate-900 tracking-tight"
            >
              Kabale<span className="text-[#D97706]">Online</span>
            </Link>

            <p className="mt-3 mb-6 text-slate-600 font-medium tracking-wide">
              Kabale's One-Stop Online Marketplace
            </p>

            {/* Contact Details List */}
            <ul className="space-y-4 text-slate-600">
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
                <FaTruckFast className="mt-0.5 shrink-0 text-slate-400 text-base" /> 
                <span className="leading-snug">
                  Same day delivery
                  <br/>
                  <span className="text-[11px] text-slate-400 block mt-0.5">If ordered between 6:00 AM - 3:00 PM</span>
                </span>
              </li>
            </ul>
          </div>

          {/* Marketplace Column */}
          <div className="col-span-1">
            <h3 className="text-slate-900 font-bold text-[11px] uppercase tracking-widest mb-4">
              Marketplace
            </h3>
            <ul className="space-y-3">
              <li><Link href="/officialStore" className="hover:text-[#D97706] transition-colors">Official Store</Link></li>
              <li><Link href="/ladies" className="hover:text-[#D97706] transition-colors">Ladies' Picks 💖</Link></li>
              <li><Link href="/category/student_item" className="hover:text-[#D97706] transition-colors">Student Market</Link></li>
              <li><Link href="/category/electronics" className="hover:text-[#D97706] transition-colors">Electronics</Link></li>
              <li><Link href="/category/agriculture" className="hover:text-[#D97706] transition-colors">Agriculture</Link></li>
              <li><Link href="/products" className="hover:text-[#D97706] transition-colors">View All Products</Link></li>
            </ul>
          </div>

          {/* Explore & Help Column */}
          <div className="col-span-1">
            <h3 className="text-slate-900 font-bold text-[11px] uppercase tracking-widest mb-4">
              Explore & Help
            </h3>
            <ul className="space-y-3">
              <li><Link href="/requests" className="hover:text-[#D97706] transition-colors">Buyer Requests</Link></li>
              <li>
                <Link href="/ai" className="hover:text-[#D97706] transition-colors flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  AI Shopping Guide
                </Link>
              </li>
              <li><Link href="/blog" className="hover:text-[#D97706] transition-colors">Journal & Updates</Link></li>
              <li><Link href="/guide" className="hover:text-[#D97706] transition-colors">Read Documentation</Link></li>
              <li><Link href="/guide" className="hover:text-[#D97706] transition-colors">Need Help?</Link></li>
              <li><Link href="/faq" className="hover:text-[#D97706] transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Account & Company Column */}
          <div className="col-span-1">
            <h3 className="text-slate-900 font-bold text-[11px] uppercase tracking-widest mb-4">
              Account & Company
            </h3>
            <ul className="space-y-3">
              <li><Link href="/profile" className="hover:text-[#D97706] transition-colors">My Profile</Link></li>
              {/* 🚀 ADDED: Highly visible Refer & Earn link */}
              <li><Link href="/invite" className="hover:text-amber-600 transition-colors text-[#D97706] font-bold">Refer & Earn Cash 💰</Link></li>
              <li><Link href="/sell" className="hover:text-amber-600 transition-colors text-[#D97706] font-bold">Sell on Kabale</Link></li>
              <li><Link href="/policies" className="hover:text-green-600 transition-colors text-green-600 font-bold">Policies & Refunds</Link></li>
              <li><Link href="/about" className="hover:text-[#D97706] transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-[#D97706] transition-colors">Contact Us</Link></li>
              <li><Link href="/terms" className="hover:text-[#D97706] transition-colors">Terms & Conditions</Link></li>
            </ul>
          </div>

        </div>

        {/* -------------------------------------------------------- */}
        {/* BRAND LINEAGE & LOGOS SECTION (Cross-Promotion) */}
        {/* -------------------------------------------------------- */}
        <div className="pt-8 border-t border-slate-200/80 flex flex-col space-y-8">

          <div className="flex flex-col lg:flex-row justify-between items-center space-y-6 lg:space-y-0">
            {/* The Logos & Links */}
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">

              {/* Kabale Online Logo & Link */}
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="w-10 h-10 bg-white rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center shrink-0">
                  <img src="/icon-512x512.png" alt="Kabale Online Logo" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                </div>
                <span className="font-bold text-slate-900 group-hover:text-[#D97706] transition-colors">
                  kabaleonline.com
                </span>
              </Link>

              <span className="hidden sm:block text-slate-300">|</span>

              {/* OkayNotice Logo & Link */}
              <a href="https://okaynotice.com" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 group">
                <div className="w-10 h-10 bg-white rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center shrink-0">
                  <img src="/512.png" alt="OkayNotice Logo" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                </div>
                <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  okaynotice.com
                </span>
              </a>
            </div>

            {/* Company Relationship */}
            <div className="text-sm font-medium text-slate-500 text-center lg:text-right bg-slate-50 px-4 py-2 rounded-lg border border-slate-200/80">
              <a href="https://okaynotice.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:text-blue-800 transition-colors">OkayNotice</a> is a proud product of Kabale Online.
            </div>
          </div>

          {/* Copyright & Socials */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-6 border-t border-slate-100">

            <p className="text-slate-500 text-[11px] md:text-xs text-center md:text-left font-medium">
              © {currentYear} Kabale Online. All rights reserved.
            </p>

            {/* Social Icons */}
            <div className="flex items-center justify-center gap-6 text-slate-400 text-lg">
              <a href="https://wa.me/256759997376" target="_blank" rel="noopener noreferrer" className="hover:text-[#25D366] transition duration-200" aria-label="WhatsApp">
                <FaWhatsapp />
              </a>
              <a href="https://www.fb.com/l/6lp1kJRRR" target="_blank" rel="noopener noreferrer" className="hover:text-[#1877F2] transition duration-200" aria-label="Facebook">
                <FaFacebookF />
              </a>
              <a href="https://instagram.com/kabale.online" target="_blank" rel="noopener noreferrer" className="hover:text-[#E4405F] transition duration-200" aria-label="Instagram">
                <FaInstagram />
              </a>
              <a href="https://x.com/Kabale_Online" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition duration-200" aria-label="X">
                <FaXTwitter />
              </a>
              <a href="https://tiktok.com/@kabale.online" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition duration-200" aria-label="TikTok">
                <FaTiktok />
              </a>
            </div>

          </div>
        </div>

      </div>
    </footer>
  );
}
