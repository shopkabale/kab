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
  FaTruckFast
} from "react-icons/fa6";

export default function Footer() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  // Hide footer on admin pages
  if (pathname?.startsWith("/admin")) return null;

  return (
    <footer className="bg-black text-neutral-400 border-t border-neutral-800 mt-auto text-xs md:text-sm">
      <div className="max-w-7xl mx-auto px-6 py-10 md:py-14">

        {/* Main Grid - Updated to 5 columns on desktop to give the contact section more breathing room */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 md:gap-12">

          {/* Brand & Contact Info (Spans 2 columns) */}
          <div className="col-span-2 lg:col-span-2">
            <Link
              href="/"
              className="text-xl md:text-2xl font-semibold text-white tracking-tight"
            >
              Kabale<span className="text-[#D97706]">Online</span>
            </Link>
            
            <p className="mt-3 mb-6 text-neutral-300 font-medium tracking-wide">
              Kabale's One-Stop Online Marketplace
            </p>

            {/* Contact Details List */}
            <ul className="space-y-4 text-neutral-400">
              <li className="flex items-start gap-3">
                <FaLocationDot className="mt-0.5 shrink-0 text-neutral-500 text-base" /> 
                <span>Kabale, Uganda</span>
              </li>
              
              <li className="flex items-center gap-3">
                <FaPhone className="shrink-0 text-neutral-500 text-base" /> 
                <a href="tel:+256759997376" className="hover:text-white transition">075 999 7376</a>
              </li>
              
              <li className="flex items-center gap-3">
                <FaEnvelope className="shrink-0 text-neutral-500 text-base" /> 
                <a href="mailto:support@kabaleonline.com" className="hover:text-white transition">support@kabaleonline.com</a>
              </li>
              
              <li className="flex items-start gap-3">
                <FaClock className="mt-0.5 shrink-0 text-neutral-500 text-base" /> 
                <span>Mon - Sun / 24 Hrs</span>
              </li>
              
              <li className="flex items-start gap-3">
                <FaTruckFast className="mt-0.5 shrink-0 text-neutral-500 text-base" /> 
                <span className="leading-snug">
                  Same day delivery
                  <br/>
                  <span className="text-[11px] text-neutral-500 block mt-0.5">If ordered between 6:00 AM - 3:00 PM</span>
                </span>
              </li>
            </ul>
          </div>

          {/* Marketplace */}
          <div className="col-span-1">
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
          <div className="col-span-1">
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
          <div className="col-span-1">
            <h3 className="text-white text-[11px] uppercase tracking-widest mb-4">
              Account
            </h3>
            <ul className="space-y-3">
              <li><Link href="/profile" className="hover:text-white transition">My Profile</Link></li>
              <li><Link href="/sell" className="hover:text-white transition">Post an Ad</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Section */}
        <div className="border-t border-neutral-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">

          {/* Copyright */}
          <p className="text-neutral-600 text-[11px] md:text-xs text-center md:text-left">
            © {currentYear} Kabale Online. All rights reserved.
          </p>

          {/* Social Icons */}
          <div className="flex items-center justify-center gap-6 text-neutral-500 text-lg">

            <a
              href="https://wa.me/256759997376"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#25D366] transition duration-200"
              aria-label="WhatsApp"
            >
              <FaWhatsapp />
            </a>

            <a
              href="https://www.fb.com/l/6lp1kJRRR"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#1877F2] transition duration-200"
              aria-label="Facebook"
            >
              <FaFacebookF />
            </a>

            <a
              href="https://instagram.com/kabale.online"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#E4405F] transition duration-200"
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
