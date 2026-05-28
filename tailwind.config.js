/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        'surface-low': "var(--surface-container-low)",
        'surface-lowest': "var(--surface-container-lowest)",
        primary: "var(--primary)",
        'primary-container': "var(--primary-container)",
        'on-primary': "var(--on-primary)",
        secondary: "var(--secondary)",
        tertiary: "var(--tertiary)",
        foreground: "var(--on-surface)",
        border: "var(--border)",
        input: "var(--surface-container-highest)",
        'surface-highest': "var(--surface-container-highest)",
        'surface-container-highest': "var(--surface-container-highest)",
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['Manrope', 'sans-serif'],
      },
      boxShadow: {
        'ambient': '0 32px 32px -16px rgba(27, 28, 26, 0.04)',
      }
    },
  },
  plugins: [],
}
