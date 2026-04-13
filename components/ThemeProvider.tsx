"use client";

import { createContext, useContext, useEffect, useState } from "react";

// 🔥 JUMIA-STYLE SOLID COLORS (Vibrant backgrounds with dark, contrasting text)
const THEMES = {
  0: { bg: "bg-sky-400 dark:bg-sky-800", border: "border-sky-500 dark:border-sky-900", text: "text-slate-900 dark:text-white", highlight: "text-slate-800 dark:text-sky-100" }, // Sunday (Light Blue like "Curated for You")
  
  1: { bg: "bg-[#F68B1E] dark:bg-orange-700", border: "border-orange-500 dark:border-orange-900", text: "text-slate-900 dark:text-white", highlight: "text-slate-900 dark:text-orange-100" }, // Monday (Exact Jumia Orange)
  
  2: { bg: "bg-emerald-400 dark:bg-emerald-800", border: "border-emerald-500 dark:border-emerald-900", text: "text-slate-900 dark:text-white", highlight: "text-slate-900 dark:text-emerald-100" }, // Tuesday (Fresh Green)
  
  3: { bg: "bg-purple-400 dark:bg-purple-800", border: "border-purple-500 dark:border-purple-900", text: "text-slate-900 dark:text-white", highlight: "text-slate-900 dark:text-purple-100" }, // Wednesday (Premium Purple)
  
  4: { bg: "bg-yellow-400 dark:bg-yellow-700", border: "border-yellow-500 dark:border-yellow-900", text: "text-slate-900 dark:text-white", highlight: "text-slate-900 dark:text-yellow-100" }, // Thursday (Flash Yellow)
  
  5: { bg: "bg-red-600 dark:bg-red-800", border: "border-red-700 dark:border-red-900", text: "text-white", highlight: "text-red-100 hover:text-white" }, // Friday (Mega Sale Red - uses white text for contrast)
  
  6: { bg: "bg-slate-200 dark:bg-slate-800", border: "border-slate-300 dark:border-slate-700", text: "text-slate-900 dark:text-white", highlight: "text-slate-700 dark:text-slate-300" }, // Saturday (Clean Slate)
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
