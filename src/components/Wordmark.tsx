import { View } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { Display, Urdu, urduGlyph } from './Text';
import { GeoDivider } from './GeoDivider';
import { palette, withAlpha } from '../theme';

/**
 * The name, lit.
 *
 * ## Where the contrast goes
 *
 * An earlier pass made this a magenta tube and it fought the picture. The
 * mistake was putting the contrast on *hue* — a colour that argues with the
 * landscape rather than a thing that stands apart from it. A lit sign in real
 * woods does not clash by colour; it clashes by **category**. It is powered
 * where everything else is only lit by a sun going down.
 *
 * So the contrast is in kind — filament, bloom, spill — and the hue agrees with
 * the scene. That is what lets it read as belonging and as intruding at once.
 *
 * ## Why it is not a whole sign
 *
 * The pass after the magenta one built the full object: a dark plate, a double
 * marquee rule, a bulb rail. It was more literally a motel sign and less good.
 * A framed panel is a *card*, and this app is already made of cards — so
 * instead of standing out against the landscape it joined the UI, and the eye
 * read it as another surface rather than as the one lit thing in the dusk.
 *
 * What actually carries the idea is the light: the filament, the bloom, and the
 * spill onto the air behind it. The frame was never doing that work. Glowing
 * letters in the open are both simpler and more like a sign than a box was.
 *
 * ## Why it needs no colours of its own
 *
 * The tube is `gold` and the filament core is `paper`: the app's primary accent
 * and the app's body-text colour, unchanged. The sign is built out of the
 * palette rather than beside it, and there is no such thing as a wordmark colour
 * to keep in sync with a re-theme. Two bespoke tokens were deleted to get here.
 *
 * The core carries the legibility — `paper` on the dark plate is the same
 * contrast body copy gets everywhere else — so the amber is free to be soft.
 * Subdued is the point: a vintage tube glows, it does not shout.
 *
 * ## Why it is a panel and not glowing text
 *
 * Floating letters are drawn; a sign is built. The plate, the double rule and
 * the bulb rail are what make it an object standing in the scene, and the halo
 * behind it is what stitches it into the dusk instead of pasting it on top — a
 * lit sign at nightfall throws light onto the air around it, and without that
 * spill the sign and the landscape stay two separate pictures.
 */

/** Spacing scale. Every gap in here is a multiple of it. */
const U = 4;

/** How far the halo reaches past the plate, in points. */
const SPILL = 96;

/**
 * The bloom, widest and faintest first, on a geometric falloff — even steps read
 * as banding, halving reads as light. React Native allows one shadow per `Text`,
 * so each entry is another copy of the word stacked under the core.
 */
const LAYERS = [
  { radius: 24, alpha: 0.34 },
  { radius: 12, alpha: 0.46 },
  { radius: 5, alpha: 0.62 },
];

const bloom = (radius: number, alpha: number) => ({
  textShadowColor: withAlpha(palette.gold, alpha),
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: radius,
});

/** Glow copies sit under the core; only the core is in flow, so it sets the size. */
const STACKED = { position: 'absolute' as const, left: 0, right: 0, textAlign: 'center' as const };

/** One tube: the bloom stack, then the filament. */
function Tube({ children, style, urdu }: { children: string; style: object; urdu?: boolean }) {
  const Face = urdu ? Urdu : Display;
  return (
    <View className="items-center justify-center">
      {LAYERS.map((l) => (
        <Face key={l.radius} style={[style, STACKED, { color: palette.gold }, bloom(l.radius, l.alpha)]}>
          {children}
        </Face>
      ))}
      <Face style={[style, { color: palette.paper }, bloom(4, 0.85)]}>{children}</Face>
    </View>
  );
}

export function Wordmark({ size = 76 }: { size?: number }) {
  // The mark leads and the name follows at well under half its size — close
  // sizes read as two competing titles rather than as a hierarchy.
  //
  // `urduGlyph` opens the line box to 2.7x the font size, which is right for
  // Nastaliq set as running text — the script needs the air, and its descenders
  // and dots go a long way below and above the baseline. Inside a sign panel it
  // is a cavern: it made the plate half again as tall as it needed to be and
  // stranded the glyph in dead space. So the line box is pulled in here and the
  // baseline nudged to match, which is a wordmark-only concern and stays local.
  // 2.7 was a cavern and 1.5 was a collision — the tail of the ف landed on top
  // of the H. This clears the descender and no more.
  const glyph = { ...urduGlyph(size), lineHeight: Math.round(size * 1.85), transform: [{ translateY: 0 }] };
  const latin = { fontSize: Math.round(size * 0.4), letterSpacing: 1 };

  return (
    <View className="items-center justify-center">
      {/* Light thrown onto the dusk. Reaches zero at the rim so it has no edge
          of its own — the name glows into the air, it does not sit on a disc.

          The insets live on this wrapper and the Svg simply fills it. Putting
          them on the Svg itself, alongside `width="100%"`, made it resolve its
          width from the *un*-expanded box and anchor at the left inset — so the
          glow sat up and to the left of the word it was supposed to be coming
          from, as an unexplained smudge in the sky. */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: -SPILL, right: -SPILL, top: -SPILL, bottom: -SPILL }}
      >
        <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <Defs>
            <RadialGradient id="signHalo" cx="0.5" cy="0.5" r="0.5">
              <Stop offset="0" stopColor={withAlpha(palette.gold, 0.15)} />
              <Stop offset="0.5" stopColor={withAlpha(palette.gold, 0.05)} />
              <Stop offset="1" stopColor={withAlpha(palette.gold, 0)} />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100" height="100" fill="url(#signHalo)" />
        </Svg>
      </View>

      <Tube style={glyph} urdu>
        حرف
      </Tube>
      {/* The gap goes on the wrapper, never on `latin` itself: a margin in the
          text style would move the in-flow core and leave the absolutely
          positioned glow copies behind, and a bloom offset from its own letters
          is a double-exposure rather than a glow. */}
      <View style={{ marginTop: U * 1.5 }}>
        <Tube style={latin}>Harf</Tube>
      </View>
      <GeoDivider opacity={0.42} />
    </View>
  );
}
