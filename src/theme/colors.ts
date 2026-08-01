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
   * The scenery: a landscape after Caspar David Friedrich.
   *
   * The method is aerial perspective and nothing else. Depth here is not drawn,
   * it is *dissolved*: each ridge is lighter and cooler than the one in front of
   * it because more air stands between it and the eye, and mist lies in every
   * gap. Only the nearest silhouette is solid; everything behind it is on its
   * way to becoming sky.
   *
   * This replaced a Hopper landscape of hard-edged flat planes. The two are
   * opposite instincts — Hopper draws the edge where light stops, Friedrich
   * dissolves it — and it is worth being plain that the softness is the whole
   * point rather than a lack of definition.
   *
   * The same ceiling applies as ever: this sits behind body text at 6:1, so no
   * colour here may exceed a relative luminance of 0.1016. That is what stops
   * the luminous band being genuinely luminous — Friedrich's skies open onto
   * white, and white is 1.0. The band is the brightest thing the arithmetic
   * allows and everything else is pitched below it, which turns out to be
   * enough, because what reads as light is the *interval* between the band and
   * the dark it sits above, not the absolute value.
   *
   * Warm, because the rest of the app is. An earlier pass rendered this in
   * Friedrich's own cold blue-grey, which was faithful to him and made the
   * scenery the only cool thing in a warm product — the orange lesson markers
   * sang against it and nothing else agreed with it. The method is his; the
   * key is the app's own dusk.
   *
   * Measured against `paper`: high 13.68, mid 9.78, pale 7.13, ridges 8.66 /
   * 10.71 / 13.03, foreground 15.26. `skyWarm` is 5.77 at full strength and is
   * never drawn at full strength — it exists only inside the glow gradient, so
   * what matters is the composite, which check:scenery measures.
   */
  skyHigh: '#2A2119',
  skyMid: '#4A3722',
  /** The luminous band above the horizon — the brightest tone permitted. */
  skyPale: '#66492B',
  /** One faint warm note inside the glow, so it reads as light and not as haze. */
  skyWarm: '#7E5324',

  /**
   * Mist.
   *
   * Deliberately far too bright to use at full strength — it exists only to be
   * laid over the ridges at low alpha, and the composite is what the contrast
   * check measures. Each gap gets exactly *one* band: two soft shapes at alpha
   * `a` compose to about `2a - a²`, and stacking them is what once put the
   * scenery under the WCAG floor while every individual value looked safe.
   */
  mist: '#C8B79E',

  /**
   * The ridges, far to near. Lighter with distance, which is the reverse of
   * what looks right until you see it: the far hills are pale because there is
   * more air in front of them, not because they are lit.
   */
  ridgeFar: '#414433',
  ridgeMid: '#333628',
  ridgeNear: '#252819',
  /** The foreground silhouette — the one solid, unresolved shape. */
  foreground: '#171A10',

  /**
   * The sun catching an edge — rim light on the skylines and treetops.
   *
   * The light source in the scene is a low warm sun, so the edges it rims are
   * warm: an ember orange rather than the tube colour of a sign. This is the
   * brightest such orange the scenery's ceiling permits, measured at 6.41:1
   * against `paper` — warm hues are expensive here, because luminance is
   * 0.2126R + 0.7152G + 0.0722B and orange spends heavily on red and green.
   *
   * An earlier pass lit these edges in electric blue, on the reasoning that
   * blue is the only hue that survives the cap at full intensity. True, and
   * beside the point: it made the landscape itself look like signage. Neon
   * belongs on the name, where it is a made object; the land is lit by the sun
   * that is in the picture.
   */
  rimLight: '#9B3408',

  /**
   * The sign. Only the wordmark is neon — nothing else in the app is.
   *
   * A real tube is not one colour, it is two: an almost-white core where the
   * gas is hottest, and the tube's own hue blooming out around it. Rendering
   * only the hue gives flat coloured text; rendering only the core gives white
   * text with a halo. Both, layered, is what reads as neon.
   *
   * The split also settles legibility, which a coloured wordmark usually loses.
   * The magenta carries 5.07:1 against `ink` — fine for glow, thin for reading —
   * while the core carries 15.97:1 and is the part the eye actually resolves. So
   * the sign can be as saturated as it likes without the name getting harder to
   * read, because the saturation is all in the bloom.
   *
   * Note these are *foreground* colours and so are not bound by the scenery's
   * 0.1044 ceiling, which applies only to what sits behind body text. The
   * constraint here runs the other way: they need to be bright.
   */
  neon: '#FF2D95',
  neonCore: '#FFF0FA',
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
