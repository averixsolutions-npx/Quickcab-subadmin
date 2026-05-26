import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        outfit: ["Outfit", "sans-serif"],
      },
      colors: {
        brand: {
          purple:       "#5E5CE6",
          "purple-light": "#818CF8",
          "purple-dark":  "#4338CA",
          "purple-muted": "#EEF2FF",
          "purple-muted-dark": "#1E1B4B",
          green:         "#02E642",
          "green-muted": "#011A08",
          orange:        "#FF9900",
          "orange-muted":"#2D1F00",
          red:           "#FF453A",
          "red-muted":   "#2D0A0A",
        },
        light: {
          bg:        "#F5F6FA",
          surface:   "#FFFFFF",
          "surface-2": "#F8F9FC",
          border:    "#E5E7EB",
          "border-2":"#D1D5DB",
          text:      "#111318",
          "text-2":  "#6B7280",
          "text-3":  "#9CA3AF",
        },
        dark: {
          bg:        "#1A1C24",
          surface:   "#22242F",
          "surface-2":"#1E2028",
          border:    "#32364A",
          "border-2":"#42465C",
          text:      "#F0F2F8",
          "text-2":  "#8B8FA8",
          "text-3":  "#5A5D70",
        },
      },
      borderRadius: {
        "4xl": "2rem",
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      boxShadow: {
        card:        "0 1px 3px 0 rgba(0,0,0,0.04), 0 1px 2px -1px rgba(0,0,0,0.04)",
        "card-dark": "0 1px 3px 0 rgba(0,0,0,0.3), 0 1px 2px -1px rgba(0,0,0,0.3)",
        "purple-glow":"0 0 20px rgba(94,92,230,0.15)",
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        shimmer:   "shimmer 2s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
