module.exports = {
  darkMode: 'class', // Enables dark mode using 'class'
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: '#1D2021',
        dark1: '#3C3836',
        dark2: '#504945',
        fadedGreen: '#79740e',
        brightGreen: '#b8bb26',
        fadedRed: '#9d0006',
        brightRed: '#fb4934',
        fadedYellow: '#b57614',
        brightYellow: '#fabd2f',
        slopHighlight: '#9A9D1F',
        characterHighlight: '#458588',
        personaHighlight: '#b16286',
        speechHighlight: '#98971a',
        thoughtsHighlight: '#689d6a',
        actionsHighlight: '#d65d0e',
        warningHighlight: '#D16C00',
      },
    },
  },
  plugins: [],
};
