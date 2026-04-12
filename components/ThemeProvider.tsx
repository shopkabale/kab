"use client";

import { createContext, useContext, useEffect, useState } from "react";

// Define our daily themes using Tailwind classes
const THEMES = {
  0: { bg: "bg-blue-50 dark:bg-blue-950/20", border: "border-blue-200 dark:border-blue-900/50", text: "text-blue-900 dark:text-blue-400", highlight: "text-blue-600" }, // Sunday (Trust/Calm)
  1: { bg: "bg-orange-50 dark:bg-orange-950/20", border: "border-orange-200 dark:border-orange-900/50", text: "text-orange-900 dark:text-orange-400", highlight: "text-orange-600" }, // Monday (Energy/Urgency)
  2: { bg: "bg-lime-50 dark:bg-lime-950/20", border: "border-lime-200 dark:border-lime-900/50", text: "text-lime-900 dark:text-lime-400", highlight: "text-lime-600" }, // Tuesday (Fresh/Natural)
  3: { bg: "bg-purple-50 dark:bg-purple-950/20", border: "border-purple-200 dark:border-purple-900/50", text: "text-purple-900 dark:text-purple-400", highlight: "text-purple-600" }, // Wednesday (Premium)
  4: { bg: "bg-amber-50 dark:bg-amber-950/20", border: "border-amber-200 dark:border-amber-900/50", text: "text-amber-900 dark:text-amber-400", highlight: "text-amber-600" }, // Thursday (Warmth)
  5: { bg: "bg-red-50 dark:bg-red-950/20", border: "border-red-200 dark:border-red-900/50", text: "text-red-900 dark:text-red-400", highlight: "text-red-600" }, // Friday (Sale/Excitement)
  6: { bg: "bg-slate-50 dark:bg-slate-900/50", border: "border-slate-200 dark:border-slate-800", text: "text-slate-900 dark:text-slate-300", highlight: "text-slate-700" }, // Saturday (Clean/Modern)
};

const ThemeContext = createContext(THEMES[6]); // Default to Saturday/Neutral

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState(THEMES[6]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const today = new Date().getDay();
    setTheme(THEMES[today as keyof typeof THEMES]);
    setMounted(true);
  }, []);

  // Avoid hydration mismatch by rendering a neutral state until client loads
  if (!mounted) {
     return <ThemeContext.Provider value={THEMES[6]}>{children}</ThemeContext.Provider>;
  }

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
