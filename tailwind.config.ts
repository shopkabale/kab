import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class', // <--- This prevents automatic dark mode
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
    function ({ addUtilities }: any) {
      addUtilities({
        '.no-scrollbar::-webkit-scrollbar': { 'display': 'none' },
        '.no-scrollbar': { '-ms-overflow-style': 'none', 'scrollbar-width': 'none' },
      })
    }
  ],
};

export default config;
