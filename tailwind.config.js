/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0046FF",
        secondary: "#001BB7",
        accent: "#FF8040",
        canvas: "#F5F1DC",
        charcoal: "#2C2C2C"
      },
      fontFamily: {
        sans: ["Inter", "Open Sans", "sans-serif"],
        display: ["Inter", "sans-serif"]
      }
    }
  },
  plugins: []
};
