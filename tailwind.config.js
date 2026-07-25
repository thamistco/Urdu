/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Keep in step with src/theme/colors.ts — that file is the source of
      // truth for runtime styles, this mirrors it for the class names.
      colors: {
        // The near-black indigo of a panel gutter
        ink: {
          DEFAULT: '#141222',
          800: '#1C1930',
          700: '#262240',
          600: '#342E56',
          500: '#443C6E',
        },
        // Newsprint — the "paper" the script lives on (comfort, readability)
        paper: {
          DEFAULT: '#FFF6E2',
          soft: '#FFFCF2',
          dim: '#F0E2BE',
        },
        // Comic yellow — reward and primary actions (used sparingly)
        gold: {
          DEFAULT: '#FFC72C',
          light: '#FFD861',
          dark: '#C68F00',
        },
        // Flat green — correct
        jade: {
          DEFAULT: '#2FBF6B',
          light: '#5FDC96',
          dark: '#178246',
          deep: '#219B57',
          soft: '#2FBF6B22',
        },
        // Flat red — incorrect
        rose: {
          DEFAULT: '#EF3E36',
          light: '#FF7A72',
          dark: '#A81F19',
          soft: '#EF3E3622',
        },
        // Streak
        flame: {
          DEFAULT: '#FF7A1A',
          light: '#FFA45C',
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
