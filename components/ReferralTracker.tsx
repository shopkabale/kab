"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function ReferralTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Wrap in try-catch to be absolutely safe in Next.js edge environments
    try {
      const ref = searchParams.get("ref");

      // 🚀 FIXED: Removed the strict length === 5 check!
      // Now it accepts any valid code length (like "HEMTIT" or "SAM123")
      if (ref && ref.trim().length > 0) {
        const maxAge = 30 * 24 * 60 * 60; // 30 days in seconds

        // Ensure we are in a browser environment
        if (typeof document !== 'undefined') {
          // Path=/ ensures the cookie is readable across the entire site and API routes
          document.cookie = `kabale_ref=${ref.trim()}; path=/; max-age=${maxAge}`;
        }
      }
    } catch (error) {
      console.error("Referral tracking error:", error);
    }
  }, [searchParams]);

  return null; // This component is invisible
}
