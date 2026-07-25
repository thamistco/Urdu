/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Keep in step with src/theme/colors.ts — that file is the source of
      // truth for runtime styles, this mirrors it for the class names.
      colors: {
        // Calm, focused base — deep aubergine night (calm, focus, warmth)
        ink: {
          DEFAULT: '#1E1024',
          800: '#261630',
          700: '#2F1B3A',
          600: '#3E2449',
          500: '#513260',
        },
        // Warm parchment — the "paper" the script lives on (comfort, readability)
        paper: {
          DEFAULT: '#F6EEE2',
          soft: '#FCF8F0',
          dim: '#E8DAC6',
        },
        // Reward saffron — achievement, energy, warmth (used sparingly)
        gold: {
          DEFAULT: '#E2A13C',
          light: '#EFB458',
          dark: '#B87C24',
        },
        // Pistachio — correct, growth, calm reassurance
        jade: {
          DEFAULT: '#4F8046',
          light: '#93BE72',
          dark: '#35592F',
          deep: '#3F6B3A',
          soft: '#4F804622',
        },
        // Rose madder — incorrect, never an alarming red
        rose: {
          DEFAULT: '#BC4F67',
          light: '#DE8496',
          dark: '#8E3549',
          soft: '#BC4F6722',
        },
        // Streak marigold
        flame: {
          DEFAULT: '#EF8F4A',
          light: '#F8B27C',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        'display-black': ['Fraunces-Black', 'serif'],
        body: ['PublicSans', 'sans-serif'],
        'body-med': ['PublicSans-Med', 'sans-serif'],
        'body-bold': ['PublicSans-Bold', 'sans-serif'],
        nastaliq: ['NotoNastaliq', 'serif'],
        'nastaliq-bold': ['NotoNastaliq-Bold', 'serif'],
      },
      borderRadius: {
        xl2: '20px',
      },
    },
  },
  plugins: [],
};
