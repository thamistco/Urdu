/**
 * Harf color system — "sunset".
 *
 * The register of an indie game at golden hour: a dusky twilight sky, warm
 * horizon light, and a single glowing accent colour spent on reward. Replaces
 * the earlier flat "comic" palette with something painterly rather than
 * printed — gradients and soft glow instead of hard ink outlines.
 *
 * The base was originally a dusky plum-violet, and it read as exactly the
 * thing it was trying not to be: the stock "twilight synthwave" gradient every
 * AI image generator defaults to. Real sunset scenery — the Alto's Adventure /
 * Journey reference this was built from — shades dark through warm brown and
 * oxblood, not violet, so the base moved there instead: an espresso-black
 * ground shading toward burnt orange, no purple anywhere in the ramp.
 *
 * Still grounded in the same rules that made the earlier versions legible:
 *  - The ground stays dark enough for long evening sessions.
 *  - Warm cream/sand as the reading surface, for the same reason newsprint
 *    worked: high legibility for the Nastaliq script.
 *  - Sunset orange reserved for reward + primary actions, so it stays the
 *    loudest thing on screen rather than being spent everywhere.
 *  - Green = correct, coral-red = incorrect, tuned warm to sit inside the same
 *    family rather than reading as a colder, unrelated palette.
 *
 * Every consumer references these by name (`palette.gold`, `palette.ink`, …),
 * so re-theming the whole app is just changing the hex values here.
 */

export const palette = {
  // base — a warm espresso-black, the ground just after the sun drops.
  // Chosen over the deep purple it replaces specifically to avoid violet.
  ink: '#211712',
  ink800: '#2C1F17',
  ink700: '#3D2A1E',
  ink600: '#523822',
  ink500: '#6B4A2B',

  /**
   * `paper` is a *text* colour: the light ink used for body copy on the dark
   * ground. It is deliberately near-white, because that is what it has to be
   * to stay legible at 14px on espresso-black.
   *
   * It used to double as the fill for light card surfaces too, and that
   * conflation was a real bug: a card painted in a colour chosen for small
   * text is a near-white slab, and at the size of a grammar table or a reading
   * passage it stops reading as a surface and starts reading as a hole punched
   * in the screen. The two roles could never be tuned independently while they
   * shared one token — darkening the card also dimmed every paragraph in the
   * app. `parchment` below is the surface; this stays the text.
   */
  paper: '#FFEEDD',
  paperSoft: '#FFF6EA',
  paperDim: '#F5DFC0',

  /**
   * Light reading surfaces — cards, tables, passages, the ground Nastaliq is
   * set on. Dark-on-light genuinely is easier for the script, so these stay
   * light; they are just pulled off pure white into aged paper so they sit
   * inside the sunset palette instead of glaring out of it. Still 12:1 against
   * ink text, far beyond what the script needs.
   */
  parchment: '#EFDFC7',
  parchmentSoft: '#F7EBDA',
  parchmentDim: '#E2CFB2',

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

  /**
   * The misty-forest family — a second scenery, not a second theme.
   *
   * Sourced from a real "into the woods" reference palette (fog, moss, pine),
   * used by `LatticeBackground`'s `scene="forest"` for sections that want a
   * change of place rather than a change of mood: the sunset stays the app's
   * one identity, this is scenery variety within it. Warm gold light still
   * filters through — the point was to mix the orange in, not replace it.
   */
  mossDeep: '#262B15',
  mossDark: '#464B37',
  mossCharcoal: '#3F3F3F',
  mossLight: '#A9B39C',
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
