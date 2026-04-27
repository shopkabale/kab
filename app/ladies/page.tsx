"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

export default function LadiesPage() {
  const router = useRouter();

  useEffect(() => {
    // A tiny 800ms delay ensures they actually see the cool animation 
    // before the new page takes over.
    const timer = setTimeout(() => {
      router.replace('/category/beauty-fashion');
    }, 800);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-transparent px-4 text-center">
      <div className="flex flex-col items-center animate-pulse">
        
        {/* Animated Icon Box */}
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 border-2 border-amber-100 shadow-sm">
          <Sparkles className="w-10 h-10 text-[#D97706] animate-bounce" />
        </div>
        
        {/* Emotional Loading Text */}
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
          Taking you to Beauty & Fashion...
        </h1>
        <p className="text-base font-medium text-slate-500 max-w-xs mx-auto">
          Gathering the best ladies' picks and premium cosmetics in Kabale ✨
        </p>

        {/* Loading Spinner */}
        <div className="mt-8 flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-[#D97706] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
          <div className="w-2 h-2 bg-[#D97706] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
          <div className="w-2 h-2 bg-[#D97706] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
        </div>

      </div>
    </div>
  );
}
