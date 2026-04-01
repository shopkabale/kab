import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Documentation & Guide | Kabale Online",
  description: "Learn how to buy, sell, and grow your business on Kabale's premier online marketplace. Complete guide, video tutorials, and promotion steps.",
  keywords: ["Kabale Online guide", "how to sell in Kabale", "buy online Uganda", "Kabale e-commerce setup", "boost ads Kabale"],
  openGraph: {
    title: "Documentation & Guide | Kabale Online",
    description: "The complete guide to buying, selling, and growing your business on Kabale Online.",
    url: "https://kabaleonline.com/guide",
    siteName: "Kabale Online",
    images: [
      {
        url: "/guide-og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Kabale Online Documentation",
      },
    ],
    locale: "en_UG",
    type: "website",
  },
};

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-slate-800 dark:text-slate-200 font-sans selection:bg-[#D97706] selection:text-white pb-20">
      
      {/* HEADER */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111] pt-12 pb-8 px-4 sm:px-6 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto">
          <p className="text-[#D97706] font-bold text-sm mb-2 uppercase tracking-wider">Kabale Online</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            How to Use the Platform
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-base">
            Everything you need to know to buy, sell, and grow your local business.
          </p>
        </div>
      </header>

      {/* MAIN DOCS CONTENT */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 space-y-12">

        {/* SECTION: VIDEO TUTORIALS */}
        <section id="tutorials">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
            1. Video Tutorials
          </h2>
          <div className="bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-lg p-5">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 font-medium">Watch quick guides on how to upload and manage your items:</p>
            <ul className="space-y-3">
              <li>
                <a href="https://www.instagram.com/reel/DWlgI5cDN-N/?igsh=YXRzdjk3dmJoMjdm" target="_blank" rel="noopener noreferrer" className="text-[#D97706] hover:underline flex items-center gap-2 font-medium">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  Watch on Instagram
                </a>
              </li>
              <li>
                <a href="https://vt.tiktok.com/ZSHjNTDWj/" target="_blank" rel="noopener noreferrer" className="text-[#D97706] hover:underline flex items-center gap-2 font-medium">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.04-.1z"/></svg>
                  Watch on TikTok
                </a>
              </li>
            </ul>
          </div>
        </section>

        {/* SECTION: BUYING & SELLING */}
        <section id="basics" className="grid sm:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
              How to Sell
            </h2>
            <ol className="list-decimal list-outside ml-5 space-y-3 text-slate-600 dark:text-slate-400">
              <li>Visit <Link href="/sell" className="text-[#D97706] hover:underline">kabaleonline.com/sell</Link></li>
              <li>Fill in the required details & upload photos</li>
              <li>Tap <strong>Post Product Now</strong></li>
              <li>Login with Google & choose your email</li>
            </ol>
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 rounded-lg text-sm border border-blue-100 dark:border-blue-900">
              <strong>Why we ask for your email:</strong> We send you automatic notifications the moment someone orders your item.
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
              How to Buy
            </h2>
            <ol className="list-decimal list-outside ml-5 space-y-3 text-slate-600 dark:text-slate-400">
              <li>Visit <Link href="/" className="text-[#D97706] hover:underline">Kabale Online</Link></li>
              <li>Choose what you need</li>
              <li>Tap <strong>Buy Fast</strong> (no login required)</li>
              <li>Enter your name & phone number</li>
              <li>Click <strong>Send</strong></li>
            </ol>
            <p className="mt-4 text-sm font-medium text-green-600 dark:text-green-500 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
              You'll receive confirmation via WhatsApp.
            </p>
          </div>
        </section>

        {/* SECTION: PROMOTIONS & PAYMENTS */}
        <section id="promotions">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
            Promotion & Visibility
          </h2>
          
          <div className="space-y-6">
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <div className="bg-slate-50 dark:bg-[#111] px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 dark:text-white">🚀 Boost Your Item (24hrs)</h3>
                <span className="font-mono text-sm font-bold text-[#D97706]">UGX 1,000</span>
              </div>
              <div className="p-5 text-slate-600 dark:text-slate-400 text-sm space-y-2">
                <p>Appears on the homepage in the sponsored carousel.</p>
                <p><strong>Path:</strong> Profile &rarr; My Ads &rarr; Boost</p>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <div className="bg-slate-50 dark:bg-[#111] px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 dark:text-white">⭐ Feature Product (3 Days)</h3>
                <span className="font-mono text-sm font-bold text-[#D97706]">UGX 3,000</span>
              </div>
              <div className="p-5 text-slate-600 dark:text-slate-400 text-sm space-y-2">
                <p>Premium visibility in the Featured section for 72 hours.</p>
                <p><strong>Path:</strong> Profile &rarr; My Ads &rarr; Feature</p>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <div className="bg-slate-50 dark:bg-[#111] px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 dark:text-white">⚡ Urgent Section</h3>
                <span className="font-mono text-sm font-bold text-green-600">FREE</span>
              </div>
              <div className="p-5 text-slate-600 dark:text-slate-400 text-sm space-y-2">
                <p>Limited to 50 items daily. First come, first served.</p>
                <p><strong>Path:</strong> Profile &rarr; My Ads &rarr; Mark as Urgent</p>
              </div>
            </div>
          </div>

          {/* Payment Block */}
          <div className="mt-6 bg-slate-900 text-white rounded-lg p-6 font-mono text-sm shadow-sm">
            <h4 className="text-slate-400 mb-4 uppercase tracking-wider text-xs font-bold">Payment Instructions</h4>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between border-b border-slate-700 pb-2">
                <span>Airtel Money Merchant:</span>
                <span className="text-[#D97706] font-bold">7050183</span>
              </div>
              <div className="flex justify-between border-b border-slate-700 pb-2">
                <span>MTN MoMo Merchant:</span>
                <span className="text-[#D97706] font-bold">14843537</span>
              </div>
            </div>
            <ol className="list-decimal ml-4 space-y-2 text-slate-300">
              <li>Send the required payment to the merchant codes above.</li>
              <li>Send the payment screenshot via WhatsApp to <strong>0759997376</strong>.</li>
              <li>Tap "I have paid" inside your dashboard.</li>
            </ol>
          </div>
        </section>

        {/* SECTION: PLATFORM FEATURES */}
        <section id="features" className="space-y-8">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
            Platform Features
          </h2>

          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">🤖 AI Assistant</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Stuck? Ask our AI for product ideas, pricing help, or business advice.</p>
              <Link href="/ai" className="text-sm text-[#D97706] hover:underline">Go to AI Assistant &rarr;</Link>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">❤️ Wishlist</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Tap the heart icon on any product, or open a product and tap <strong>➕ &rarr; Save for later</strong>. <em>(Login required)</em></p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">💰 Make an Offer</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Negotiate directly. Open a product, tap <strong>➕ &rarr; Make Offer</strong>, enter your price, and send.</p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">🗑️ Delete / Mark as Sold</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Go to your Dashboard &rarr; My Ads. Tap your product and select Delete or Mark as Sold to clean up your inventory.</p>
            </div>
          </div>
        </section>

        {/* SECTION: BEST PRACTICES */}
        <section id="tips">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
            Tips for Success
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">How to Sell Fast (Important)</h3>
              <ul className="list-disc ml-5 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                <li>Use clear, bright images.</li>
                <li>Price your item competitively.</li>
                <li>Add simple, honest descriptions.</li>
                <li>Respond fast to customers.</li>
                <li>Use Boost (1k) for visibility.</li>
                <li>Post trending items (phones, fashion, perfumes).</li>
                <li className="text-slate-900 dark:text-slate-200 font-medium mt-2">💡 Tip: Your first 5 listings matter—make them strong.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">How to Find the Best Deals</h3>
              <ul className="list-disc ml-5 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                <li>Check the <strong>Hot Deals</strong> section on the homepage.</li>
                <li>Look for tags like 🔥 <em>Trending</em> or <em>Discount</em>.</li>
                <li>Use <strong>Make Offer</strong> to negotiate.</li>
                <li>Visit daily (new items are added often).</li>
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION: WHY KABALE ONLINE */}
        <section id="about" className="bg-slate-50 dark:bg-[#111] p-6 sm:p-8 rounded-lg border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            Why Kabale Online?
          </h2>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400 mb-8">
            <li>✓ No shop needed—sell from anywhere</li>
            <li>✓ Reach buyers across Kabale instantly</li>
            <li>✓ No login needed for buyers (easy orders)</li>
            <li>✓ Affordable promotion (from 1k only)</li>
            <li>✓ Built for local sellers, local buyers</li>
            <li>✓ Fast, simple, mobile-first</li>
          </ul>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">📍 Contact & Location</h3>
            <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
              <p>Kabale’s One-Stop Online Marketplace</p>
              <p><strong>Location:</strong> Kabale, Uganda</p>
              <p><strong>Phone / WhatsApp:</strong> 075 999 7376</p>
              <p><strong>Email:</strong> support@kabaleonline.com</p>
              <p><strong>Hours:</strong> Mon–Sun (24 hrs)</p>
              <p className="mt-3 text-[#D97706] font-medium">🚚 Same-day delivery available (Orders between 6:00 AM – 3:00 PM)</p>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
