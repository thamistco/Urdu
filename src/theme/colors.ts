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
   * The scenery: a landscape after Edward Hopper.
   *
   * Hopper's language is hard-edged planes of flat colour, big simple masses,
   * raking light, and one warm accent doing all the emotional work. What he is
   * usually remembered for — high, bright daylight on a white clapboard wall —
   * is the one thing this cannot have. The scenery sits behind body text on
   * every screen and is held to 6:1 against it, which caps any colour here at a
   * relative luminance of 0.1016. A sunlit white is 0.76. It is not a matter of
   * taste; the arithmetic forbids it.
   *
   * So this is his *other* register — the late, low light of the road and rail
   * paintings, where the sky has gone slate and one band near the horizon is
   * still warm. The compositional grammar is intact; only the key is lowered.
   *
   * Every value below was measured, not chosen. Contrast against `paper`:
   * slate 12.66, mid 11.19, low 9.84, warm 6.17, cloud lit 6.55, cloud shade
   * 10.50, land 12.62 / 14.55 / 16.13. The lit cloud face is 2.43x the
   * luminance of the shadow face, which is what makes a flat shape read as a
   * solid lit from one side rather than as two greys.
   */
  skySlate: '#242A28',
  skyMid: '#2E332C',
  skyLow: '#3E3A2E',
  /** The one warm note, low down. Everything else defers to it. */
  skyWarm: '#7A4E28',

  /**
   * Cloud, in two flat tones — a sunlit face and a shadowed one.
   *
   * These are drawn **opaque**, which reverses the rule the soft scenery lived
   * by: "nothing in the air has a hard edge". That rule existed because
   * semi-transparent shapes show their own outline over a gradient, and two
   * overlapping at alpha a composite to 2a-a², leaving a visible seam. Opaque
   * shapes of the same colour have neither problem — they simply union. The
   * old rule was a workaround for alpha, not a law about clouds.
   */
  cloudLit: '#4F5743',
  cloudShade: '#31382C',

  /** Ground, in three flat planes, each darker than the one behind it. */
  landFar: '#252B1C',
  landMid: '#1A1F14',
  landNear: '#10140C',
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
