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
  paperDim: '#F5DFC0',

  /**
   * Light reading surfaces — cards, tables, passages, the ground Nastaliq is
   * set on. Dark-on-light genuinely is easier for the script, so these stay
   * light; they are just pulled off pure white into aged paper so they sit
   * inside the sunset palette instead of glaring out of it. Still 12:1 against
   * ink text, far beyond what the script needs.
   */
  parchment: '#EFDFC7',

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
   * Accents that only ever mark *which one* — a CEFR stage, a unit on the path.
   * They carry no meaning of their own (unlike jade = correct, rose = wrong);
   * they exist so a long list doesn't read as one flat hue.
   *
   * These lived as bare hex inside `words.ts` and `units.ts`, which meant a
   * re-theme moved the whole app and left the level badges behind.
   */
  accentAmber: '#FFC72C',
  accentMint: '#5FDC96',
  accentCoral: '#FF7A72',
  accentSky: '#5AA9FF',
  accentTeal: '#6FB3B0',

  /**
   * The scenery used to live here: a drawn landscape after Caspar David
   * Friedrich, in eleven tokens — four sky tones, mist, three ridges, a
   * foreground silhouette and a rim light. It was replaced by a photograph
   * (`DuskScene`), and a token nothing uses is the most invisible kind of dead
   * code there is, so they went with it. `git log` has them if the drawing is
   * ever wanted back.
   */

  /**
   * The lit sign has no colours of its own, and that is deliberate.
   *
   * It was briefly a magenta tube with a near-white core, on two bespoke tokens.
   * The magenta was the mistake: it put the contrast on hue, so the sign argued
   * with the landscape instead of standing in it. A sign in real woods contrasts
   * by *category* — built, geometric, powered — not by colour.
   *
   * So the tube is `gold` and the filament core is `paper`, both already above.
   * The sign is made out of the palette rather than beside it, there is no
   * wordmark colour to keep in sync through a re-theme, and the core inherits
   * body copy's own contrast, which is what keeps the name legible while the
   * amber stays soft. See `components/Wordmark.tsx`.
   */
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
