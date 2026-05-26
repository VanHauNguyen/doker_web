/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        ink: '#0d1728',
        panel: '#132033',
        panel2: '#1a2a42',
        line: 'rgba(226, 214, 181, 0.16)',
        accent: '#d2a45a',
        mint: '#46b5a6',
        warn: '#d69a3d',
        danger: '#e05d74',
      },
      boxShadow: {
        premium: '0 24px 80px rgba(3, 8, 18, 0.38)',
      },
    },
  },
  plugins: [],
}
