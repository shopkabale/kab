// app/offline/page.tsx
"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full text-center space-y-8 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        
        {/* Icon */}
        <div className="flex justify-center">
          <div className="bg-gray-50 p-4 rounded-full">
            <span className="text-6xl" role="img" aria-label="Offline signal">
              📡
            </span>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            You're offline
          </h1>
          <p className="text-base text-gray-600">
            You can still browse items you've already viewed while we wait for your connection to return.
          </p>
        </div>

        {/* Helpful Hints */}
        <div className="bg-gray-50 rounded-2xl p-5 text-sm text-gray-600 space-y-3 text-left border border-gray-100">
          <p className="flex items-center gap-3">
            <span className="text-xl">⚡</span> Check your internet connection
          </p>
          <p className="flex items-center gap-3">
            <span className="text-xl">⏳</span> Try again in a moment
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={() => window.location.reload()}
          className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] shadow-sm flex items-center justify-center gap-2"
        >
          <span>↻</span> Try reloading
        </button>
        
      </div>
    </div>
  );
}
