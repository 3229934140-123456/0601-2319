/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: "#EAF2FE",
          100: "#D0E2FC",
          200: "#A1C4F9",
          300: "#72A7F5",
          400: "#4389F2",
          500: "#1E6FD9",
          600: "#1959B0",
          700: "#134388",
          800: "#0E2E60",
          900: "#0D2137",
          950: "#06101C",
        },
        medical: {
          blue: "#1E6FD9",
          dark: "#0D2137",
          deeper: "#06101C",
        },
        status: {
          success: "#34C759",
          warning: "#FF9500",
          danger: "#FF3B30",
          info: "#5AC8FA",
        },
      },
      fontFamily: {
        sans: ["'PingFang SC'", "'Microsoft YaHei'", "'Noto Sans SC'", "system-ui", "sans-serif"],
        mono: ["'SF Mono'", "'JetBrains Mono'", "Consolas", "monospace"],
      },
      boxShadow: {
        "glow-blue": "0 0 20px rgba(30, 111, 217, 0.3)",
        "glow-green": "0 0 20px rgba(52, 199, 89, 0.3)",
        "glow-red": "0 0 20px rgba(255, 59, 48, 0.3)",
        "card": "0 4px 24px rgba(0, 0, 0, 0.12)",
        "card-hover": "0 8px 32px rgba(30, 111, 217, 0.15)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "grid-pattern": "linear-gradient(rgba(30, 111, 217, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(30, 111, 217, 0.08) 1px, transparent 1px)",
      },
      backgroundSize: {
        "grid": "24px 24px",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.6s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "count": "count 1s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        count: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
