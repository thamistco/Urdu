/**
 * Harf color system — "sunset".
 *
 * The register of an indie game at golden hour: a dusky twilight sky, warm
 * horizon light, and a single glowing accent colour spent on reward. Replaces
 * the earlier flat "comic" palette with something painterly rather than
 * printed — gradients and soft glow instead of hard ink outlines.
 *
 * Still grounded in the same rules that made the comic version legible:
 *  - The ground stays dark enough for long evening sessions — this is a dusky
 *    plum, not daylight orange, so light text still sits comfortably on it.
 *  - Warm cream/sand as the reading surface, for the same reason newsprint
 *    worked: high legibility for the Nastaliq script.
 *  - Sunset orange reserved for reward + primary actions, so it stays the
 *    loudest thing on screen rather than being spent everywhere.
 *  - Green = correct, coral-red = incorrect, tuned warmer to sit inside the
 *    same sunset family rather than reading as a colder, unrelated palette.
 *
 * Every consumer references these by name (`palette.gold`, `palette.ink`, …),
 * so re-theming the whole app is just changing the hex values here.
 */

export const palette = {
  // base — a dusky twilight plum, the sky just after the sun drops
  ink: '#241B3A',
  ink800: '#2E2247',
  ink700: '#3B2C5C',
  ink600: '#4A3872',
  ink500: '#5C4890',

  // surfaces — warm sand, lit like the last light on the horizon
  paper: '#FFEEDD',
  paperSoft: '#FFF6EA',
  paperDim: '#F5DFC0',

  // reward / primary — sunset orange, the warmest thing in the scene
  gold: '#FF8C42',
  goldLight: '#FFB067',
  goldDark: '#D9701F',

  // semantic feedback — a leaf green and a coral red, both warmed to sit in
  // the same family as the rest of the palette
  jade: '#4FBF8B',
  jadeLight: '#7DDBAB',
  jadeDark: '#2E8F63',
  /** For large filled panels, where the full-strength green shouts. */
  jadeDeep: '#3AA876',
  rose: '#FF5A5F',
  roseLight: '#FF8A8E',
  roseDark: '#C7383D',

  // streak — an ember, the glow at the very edge of the horizon
  flame: '#FF6B35',
  flameLight: '#FF9466',

  // text
  cream: '#FFEEDD',
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
