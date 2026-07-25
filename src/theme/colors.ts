/**
 * Harf color system — "plum & saffron".
 *
 * The register is block-printed textile under lamplight: a deep aubergine
 * ground, saffron for reward, pistachio for growth, rose madder for a miss.
 *
 * Grounded in color psychology for learning (see research brief):
 *  - A deep, desaturated ground → calm, focus, low eye-strain for long evening
 *    sessions. Aubergine keeps the low arousal of a dark base while reading
 *    warm rather than clinical.
 *  - Warm parchment as the reading surface → comfort + high legibility for the
 *    Nastaliq script, evoking paper and heritage rather than a sterile screen.
 *  - Saffron reserved for reward + primary actions → dopamine cue, used
 *    sparingly so it keeps its meaning (achievement, energy).
 *  - Pistachio = correct/growth (reassuring, not clinical).
 *  - Rose madder = incorrect. Deliberately NOT a harsh alarm red — we
 *    acknowledge a miss neutrally instead of scolding.
 *
 * Every foreground/background pair below clears WCAG AA against the surface it
 * is used on; `*Dark` shades exist for the raised buttons' lower edge.
 */

export const palette = {
  // base — aubergine, darkest first
  ink: '#1E1024',
  ink800: '#261630',
  ink700: '#2F1B3A',
  ink600: '#3E2449',
  ink500: '#513260',

  // surfaces
  paper: '#F6EEE2',
  paperSoft: '#FCF8F0',
  paperDim: '#E8DAC6',

  // reward / primary — saffron
  gold: '#E2A13C',
  goldLight: '#EFB458',
  goldDark: '#B87C24',

  // semantic feedback — pistachio and rose madder
  jade: '#4F8046',
  jadeLight: '#93BE72',
  jadeDark: '#35592F',
  /** For large filled panels — a grass green that size reads loud beside plum. */
  jadeDeep: '#3F6B3A',
  rose: '#BC4F67',
  roseLight: '#DE8496',
  roseDark: '#8E3549',

  // streak — marigold
  flame: '#EF8F4A',
  flameLight: '#F8B27C',

  // text
  cream: '#F6EEE2',
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
