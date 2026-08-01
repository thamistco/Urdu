import { View } from 'react-native';
import { Display, Urdu, urduGlyph } from './Text';
import { palette, withAlpha } from '../theme';

/**
 * The name, as a neon sign. The only neon in the app.
 *
 * ## How a tube is faked
 *
 * A neon tube is two things at once: an almost-white core where the gas burns
 * hottest, and the tube's own hue blooming out into the air around it. Draw only
 * the hue and you get flat pink text. Draw only the core and you get white text
 * with a halo. It is the *pair* that reads as neon, and the giveaway is that the
 * bloom is much wider and much softer than anyone expects.
 *
 * React Native gives one text shadow per `Text`, so the bloom is built by
 * stacking copies of the same word — each with a wider, fainter shadow — and
 * painting the core last on top. `LAYERS` is that stack, widest first.
 *
 * ## Why the name stays readable
 *
 * A coloured wordmark usually trades legibility for style. This one does not,
 * because the two jobs are split across the two colours: the magenta carries
 * 5.07:1 against `ink` and does all the glowing, while the core carries 15.97:1
 * and is the only part the eye resolves as letterforms. The sign can be as
 * saturated as it likes — the saturation is all in the bloom.
 *
 * ## Layout
 *
 * The glow copies are absolutely positioned and the core is the one in normal
 * flow, so the core alone determines the size of the block. Every copy shares
 * one style object; if they ever drift apart the sign doubles rather than glows.
 */

/** The bloom, widest and faintest first. Radii are in points, not pixels. */
const LAYERS = [
  { radius: 30, alpha: 0.5 },
  { radius: 16, alpha: 0.65 },
  { radius: 7, alpha: 0.85 },
];

/** The shadow a single copy contributes. */
const bloom = (radius: number, alpha: number) => ({
  textShadowColor: withAlpha(palette.neon, alpha),
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: radius,
});

/** Absolutely positioned copies fill the box the core lays out. */
const STACKED = { position: 'absolute' as const, left: 0, right: 0, textAlign: 'center' as const };

export function Wordmark({ size = 76 }: { size?: number }) {
  const glyph = urduGlyph(size);
  // The Latin name sits at a fraction of the Urdu, which is the mark proper.
  const latin = { fontSize: Math.round(size * 0.46) };

  return (
    <View className="items-center">
      <View className="items-center justify-center">
        {LAYERS.map((l) => (
          <Urdu key={`u${l.radius}`} style={[glyph, STACKED, { color: palette.neon }, bloom(l.radius, l.alpha)]}>
            حرف
          </Urdu>
        ))}
        <Urdu style={[glyph, { color: palette.neonCore }, bloom(4, 1)]}>حرف</Urdu>
      </View>

      <View className="items-center justify-center">
        {LAYERS.map((l) => (
          <Display
            key={`l${l.radius}`}
            style={[latin, STACKED, { color: palette.neon }, bloom(l.radius * 0.6, l.alpha)]}
          >
            Harf
          </Display>
        ))}
        <Display style={[latin, { color: palette.neonCore }, bloom(3, 1)]}>Harf</Display>
      </View>
    </View>
  );
}
