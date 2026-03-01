import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand & Mission */}
          <div className="md:col-span-2">
            <Link href="/" className="text-2xl font-bold text-white mb-4 inline-block">
              Kabale <span className="text-primary">Online</span>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed mb-6">
              The Better Way to Inform Your Community. We connect students at Kabale University, local farmers, and verified vendors for safe, Cash-on-Delivery commerce within Kabale town.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Marketplace</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/electronics" className="text-sm hover:text-primary transition-colors">Electronics</Link>
              </li>
              <li>
                <Link href="/agriculture" className="text-sm hover:text-primary transition-colors">Agriculture</Link>
              </li>
              <li>
                <Link href="/students" className="text-sm hover:text-primary transition-colors">Student Market</Link>
              </li>
            </ul>
          </div>

          {/* Support & Legal */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Support</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/profile" className="text-sm hover:text-primary transition-colors">My Orders</Link>
              </li>
              <li className="text-sm">
                Strictly Cash on Delivery
              </li>
              <li className="text-sm">
                Kabale, Uganda
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-slate-500">
            &copy; {currentYear} Kabale Online. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0">
            <p className="text-xs text-slate-600">
              Built for Kabale University & the local community.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}