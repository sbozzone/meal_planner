import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#EDE6D6",
        card: "#F8F2E4",
        paper: "#FCF9F0",
        "card-header": "#E6DEC9",
        sidebar: "#E0D8C5",
        border: "#C8C1AE",
        "border-light": "#D8D0BC",
        accent: {
          DEFAULT: "#C96840",
          light: "#FAEADA",
          tint: "#F0D8C2",
          dark: "#7A2F12",
          hover: "#B45530",
        },
        text: {
          DEFAULT: "#1E1609",
          secondary: "#6A5F4E",
          muted: "#93897A",
        },
        green: "#3A8A5E",
        blue: "#3A6F95",
        gold: "#B08810",
        red: "#B84232",
      },
      fontFamily: {
        serif: ["var(--font-lora)", "Georgia", "serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-dm-mono)", "monospace"],
      },
      borderRadius: {
        card: "16px",
        xl: "20px",
        "2xl": "24px",
        "3xl": "32px",
      },
      boxShadow: {
        // Warm-tinted elevation — shadows lean brown, not gray, so they
        // settle into the cream palette instead of muddying it.
        "warm-sm": "0 1px 2px rgba(72, 48, 24, 0.06), 0 1px 1px rgba(72, 48, 24, 0.04)",
        warm: "0 2px 4px rgba(72, 48, 24, 0.05), 0 6px 16px rgba(72, 48, 24, 0.06)",
        "warm-md": "0 4px 10px rgba(72, 48, 24, 0.07), 0 12px 28px rgba(72, 48, 24, 0.08)",
        "warm-lg": "0 10px 24px rgba(72, 48, 24, 0.10), 0 24px 56px rgba(72, 48, 24, 0.12)",
        nav: "0 6px 20px rgba(72, 48, 24, 0.16), 0 16px 40px rgba(72, 48, 24, 0.14)",
        "accent-glow": "0 4px 14px rgba(201, 104, 64, 0.32)",
        hairline: "inset 0 1px 0 rgba(255, 255, 255, 0.55)",
      },
      backgroundImage: {
        "accent-gradient":
          "linear-gradient(135deg, #D4774E 0%, #C96840 52%, #B14E2C 100%)",
        "today-gradient":
          "linear-gradient(180deg, rgba(250, 234, 218, 0.85) 0%, rgba(248, 242, 228, 0.6) 100%)",
      },
      spacing: {
        "safe-bottom": "env(safe-area-inset-bottom, 0px)",
        "safe-top": "env(safe-area-inset-top, 0px)",
      },
      minHeight: {
        touch: "44px",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.32, 0.72, 0, 1)",
      },
      keyframes: {
        rise: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        confetti: {
          "0%": { transform: "translateY(-6vh) rotate(0deg)", opacity: "1" },
          "85%": { opacity: "1" },
          "100%": { transform: "translateY(106vh) rotate(640deg)", opacity: "0" },
        },
        "check-pop": {
          "0%": { transform: "scale(0.4)" },
          "60%": { transform: "scale(1.25)" },
          "100%": { transform: "scale(1)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-4deg)" },
          "50%": { transform: "rotate(4deg)" },
        },
      },
      animation: {
        rise: "rise 0.45s cubic-bezier(0.32, 0.72, 0, 1) both",
        "fade-in": "fade-in 0.3s ease both",
        "pop-in": "pop-in 0.25s cubic-bezier(0.32, 0.72, 0, 1) both",
        confetti: "confetti 1.8s ease-in both",
        "check-pop": "check-pop 0.3s cubic-bezier(0.32, 0.72, 0, 1) both",
        wiggle: "wiggle 2.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
