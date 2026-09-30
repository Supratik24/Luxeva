/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        sand: "#F5F5F0",
        ink: "#0A0A0A",
        mist: "#FAFAFA",
        olive: "#0A0A0A",
        clay: "#737373",
        brass: "#525252"
      },
      fontFamily: {
        sans: ["'DM Sans'", "sans-serif"],
        display: ["'Playfair Display'", "serif"]
      },
      boxShadow: {
        soft: "0 4px 32px rgba(0,0,0,0.06)",
        card: "0 2px 16px rgba(0,0,0,0.04)",
        float: "0 20px 60px rgba(0,0,0,0.12)"
      },
      backgroundImage: {
        "mesh-light": "linear-gradient(135deg, #FAFAFA 0%, #F5F5F0 100%)",
        "mesh-dark": "linear-gradient(135deg, #0A0A0A 0%, #111111 100%)"
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease-out",
        "fade-in": "fadeIn 0.4s ease-out"
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: 0, transform: "translateY(20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" }
        },
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 }
        }
      }
    }
  },
  plugins: []
};
