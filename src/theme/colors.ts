/**
 * Harf color system — "comic".
 *
 * Flat saturated fills, black outlines, newsprint paper: the register of a
 * printed comic panel rather than a night sky. Bright colour carries the
 * meaning and near-black holds everything together.
 *
 * Still grounded in colour psychology for learning:
 *  - A near-black indigo ground → the gutter between panels. Dark enough for
 *    long evening sessions, and it makes the flat colours read as ink on press.
 *  - Newsprint cream as the reading surface → comfort and high legibility for
 *    the Nastaliq script, and the right paper for the register.
 *  - Comic yellow reserved for reward + primary actions → the loudest colour in
 *    the set, so it is spent sparingly.
 *  - Green = correct, red = incorrect. Comics do not do subtle, and at this
 *    saturation the pair is unmistakable at a glance.
 *
 * One rule this palette imposes: **lettering on a bright fill is ink, not
 * white.** White on comic green is 2.4:1 and unreadable; ink is 7.7:1, and
 * black lettering on flat colour is what the register does anyway.
 */

export const palette = {
  // base — the near-black indigo of a panel gutter
  ink: '#141222',
  ink800: '#1C1930',
  ink700: '#262240',
  ink600: '#342E56',
  ink500: '#443C6E',

  // surfaces — newsprint
  paper: '#FFF6E2',
  paperSoft: '#FFFCF2',
  paperDim: '#F0E2BE',

  // reward / primary — comic yellow
  gold: '#FFC72C',
  goldLight: '#FFD861',
  goldDark: '#C68F00',

  // semantic feedback — flat green and red
  jade: '#2FBF6B',
  jadeLight: '#5FDC96',
  jadeDark: '#178246',
  /** For large filled panels, where the full-strength green shouts. */
  jadeDeep: '#219B57',
  rose: '#EF3E36',
  roseLight: '#FF7A72',
  roseDark: '#A81F19',

  // streak
  flame: '#FF7A1A',
  flameLight: '#FFA45C',

  // text
  cream: '#FFF6E2',
  white: '#FFFFFF',
} as const;

/** Opacity-tinted helpers for RN (no `/opacity` shorthand at runtime). */
export const withAlpha = (hex: string, alpha: number) => {
  const a = Math.round(Math.min(Math.max(alpha, 0), 1) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
};

export const theme = {
  bg: palette.ink,
  card: palette.ink700,
  cardRaised: palette.ink600,
  border: withAlpha(palette.white, 0.1),
  borderStrong: withAlpha(palette.white, 0.25),
  text: palette.cream,
  textMuted: withAlpha(palette.cream, 0.65),
  textFaint: withAlpha(palette.cream, 0.4),
  primary: palette.gold,
  correct: palette.jade,
  incorrect: palette.rose,
} as const;

export type Palette = typeof palette;
