/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        sand: "#ead9c8",
        ink: "#121212",
        mist: "#f5f1eb",
        olive: "#4f5a45",
        clay: "#a96b4f",
        brass: "#c69b53"
      },
      fontFamily: {
        sans: ["Manrope", "sans-serif"],
        display: ["Cormorant Garamond", "serif"]
      },
      boxShadow: {
        soft: "0 20px 80px rgba(15, 23, 42, 0.12)"
      },
      backgroundImage: {
        "mesh-light":
          "radial-gradient(circle at top left, rgba(198, 155, 83, 0.18), transparent 30%), radial-gradient(circle at top right, rgba(169, 107, 79, 0.16), transparent 35%), linear-gradient(180deg, #fcfaf7 0%, #f6efe6 100%)",
        "mesh-dark":
          "radial-gradient(circle at top left, rgba(198, 155, 83, 0.12), transparent 30%), radial-gradient(circle at top right, rgba(234, 217, 200, 0.12), transparent 35%), linear-gradient(180deg, #151515 0%, #111111 100%)"
      }
    }
  },
  plugins: []
};

