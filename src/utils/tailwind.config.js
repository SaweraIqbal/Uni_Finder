
export default {
theme: {
  extend: {
    keyframes: {
      "slide-in": {
        "0%": { transform: "translateX(120%)", opacity: "0" },
        "100%": { transform: "translateX(0)", opacity: "1" },
      },
      progress: {
        "0%": { width: "100%" },
        "100%": { width: "0%" },
      },
    },
    animation: {
      "slide-in": "slide-in 0.4s ease-out forwards",
      progress: "progress 2s linear forwards",
    },
  },
},
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
