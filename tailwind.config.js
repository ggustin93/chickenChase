/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Explicitly disable dark mode
  darkMode: 'media', // We override this with CSS to prevent it from working
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

