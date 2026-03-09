import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'media', // Adapts automatically to the device's dark/light mode
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0ea5e9",
        background: "#f8fafc",
      },
    },
  },
  plugins: [
    // This custom plugin hides the ugly native scrollbar on mobile
    function ({ addUtilities }: any) {
      addUtilities({
        '.no-scrollbar::-webkit-scrollbar': { 'display': 'none' },
        '.no-scrollbar': { '-ms-overflow-style': 'none', 'scrollbar-width': 'none' },
      })
    }
  ],
};

export default config;
