/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F5F0E8",
        surface: "#EDE7DC",
        "warm-input": "#E4DDD0",
        "warm-border": "#D6CFC4",
        "warm-dark": "#1A1208",
        "warm-mid": "#7A6652",
        forest: {
          DEFAULT: "#2D5A1B",
          light: "#4A7C2F",
        },
        terracotta: "#C4622D",
      },
      fontFamily: {
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
