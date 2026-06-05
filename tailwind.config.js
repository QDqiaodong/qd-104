/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,vue}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8B7355',
          50: '#F5F0EB',
          100: '#E8DED3',
          200: '#D4C4B0',
          300: '#C0A88D',
          400: '#A68B6A',
          500: '#8B7355',
          600: '#6F5C44',
          700: '#534533',
          800: '#372E22',
          900: '#1B1711',
        },
        secondary: {
          DEFAULT: '#D4C4B0',
          light: '#E8DDD0',
        },
        accent: {
          DEFAULT: '#E8B4B8',
          light: '#F5D5D8',
          dark: '#D4898F',
        },
        warm: {
          bg: '#FAF8F5',
          card: '#FFFFFF',
          border: '#E8E2DB',
        },
        text: {
          primary: '#3D3D3D',
          secondary: '#6B6B6B',
          muted: '#9B9B9B',
        }
      },
      fontFamily: {
        serif: ['Noto Serif SC', 'Georgia', 'serif'],
        sans: ['Noto Sans SC', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(139, 115, 85, 0.07), 0 10px 20px -2px rgba(139, 115, 85, 0.04)',
        'card': '0 4px 20px -2px rgba(139, 115, 85, 0.1)',
      },
    },
  },
  plugins: [],
}
