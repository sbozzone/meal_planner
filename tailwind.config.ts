import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#EDE6D6",
        card: "#F8F2E4",
        "card-header": "#E6DEC9",
        sidebar: "#E0D8C5",
        border: "#C8C1AE",
        "border-light": "#D8D0BC",
        accent: {
          DEFAULT: "#C96840",
          light: "#FAEADA",
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
        card: "12px",
      },
      spacing: {
        "safe-bottom": "env(safe-area-inset-bottom, 0px)",
        "safe-top": "env(safe-area-inset-top, 0px)",
      },
      minHeight: {
        touch: "44px",
      },
    },
  },
  plugins: [],
};

export default config;
