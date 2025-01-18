module.exports = {
  darkMode: 'class', // Enables dark mode using 'class'
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        slopHighlight: '#9A9D1F',
        characterHighlight: '#87CEEB',
        personaHighlight: '#FFB6C1',
        speechHighlight: '#98FB98',
        thoughtsHighlight: '#A6A6BA',
        actionsHighlight: '#FFDAB9',
        warningHighlight: '#D16C00',
      },
    },
  },
  plugins: [],
};
