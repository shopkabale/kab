import Link from "next/link";
import { ArrowRight, Watch } from "lucide-react";

export default function TimepieceBanner() {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-black border border-slate-800 shadow-lg group">
      {/* Abstract Background Elements */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-[#FF6A00] opacity-10 blur-3xl transition-opacity group-hover:opacity-20 duration-700"></div>
      <div className="absolute bottom-0 left-10 w-40 h-40 rounded-full bg-blue-500 opacity-10 blur-2xl"></div>

      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between p-6 sm:p-8 md:p-10 gap-6">
        <div className="flex-1 text-center sm:text-left space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/5 backdrop-blur-sm text-xs font-medium text-slate-300 mb-2">
            <Watch size={14} className="text-[#FF6A00]" />
            <span>Premium Collection</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
            Find the perfect <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6A00] to-orange-400">timepiece.</span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto sm:mx-0">
            Elevate your style with our curated selection of top-tier watches. Precision, elegance, and durability on your wrist.
          </p>
          <div className="pt-2">
            <Link 
              href="/category/watches"
              className="inline-flex items-center justify-center gap-2 bg-[#FF6A00] hover:bg-[#e65c00] text-white px-6 py-3 rounded-xl font-medium transition-all active:scale-95 shadow-lg shadow-orange-500/20"
            >
              Explore Watches
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>

        {/* Optional: Replace this div with an actual transparent PNG of a watch */}
        <div className="hidden sm:flex flex-shrink-0 relative w-48 h-48 md:w-64 md:h-64 items-center justify-center">
           <div className="absolute inset-0 bg-gradient-to-tr from-[#FF6A00]/20 to-transparent rounded-full blur-2xl"></div>
           <Watch size={120} className="text-slate-200 drop-shadow-2xl relative z-10 opacity-90" strokeWidth={1} />
        </div>
      </div>
    </div>
  );
}
