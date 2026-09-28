/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 10px 30px rgba(15, 23, 42, 0.12)"
      },
      colors: {
        brand: {
          50: "#f3f8ff",
          100: "#dfeeff",
          500: "#2c6be4",
          700: "#1d4fd7",
          900: "#0f172a"
        }
      }
    }
  },
  plugins: []
};
