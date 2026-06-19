/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#162022",
        paper: "#f7f4ed",
        sea: "#155e75",
        mint: "#d9f2e6",
        coral: "#e76f51",
        gold: "#f4a261"
      },
      boxShadow: {
        panel: "0 16px 40px rgba(22, 32, 34, 0.08)"
      }
    },
  },
  plugins: [],
};
