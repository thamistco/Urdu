/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Calm, focused base — deep indigo night (trust, calm, focus)
        ink: {
          DEFAULT: '#0C1A33',
          800: '#0F2140',
          700: '#152A4E',
          600: '#1D3763',
          500: '#274a82',
        },
        // Warm parchment — the "paper" the script lives on (comfort, readability)
        paper: {
          DEFAULT: '#F4EBD9',
          soft: '#FBF6EC',
          dim: '#E7DAC2',
        },
        // Reward gold — achievement, energy, warmth (used sparingly)
        gold: {
          DEFAULT: '#E8A33D',
          light: '#F0B055',
          dark: '#C9862A',
        },
        // Success green — correct, growth, calm reassurance
        jade: {
          DEFAULT: '#2E8B75',
          light: '#3FA88F',
          soft: '#2E8B7522',
        },
        // Gentle rose — incorrect, never alarming red
        rose: {
          DEFAULT: '#C4456B',
          light: '#D96385',
          soft: '#C4456B22',
        },
        // Streak flame
        flame: {
          DEFAULT: '#FF8A3D',
          light: '#FFB067',
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
