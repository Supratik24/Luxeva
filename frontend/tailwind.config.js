/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        sand: "#F5F5F0",
        ink: "#151515",
        mist: "#f0f1eb",
        // accent replaces "olive" for buttons/highlights — visible on dark bg
        olive: "#151515",
        accent: "#151515",
        clay: "#737373",
        brass: "#525252",
        // dark surface palette
        "dark-bg": "#151515",
        "dark-surface": "#1c1c1c",
        "dark-card": "#222222",
        "dark-sidebar": "#151515"
      },
      fontFamily: {
        sans: ["'DM Sans'", "sans-serif"],
        display: ["'Playfair Display'", "serif"]
      },
      boxShadow: {
        soft: "0 4px 32px rgba(0,0,0,0.06)",
        card: "0 2px 16px rgba(0,0,0,0.04)",
        float: "0 20px 60px rgba(0,0,0,0.12)",
        "dark-card": "0 2px 16px rgba(0,0,0,0.4)",
        "dark-float": "0 20px 60px rgba(0,0,0,0.6)"
      },
      backgroundImage: {
        "mesh-light": "linear-gradient(135deg, #f0f1eb 0%, #F5F5F0 100%)",
        "mesh-dark": "linear-gradient(135deg, #151515 0%, #151515 100%)"
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease-out",
        "fade-in": "fadeIn 0.4s ease-out",
        "marquee": "marquee 35s linear infinite"
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: 0, transform: "translateY(20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" }
        },
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 }
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-100%)" }
        }
      }
    }
  },
  plugins: []
};
