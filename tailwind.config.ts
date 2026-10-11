import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        luxury: {
          black: "#0D0D0D",
          charcoal: "#111111",
          gold: "#C5A059",
          "gold-champagne": "#D4AF37",
          "gold-light": "#E6CA65",
          sand: "#FAF8F5",
          cream: "#FEFDF5",
          silk: "#F9F8F0",
          muted: "#888888",
        },
      },
      fontFamily: {
        serif: ["Playfair Display", "Didot", "Bodoni MT", "Georgia", "serif"],
        sans: ["Plus Jakarta Sans", "Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      letterSpacing: {
        widest: ".25em",
        ultra: ".35em",
      },
      animation: {
        marquee: "marquee 25s linear infinite",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
