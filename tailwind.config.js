/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#22C55E',
        'primary-dark': '#16A34A',
        background: '#FAFAFA',
        foreground: '#0F172A',
        'dark-bg': '#0F172A',
        'dark-card': '#1E293B',
        'dark-border': '#334155',
        'dark-text': '#F1F5F9',
        'dark-muted': '#94A3B8',
      },
    },
  },
  plugins: [],
};
