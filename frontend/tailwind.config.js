/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        trello: {
          blue: '#0079bf',
          bg: '#fafbfc',
          list: '#ebecf0',
          card: '#ffffff',
          text: '#172b4d'
        }
      }
    },
  },
  plugins: [],
}
