"use client";

import { createContext, useContext, useEffect, useState } from "react";

// 🎯 BRAND-FOCUSED THEMES (Orange = primary, Blue = weekend accent only)
const THEMES = {
  weekday: {
    bg: "bg-[#F68B1E] dark:bg-orange-700", // Orange always dominant
    border: "border-orange-500 dark:border-orange-900",
    text: "text-slate-900 dark:text-white",
    highlight: "text-slate-900 dark:text-orange-100",
  },
  weekend: {
    bg: "bg-slate-900 dark:bg-slate-900", // Keep base dark (not blue!)
    border: "border-blue-400 dark:border-blue-700", // Blue accent only
    text: "text-white",
    highlight: "text-blue-300",
  },
};

// Default = weekday (keeps brand strong during SSR)
const ThemeContext = createContext(THEMES.weekday);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState(THEMES.weekday);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const today = new Date().getDay();

    // 0 = Sunday, 6 = Saturday
    const isWeekend = today === 0 || today === 6;

    setTheme(isWeekend ? THEMES.weekend : THEMES.weekday);
    setMounted(true);
  }, []);

  // Avoid hydration mismatch
  if (!mounted) {
    return (
      <ThemeContext.Provider value={THEMES.weekday}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);