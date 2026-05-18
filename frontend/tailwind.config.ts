import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bebas Neue"', "system-ui", "sans-serif"],
        body:    ['"Darker Grotesque"', "system-ui", "sans-serif"],
        sans:    ['"Darker Grotesque"', "system-ui", "sans-serif"],
        mono:    ['"JetBrains Mono"', "Fira Code", "monospace"],
      },
      borderRadius: {
        card:    "16px",
        "card-lg": "24px",
        pill:    "9999px",
      },
      colors: {
        violet: {
          900: "#1e0f3a",
          700: "#4c1d9b",
          600: "#6d28d9",
          500: "#7c3aed",
          400: "#a78bfa",
          300: "#c4b5fd",
        },
        success: "#22c55e",
        danger:  "#ef4444",
        warning: "#f59e0b",
        info:    "#38bdf8",
      },
      animation: {
        "fade-in":   "fadeIn 0.45s ease both",
        "fade-up":   "fadeUp 0.55s cubic-bezier(0.16,1,0.3,1) both",
        "scale-in":  "scaleIn 0.35s cubic-bezier(0.16,1,0.3,1) both",
        "float":     "floatY 5s ease-in-out infinite",
        "marquee":   "marquee 30s linear infinite",
        "orb-float": "orbFloat 12s ease-in-out infinite",
        "pulse-slow":"pulse 3s ease-in-out infinite",
        "spin-slow": "spin 2s linear infinite",
        "brand-pulse":"brandPulse 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn:  { from: { opacity: "0" }, to: { opacity: "1" } },
        fadeUp:  { from: { opacity: "0", transform: "translateY(28px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        scaleIn: { from: { opacity: "0", transform: "scale(0.94)" }, to: { opacity: "1", transform: "scale(1)" } },
        floatY:  { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-12px)" } },
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        orbFloat:{ "0%,100%": { transform: "translate(0,0) scale(1)" }, "33%": { transform: "translate(30px,-20px) scale(1.04)" }, "66%": { transform: "translate(-20px,15px) scale(0.97)" } },
        brandPulse: { "0%,100%": { boxShadow: "0 0 0 0 rgba(124,58,237,0.6)" }, "50%": { boxShadow: "0 0 0 6px rgba(124,58,237,0)" } },
      },
    },
  },
  plugins: [],
};

export default config;
