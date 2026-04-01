import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How to Use Kabale Online | Buyer & Seller Guide",
  description: "Learn how to buy, sell, and grow your business on Kabale's premier online marketplace. Fast delivery, secure payments, and easy setup.",
  keywords: ["Kabale Online guide", "how to sell in Kabale", "buy online Uganda", "Kabale e-commerce setup", "boost ads Kabale"],
  openGraph: {
    title: "How to Use Kabale Online 🚀",
    description: "The complete guide to buying, selling, and growing your business on Kabale Online. Join the local digital economy today.",
    url: "https://kabaleonline.com/guide",
    siteName: "Kabale Online",
    images: [
      {
        url: "/guide-og-image.jpg", // Add a nice 1200x630 banner to your /public folder
        width: 1200,
        height: 630,
        alt: "Kabale Online Guide",
      },
    ],
    locale: "en_UG",
    type: "website",
  },
};

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-slate-100 font-sans selection:bg-[#D97706] selection:text-white pb-20">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-20 pb-16 px-4 overflow-hidden flex flex-col items-center text-center border-b border-slate-200 dark:border-slate-800">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D97706]/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl mx-auto">
          <span className="inline-block py-1.5 px-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black uppercase tracking-widest shadow-sm mb-6 border border-slate-200 dark:border-slate-700">
            Welcome to the Marketplace
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
            Buy. Sell. <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D97706] to-amber-400">Grow.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 font-medium mb-10 max-w-2xl mx-auto">
            Kabale’s one-stop online marketplace. Whether you're clearing out your closet or scaling your local business, we make it simple.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sell" className="px-8 py-4 bg-[#D97706] hover:bg-amber-600 text-white font-black rounded-xl transition-all shadow-lg hover:-translate-y-1">
              Start Selling Now
            </Link>
            <Link href="/" className="px-8 py-4 bg-white dark:bg-[#111] text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-800 hover:border-[#D97706] dark:hover:border-[#D97706] font-bold rounded-xl transition-all">
              Start Shopping
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-[1000px] mx-auto px-4 mt-12 space-y-16">

        {/* 2. THE CORE ACTIONS (BUY VS SELL) */}
        <section className="grid md:grid-cols-2 gap-6">
          {/* How to Sell Card */}
          <div className="bg-white dark:bg-[#111] p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-[#D97706]"></div>
            <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/30 text-[#D97706] rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-sm border border-amber-100 dark:border-amber-900/50">🛍️</div>
            <h2 className="text-2xl font-black mb-6">How to Sell</h2>
            <ul className="space-y-4">
              <li className="flex gap-4 items-start">
                <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                <p className="font-medium text-slate-600 dark:text-slate-300">Visit the <Link href="/sell" className="text-[#D97706] hover:underline font-bold">Sell Page</Link> & fill in item details.</p>
              </li>
              <li className="flex gap-4 items-start">
                <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                <p className="font-medium text-slate-600 dark:text-slate-300">Tap <strong>Post Product Now</strong>.</p>
              </li>
              <li className="flex gap-4 items-start">
                <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                <p className="font-medium text-slate-600 dark:text-slate-300">Login securely with Google.</p>
              </li>
              <li className="flex gap-4 items-start">
                <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">4</span>
                <p className="font-medium text-slate-600 dark:text-slate-300">You're live! We'll email you the moment someone orders.</p>
              </li>
            </ul>
          </div>

          {/* How to Buy Card */}
          <div className="bg-white dark:bg-[#111] p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-blue-500"></div>
            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950/30 text-blue-500 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-sm border border-blue-100 dark:border-blue-900/50">🛒</div>
            <h2 className="text-2xl font-black mb-6">How to Buy</h2>
            <ul className="space-y-4">
              <li className="flex gap-4 items-start">
                <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                <p className="font-medium text-slate-600 dark:text-slate-300">Find what you need on the homepage.</p>
              </li>
              <li className="flex gap-4 items-start">
                <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                <p className="font-medium text-slate-600 dark:text-slate-300">Tap <strong>Buy Fast</strong> (No account required!).</p>
              </li>
              <li className="flex gap-4 items-start">
                <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                <p className="font-medium text-slate-600 dark:text-slate-300">Enter your name & WhatsApp number.</p>
              </li>
              <li className="flex gap-4 items-start">
                <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">4</span>
                <p className="font-medium text-slate-600 dark:text-slate-300">Receive instant confirmation and arrange delivery.</p>
              </li>
            </ul>
          </div>
        </section>

        {/* 3. SELLER GROWTH TOOLS (Pricing Tiers style) */}
        <section>
          <h2 className="text-3xl font-black text-center mb-2">Seller Growth Tools 🚀</h2>
          <p className="text-slate-500 text-center font-medium mb-8">Get your products seen by thousands of buyers.</p>
          
          <div className="grid md:grid-cols-3 gap-4">
            {/* Urgent */}
            <div className="bg-white dark:bg-[#111] p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] uppercase font-black px-2 py-1 rounded">Daily Limit: 50</span>
              <h3 className="text-xl font-black mt-3">Urgent Section</h3>
              <p className="text-3xl font-black my-2">Free</p>
              <p className="text-sm text-slate-500 mb-4 h-10">Mark your item as urgent to push it to the quick-sale board.</p>
              <p className="text-xs font-bold text-slate-400">First come, first served.</p>
            </div>

            {/* Boosted */}
            <div className="bg-amber-50 dark:bg-[#D97706]/10 p-6 rounded-2xl border-2 border-[#D97706] relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#D97706] text-white text-[10px] uppercase font-black px-3 py-1 rounded-full shadow-sm">Most Popular</span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2">Boost Ad</h3>
              <p className="text-3xl font-black text-[#D97706] my-2">UGX 1K</p>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 h-10">Pins your item to the highly visible sponsored deals carousel.</p>
              <p className="text-xs font-bold text-slate-500">Duration: 24 Hours</p>
            </div>

            {/* Featured */}
            <div className="bg-indigo-50 dark:bg-indigo-950/20 p-6 rounded-2xl border border-indigo-200 dark:border-indigo-900/50">
              <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-[10px] uppercase font-black px-2 py-1 rounded">Premium Visibility</span>
              <h3 className="text-xl font-black mt-3">Feature Ad</h3>
              <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 my-2">UGX 3K</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 h-10">Massive exposure in the Featured Picks section.</p>
              <p className="text-xs font-bold text-slate-500">Duration: 3 Days</p>
            </div>
          </div>

          <div className="mt-6 bg-slate-900 dark:bg-black text-white p-6 rounded-2xl text-center shadow-lg max-w-2xl mx-auto">
            <p className="font-bold mb-3 text-sm uppercase tracking-widest text-slate-400">How to pay for Boost/Feature:</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-4">
              <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg font-mono font-bold">Airtel: 7050183</span>
              <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-4 py-2 rounded-lg font-mono font-bold">MTN: 14843537</span>
            </div>
            <p className="text-sm text-slate-300">Send payment &rarr; Send screenshot to WhatsApp (0759997376) &rarr; Tap "I have paid" in dashboard.</p>
          </div>
        </section>

        {/* 4. TIPS & BEST PRACTICES GRID */}
        <section className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#111] p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-black mb-4 flex items-center gap-2">⚡ How to Sell Fast</h3>
            <ul className="space-y-3 text-sm font-medium text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2"><span>📷</span> Use clear, bright, high-quality images.</li>
              <li className="flex items-center gap-2"><span>💰</span> Price your item competitively.</li>
              <li className="flex items-center gap-2"><span>📝</span> Write simple, honest descriptions.</li>
              <li className="flex items-center gap-2"><span>🚀</span> Boost your listing for 1k to guarantee views.</li>
              <li className="flex items-center gap-2"><span>💬</span> Respond instantly to customer messages.</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-[#111] p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-black mb-4 flex items-center gap-2">🔍 Finding the Best Deals</h3>
            <ul className="space-y-3 text-sm font-medium text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2"><span>🔥</span> Check the "Hot Deals" and "Sponsored" sections daily.</li>
              <li className="flex items-center gap-2"><span>🏷️</span> Look for "Trending" or "Discount" tags.</li>
              <li className="flex items-center gap-2"><span>🤝</span> Use the "Make Offer" button to negotiate prices.</li>
              <li className="flex items-center gap-2"><span>❤️</span> Tap the heart icon to save items to your Wishlist.</li>
            </ul>
          </div>
        </section>

        {/* 5. WHY US / VALUE PROP */}
        <section className="bg-[#D97706]/10 border border-[#D97706]/20 rounded-3xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-6">Why Kabale Online?</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {["No physical shop needed", "Instant local reach", "No buyer login required", "Affordable marketing", "Mobile-first & Fast"].map((benefit, i) => (
              <span key={i} className="bg-white dark:bg-[#111] text-slate-800 dark:text-slate-200 px-4 py-2 rounded-full text-sm font-bold shadow-sm border border-slate-200 dark:border-slate-800">
                ✅ {benefit}
              </span>
            ))}
          </div>
          <p className="mt-8 text-slate-600 dark:text-slate-400 font-medium">Built for local sellers. Built for local buyers. We are Kabale's digital economy.</p>
        </section>

      </div>
    </div>
  );
}
