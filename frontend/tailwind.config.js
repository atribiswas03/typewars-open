/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          black: "#050505",
          dark: "#0a0a0a",
          neon: "#00f3ff",
          purple: "#bc00ff",
          pink: "#ff0055",
          green: "#00ff41",
        }
      },
      fontFamily: {
        mono: ['"Fira Code"', 'monospace'],
      },
      animation: {
        'pulse-neon': 'pulse-neon 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'matrix-rain': 'matrix-rain 20s linear infinite',
      },
      keyframes: {
        'pulse-neon': {
          '0%, 100%': { opacity: 1, filter: 'drop-shadow(0 0 5px #00f3ff)' },
          '50%': { opacity: 0.7, filter: 'drop-shadow(0 0 15px #00f3ff)' },
        }
      }
    },
  },
  plugins: [],
}
