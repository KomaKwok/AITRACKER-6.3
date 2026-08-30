import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0b1020",
        mist: "#f3f6fb",
        line: "#d6deeb",
        accent: "#ff6b2c",
        teal: "#0f9d8a",
        gold: "#c28d1b"
      },
      fontFamily: {
        sans: ["Segoe UI", "PingFang SC", "Microsoft YaHei", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["Cascadia Code", "SFMono-Regular", "Consolas", "ui-monospace", "monospace"]
      },
      boxShadow: {
        soft: "0 20px 60px rgba(11, 16, 32, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
