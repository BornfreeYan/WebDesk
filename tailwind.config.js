/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        macos: {
          red: '#FF5F57',
          yellow: '#FEBC2E',
          green: '#28C840',
        }
      },
      scale: {
        '115': '1.15',
        '110': '1.10',
      }
    },
  },
  plugins: [],
}
