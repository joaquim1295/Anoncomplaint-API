import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        anon: {
          ghost: "#070A12",
          surface: "#0B1220",
          accent: "#10B981",
          muted: "#162033",
        },
      },
      boxShadow: {
        "glow-emerald": "0 0 0 1px rgba(16,185,129,0.18), 0 0 28px rgba(16,185,129,0.14)",
        "glow-red": "0 0 0 1px rgba(239,68,68,0.22), 0 0 28px rgba(239,68,68,0.14)",
      },
      keyframes: {
        "in-fade": { from: { opacity: "0" }, to: { opacity: "1" } },
        "in-up": { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        shimmer: { from: { transform: "translateX(-30%)" }, to: { transform: "translateX(130%)" } },
      },
      animation: {
        "in-fade": "in-fade 180ms ease-out",
        "in-up": "in-up 220ms cubic-bezier(.2,.8,.2,1)",
        shimmer: "shimmer 1.1s ease-in-out infinite",
      },
      backgroundImage: {
        "cyber-grid":
          "linear-gradient(to right, rgba(16,185,129,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(16,185,129,0.06) 1px, transparent 1px)",
        "cyber-radial":
          "radial-gradient(1200px 700px at 20% 10%, rgba(16,185,129,0.16), transparent 60%), radial-gradient(900px 600px at 80% 20%, rgba(239,68,68,0.12), transparent 55%)",
      },
    },
  },
  plugins: [],
};

export default config;
