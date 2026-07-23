/**
 * Harf color system.
 *
 * Grounded in color psychology for learning (see research brief):
 *  - Deep indigo night as the base → calm, focus, trust, low eye-strain for long
 *    evening sessions. Blue lowers arousal and supports sustained concentration.
 *  - Warm parchment as the reading surface → comfort + high legibility for the
 *    Nastaliq script, evoking paper and heritage rather than a sterile screen.
 *  - Gold reserved for reward + primary actions → dopamine cue, used sparingly so
 *    it keeps its meaning (achievement, energy).
 *  - Jade green = correct/growth (reassuring, not clinical).
 *  - Muted rose = incorrect. Deliberately NOT a harsh alarm red — we acknowledge
 *    a miss neutrally instead of scolding (calmer, less discouraging).
 */

export const palette = {
  // base
  ink: '#0C1A33',
  ink800: '#0F2140',
  ink700: '#152A4E',
  ink600: '#1D3763',
  ink500: '#274A82',

  // surfaces
  paper: '#F4EBD9',
  paperSoft: '#FBF6EC',
  paperDim: '#E7DAC2',

  // reward / primary
  gold: '#E8A33D',
  goldLight: '#F0B055',
  goldDark: '#C9862A',

  // semantic feedback
  jade: '#2E8B75',
  jadeLight: '#3FA88F',
  rose: '#C4456B',
  roseLight: '#D96385',

  // streak
  flame: '#FF8A3D',
  flameLight: '#FFB067',

  // text
  cream: '#F4EBD9',
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
