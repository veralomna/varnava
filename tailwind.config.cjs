/** @type {import('tailwindcss').Config} */
module.exports = {
  variants: {
    backgroundColor: ['responsive', 'hover', 'focus'],
    backgroundOpacity: ['responsive', 'hover', 'focus'],
    backgroundPosition: ['responsive'],
    borderColor: ['responsive', 'hover', 'focus'],
    boxShadow: ['responsive', 'hover', 'focus'],
    boxSizing: ['responsive'],
    borderOpacity: ['responsive', 'hover', 'focus'],
    fontWeight: ['responsive', 'hover', 'focus'],
    opacity: ["responsive", "hover", "focus", "disabled"],
    order: ['responsive'],
    outline: ['responsive', 'focus'],
    placeholderColor: ['responsive', 'focus'],
    placeholderOpacity: ['responsive', 'focus'],
    rotate: ['responsive', 'hover', 'focus'],
    scale: ['responsive', 'hover', 'focus'],
    skew: ['responsive', 'hover', 'focus'],
    textColor: ['responsive', 'hover', 'focus'],
    textDecoration: ['responsive', 'hover', 'focus'],
    textOpacity: ['responsive', 'hover', 'focus'],
    translate: ['responsive', 'hover', 'focus']
  },
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    fontFamily: {
      "display" : "Oswald, Helvetica, sans",
      "body" : "Open Sans, Helvetica, Arial, sans-serif",
      "mono" : "Roboto Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    },
    extend: {
        flex: {
            "100": "1 0 100%"
        },
        spacing: {
            "1/2": ".175rem",
            "3/2": ".375rem",
            "72": "18rem",
            "84": "21rem",
            "96": "24rem",
            "110": "27rem",
            "124": "30rem",
            "138": "33rem",
            "152": "36rem",
            "page": "940px"
        },
        fontSize: {
            "2xs" : ".7rem",
            "3xs" : ".6rem"
        },
        minWidth: {
            "1/4": "25%",
            "1/3": "33%",
            "1/2": "50%",
            "3/4": "75%"
        },
        maxHeight: {
            "1/4": "25%",
            "1/2": "50%",
            "3/4": "75%"
        },
        animation: {
          "spin-slow": "spin 3s linear infinite",
          "wiggle": "wiggle 1s ease-in-out infinite",
        },
        keyframes: {
          wiggle: {
            "0%, 100%": { transform: "rotate(-4deg) scale(1.1)" },
            "50%": { transform: "rotate(4deg)" },
          }
        }
    }
  },
  plugins: [],
}
