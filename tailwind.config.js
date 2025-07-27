/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: false,
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  // Add safelist to ensure light mode classes are always available
  safelist: [
    'bg-white',
    'text-black',
    'border-gray-200',
    'bg-gray-50',
    'bg-gray-100'
  ]
}

