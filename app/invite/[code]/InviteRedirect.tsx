"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function InviteRedirect({ code }: { code: string }) {
  const router = useRouter();

  useEffect(() => {
    // 🚀 FIXED: Removed the strict length === 5 check.
    // Now it will accept "HEMTIT" (6 chars) or any other code length.
    if (code && code.trim().length > 0) {
      const maxAge = 30 * 24 * 60 * 60; // 30 days
      document.cookie = `kabale_ref=${code.trim()}; path=/; max-age=${maxAge}`;
    }

    // Redirect to the homepage after a split second
    router.replace("/");
  }, [code, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#D97706] mb-4"></div>
      <h1 className="text-2xl font-black text-slate-900 mb-2">Accepting Invite...</h1>
      <p className="text-slate-500 text-sm">Taking you to Kabale Online.</p>
    </div>
  );
}
