/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Keep in step with src/theme/colors.ts — that file is the source of
      // truth for runtime styles, this mirrors it for the class names.
      //
      // This file drifted from colors.ts across two full re-themes (it still
      // had the very first "comic" indigo/yellow values), because NativeWind
      // classes like `bg-ink-700` resolve against THIS config, not the
      // `palette` object — so every className-based colour silently kept the
      // old look while every inline `style={{ color: palette.x }}` moved.
      // When colors.ts changes, this has to change with it, by hand.
      colors: {
        // A warm espresso-black — the ground just after the sun drops.
        ink: {
          DEFAULT: '#211712',
          800: '#2C1F17',
          700: '#3D2A1E',
          600: '#523822',
          500: '#6B4A2B',
        },
        // Warm sand — the light TEXT colour on the dark ground (not a surface;
        // see `parchment` for that, and the note in theme/colors.ts).
        paper: {
          DEFAULT: '#FFEEDD',
          soft: '#FFF6EA',
          dim: '#F5DFC0',
        },
        // Aged paper — the light SURFACE the script is set on.
        parchment: {
          DEFAULT: '#EFDFC7',
          soft: '#F7EBDA',
          dim: '#E2CFB2',
        },
        // Sunset orange — reward and primary actions (used sparingly)
        gold: {
          DEFAULT: '#FF8C42',
          light: '#FFB067',
          dark: '#D9701F',
        },
        // Leaf green — correct
        jade: {
          DEFAULT: '#4FBF8B',
          light: '#7DDBAB',
          dark: '#2E8F63',
          deep: '#3AA876',
          soft: '#4FBF8B22',
        },
        // Coral red — incorrect
        rose: {
          DEFAULT: '#FF5A5F',
          light: '#FF8A8E',
          dark: '#C7383D',
          soft: '#FF5A5F22',
        },
        // Streak — an ember
        flame: {
          DEFAULT: '#FF6B35',
          light: '#FF9466',
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
