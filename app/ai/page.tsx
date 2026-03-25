// app/ai/page.tsx
"use client";

import FloatingHelpButton from "@/components/FloatingHelpButton";
import Link from "next/link";

export default function AIGuidePage() {
  // Helper function to trigger the combined floating widget
  const openWidget = () => {
    window.dispatchEvent(new Event('open-ai-widget'));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">

      {/* Hero Section */}
      <div className="bg-slate-900 text-white py-16 px-4 md:py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight">
            Meet the Kabale Online <span className="text-[#D97706]">AI Assistant</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Your personal, 24/7 shopping guide. Whether you are hunting for a specific laptop, looking for professional gear, or need help setting up your first seller account, our AI is here to help.
          </p>

          {/* THE CLEAN "TRY IT OUT" LINK */}
          <button 
            onClick={openWidget}
            className="text-[#D97706] font-bold text-lg md:text-xl hover:text-amber-500 underline underline-offset-8 decoration-2 transition-colors flex items-center justify-center gap-2 mx-auto cursor-pointer"
          >
            Try it out <span className="text-2xl no-underline">↗</span>
          </button>
        </div>
      </div>

      {/* Features Grid */}
      <div id="features" className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Why use the AI Assistant?</h2>
          <p className="text-slate-500 mt-2">Designed to make buying and selling faster than ever.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-3xl mb-6 border border-amber-100">
              🛍️
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Instant Product Discovery</h3>
            <p className="text-slate-600 leading-relaxed">
              Don't want to scroll? Just type <span className="font-semibold text-slate-800">"Show me laptops"</span> or <span className="font-semibold text-slate-800">"Do you have Nike shoes?"</span> and the AI will pull exact products from our local sellers directly into the chat.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl mb-6 border border-blue-100">
              📈
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Learn How to Sell</h3>
            <p className="text-slate-600 leading-relaxed">
              New to the platform? Ask the AI <span className="font-semibold text-slate-800">"How do I post an item?"</span> for quick, step-by-step instructions on how to get your products in front of thousands of buyers in seconds.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-3xl mb-6 border border-green-100">
              🤝
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Always Connected</h3>
            <p className="text-slate-600 leading-relaxed">
              The AI handles the quick searches, but if you ever have a complex issue, it will instantly direct you to our real human support team on WhatsApp at <span className="font-semibold text-green-600">0759997376</span>.
            </p>
          </div>
        </div>
      </div>

      {/* How to use section */}
      <div className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-8">Ready to explore?</h2>
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 md:p-10 text-left">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold flex-shrink-0">1</div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg">Click "Try it out"</h4>
                    <p className="text-slate-600">Click the link above to launch the AI Assistant instantly.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold flex-shrink-0">2</div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg">Type naturally</h4>
                    <p className="text-slate-600">Ask a question exactly like you are texting a colleague. "I need a kettle" or "How do I contact a seller?"</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold flex-shrink-0">3</div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg">Click the products</h4>
                    <p className="text-slate-600">When the AI shows you product cards, click them to go straight to the seller's page and make a deal.</p>
                  </div>
                </div>
              </div>

              {/* Visual Aid - NOW CLICKABLE! */}
              <div className="flex-1 w-full bg-slate-200 rounded-2xl h-64 flex items-center justify-center relative overflow-hidden border border-slate-300">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <button 
                  onClick={openWidget}
                  className="relative bg-white px-6 py-4 rounded-xl shadow-lg border border-slate-100 flex items-center gap-3 hover:border-[#D97706] hover:shadow-xl transition-all cursor-pointer group"
                >
                  <span className="font-bold text-slate-800 group-hover:text-[#D97706] transition-colors">Ask for laptops, shoes, help...</span>
                  <span className="text-[#D97706] opacity-0 group-hover:opacity-100 transition-opacity font-bold">↗</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Navigation Back */}
      <div className="text-center mt-12">
        <Link 
          href="/" 
          className="inline-block text-slate-500 font-bold hover:text-[#D97706] transition-colors"
        >
          ← Go back to shopping
        </Link>
      </div>

      {/* The Combined Floating Help Button is fetched and rendered here */}
      <FloatingHelpButton />
    </div>
  );
}
