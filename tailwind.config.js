/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Mirrors src/theme/colors.ts, which is the source of truth.
      //
      // This has to be a mirror rather than an import: NativeWind resolves
      // class names like `bg-ink-700` against THIS file at build time, and it
      // is CommonJS loaded by the bundler, so it cannot pull in a TS module.
      //
      // Hand-maintained mirrors drift, and this one did — across two full
      // re-themes it still held the very first "comic" indigo/yellow values,
      // so every className colour silently kept the old look while every
      // inline `style={{ color: palette.x }}` moved. Nothing looked broken;
      // the app was simply two themes at once.
      //
      // `npm run check:theme` now compares the two token by token and fails on
      // any difference, in either direction. That is what keeps this honest —
      // not the comment above it, which is what was here last time.
      colors: {
        // A warm espresso-black — the ground just after the sun drops.
        ink: {
          DEFAULT: '#211712',
          800: '#2C1F17',
          700: '#3D2A1E',
          600: '#523822',
        },
        // Warm sand — the light TEXT colour on the dark ground (not a surface;
        // see `parchment` for that, and the note in theme/colors.ts).
        paper: {
          DEFAULT: '#FFEEDD',
          dim: '#F5DFC0',
        },
        // Aged paper — the light SURFACE the script is set on.
        parchment: {
          DEFAULT: '#EFDFC7',
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
        },
        // Coral red — incorrect
        rose: {
          DEFAULT: '#FF5A5F',
          light: '#FF8A8E',
          dark: '#C7383D',
        },
        // Streak — an ember
        flame: {
          DEFAULT: '#FF6B35',
          light: '#FF9466',
        },
        // Which-one-is-it accents: stages, units. No meaning of their own.
        accent: {
          amber: '#FFC72C',
          mint: '#5FDC96',
          coral: '#FF7A72',
          sky: '#5AA9FF',
          teal: '#6FB3B0',
        },
        cream: '#FFEEDD',
        white: '#FFFFFF',
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
