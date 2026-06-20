/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  '#f0f3fa',
          100: '#dde4f3',
          200: '#c2cfe9',
          300: '#99b0d9',
          400: '#6a8ac5',
          500: '#4a6db5',
          600: '#3a569a',
          700: '#30457d',
          800: '#1a2744',
          900: '#0f1829',
          950: '#080e1a',
        },
        gold: {
          300: '#f5d98a',
          400: '#f0c84a',
          500: '#d4a017',
          600: '#b8860b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
