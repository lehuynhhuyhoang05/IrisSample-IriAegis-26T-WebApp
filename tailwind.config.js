/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F4EFE6',
        ink: '#111111',
        signal: '#FF4F2B',
        lemon: '#FFD84D',
        alert: '#C62A0B',
      },
      boxShadow: {
        hard: '5px 5px 0 0 #111111',
        hardsm: '3px 3px 0 0 #111111',
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
