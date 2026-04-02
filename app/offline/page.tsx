// app/offline/page.tsx
"use client";

// Force Next.js to make this page static
export const dynamic = "error"; 

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-md w-full text-center space-y-8 bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        
        {/* Icon */}
        <div className="flex justify-center">
          <div className="bg-slate-50 p-4 rounded-full">
            <span className="text-6xl" role="img" aria-label="Offline signal">
              📡
            </span>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="space-y-3">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            You're offline
          </h1>
          <p className="text-base text-slate-600 font-medium">
            You can still browse items you've already viewed while we wait for your connection to return.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={() => window.location.reload()}
          className="w-full py-4 px-6 bg-[#D97706] hover:bg-amber-600 text-white font-bold rounded-xl transition-all duration-200 active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 uppercase tracking-wider"
        >
          Try reloading
        </button>
        
      </div>
    </div>
  );
}
