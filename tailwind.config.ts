import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1200px",
      },
    },
    extend: {
      colors: {
        cream: "#F5EFE7",
        linen: "#E7DCC6",
        walnut: "#7A4E2D",
        ink: "#2B2B2B",
        clay: "#C96A3A",
        olive: "#6A7B45",
        amber: "#D6A55A",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-cormorant)", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 24px 80px rgba(43, 43, 43, 0.12)",
        glow: "0 0 60px rgba(214, 165, 90, 0.22)",
      },
      backgroundImage: {
        paper:
          "radial-gradient(circle at 20% 20%, rgba(214,165,90,.16), transparent 34%), linear-gradient(135deg, rgba(255,255,255,.42), rgba(231,220,198,.7))",
      },
    },
  },
  plugins: [],
};

export default config;
