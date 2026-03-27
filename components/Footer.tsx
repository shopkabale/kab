"use client";

import Link from "next/link";
import Image from "next/image"; // 🔥 Imported next/image
import { usePathname } from "next/navigation";
import { FaWhatsapp, FaFacebookF, FaInstagram, FaXTwitter } from "react-icons/fa6";

export default function Footer() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  // Hide footer on admin pages
  if (pathname?.startsWith("/admin")) return null;

  return (
    <footer className="bg-black text-neutral-400 border-t border-neutral-800 mt-auto text-xs md:text-sm">
      <div className="max-w-7xl mx-auto px-6 py-10 md:py-14">

        {/* Main Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="inline-block hover:opacity-80 transition-opacity duration-200"
            >
              {/* 🔥 Using your existing icon, but turning it pure white with 'brightness-0 invert' */}
              <Image
                src="/icon-512x512.png"
                alt="Kabale Online Logo"
                width={120}  
                height={120} 
                className="h-10 sm:h-12 w-auto object-contain brightness-0 invert"
              />
            </Link>
            <p className="mt-4 text-neutral-500 leading-relaxed max-w-xs">
              The modern marketplace connecting Kabale University students,
              farmers, and trusted local vendors.
            </p>
          </div>

          {/* Marketplace */}
          <div>
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
          <div>
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
          <div>
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

        {/* Bottom Section */}
        <div className="border-t border-neutral-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">

          {/* Copyright */}
          <p className="text-neutral-600 text-[11px] md:text-xs">
            © {currentYear} Kabale Online. All rights reserved.
          </p>

          {/* Social Icons */}
          <div className="flex items-center gap-6 text-neutral-500 text-lg">

            <a
              href="https://wa.me/256759997376"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition duration-200"
              aria-label="WhatsApp"
            >
              <FaWhatsapp />
            </a>

            <a
              href="https://www.fb.com/l/6lp1kJRRR"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition duration-200"
              aria-label="Facebook"
            >
              <FaFacebookF />
            </a>

            <a
              href="https://instagram.com/kabale.online"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition duration-200"
              aria-label="Instagram"
            >
              <FaInstagram />
            </a>

            <a
              href="https://x.com/Kabale_Online"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition duration-200"
              aria-label="X"
            >
              <FaXTwitter />
            </a>

          </div>
        </div>

      </div>
    </footer>
  );
}
