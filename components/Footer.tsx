"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { FaWhatsapp, FaFacebookF, FaInstagram, FaXTwitter } from "react-icons/fa6";

export default function Footer() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  // Hide footer on admin pages
  if (pathname?.startsWith("/admin")) return null;

  return (
    <footer className="bg-black text-neutral-400 border-t border-neutral-800 mt-auto text-xs md:text-sm overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 flex flex-col items-center">

        {/* ========================================== */}
        {/* 🔥 MASSIVE, FLEXIBLE CENTERED LOGO 🔥    */}
        {/* ========================================== */}
        <Link
          href="/"
          className="w-full flex justify-center mb-6 hover:opacity-80 transition-opacity duration-300"
        >
          <Image
            src="/icon-512x512.png"
            alt="Kabale Online Logo"
            width={1024}  
            height={1024} 
            {/* w-full and h-auto give it that flexible expansion! */}
            {/* max-w-3xl caps it on ultra-wide screens so it doesn't distort */}
            className="w-full max-w-sm md:max-w-2xl lg:max-w-4xl h-auto object-contain brightness-0 invert"
          />
        </Link>
        
        <p className="text-center text-neutral-500 leading-relaxed max-w-md mb-16 text-sm md:text-base">
          The modern marketplace connecting Kabale University students,
          farmers, and trusted local vendors.
        </p>

        {/* ========================================== */}
        {/* Main Grid (Now 3 Columns centered below)   */}
        {/* ========================================== */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-16 w-full max-w-4xl mx-auto">

          {/* Marketplace */}
          <div className="text-center md:text-left">
            <h3 className="text-white text-[11px] uppercase tracking-widest mb-4">
              Marketplace
            </h3>
            <ul className="space-y-3">
              <li><Link href="/products" className="hover:text-white transition">All Items</Link></li>
              <li><Link href="/category/electronics" className="hover:text-white transition">Electronics</Link></li>
              <li><Link href="/category/agriculture" className="hover:text-white transition">Agriculture</Link></li>
              <li><Link href="/category/student_item" className="hover:text-white transition">Student Market</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div className="text-center md:text-left">
            <h3 className="text-white text-[11px] uppercase tracking-widest mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              <li><Link href="/about" className="hover:text-white transition">About</Link></li>
              <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
              <li><Link href="/faq" className="hover:text-white transition">FAQ</Link></li>
              <li><Link href="/terms" className="hover:text-white transition">Terms</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div className="text-center md:text-left col-span-2 md:col-span-1">
            <h3 className="text-white text-[11px] uppercase tracking-widest mb-4">
              Account
            </h3>
            <ul className="space-y-3">
              <li><Link href="/profile" className="hover:text-white transition">My Profile</Link></li>
              <li><Link href="/sell" className="hover:text-white transition">Post an Ad</Link></li>
              <li className="text-neutral-600 pt-2">Cash on Delivery Only</li>
              <li className="text-neutral-600">Kabale, Uganda</li>
            </ul>
          </div>

        </div>

        {/* ========================================== */}
        {/* Bottom Section                             */}
        {/* ========================================== */}
        <div className="w-full border-t border-neutral-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">

          {/* Copyright */}
          <p className="text-neutral-600 text-[11px] md:text-xs">
            © {currentYear} Kabale Online. All rights reserved.
          </p>

          {/* Social Icons */}
          <div className="flex items-center gap-6 text-neutral-500 text-lg">
            <a href="https://wa.me/256759997376" target="_blank" rel="noopener noreferrer" className="hover:text-white transition duration-200" aria-label="WhatsApp"><FaWhatsapp /></a>
            <a href="https://www.fb.com/l/6lp1kJRRR" target="_blank" rel="noopener noreferrer" className="hover:text-white transition duration-200" aria-label="Facebook"><FaFacebookF /></a>
            <a href="https://instagram.com/kabale.online" target="_blank" rel="noopener noreferrer" className="hover:text-white transition duration-200" aria-label="Instagram"><FaInstagram /></a>
            <a href="https://x.com/Kabale_Online" target="_blank" rel="noopener noreferrer" className="hover:text-white transition duration-200" aria-label="X"><FaXTwitter /></a>
          </div>
        </div>

      </div>
    </footer>
  );
}
