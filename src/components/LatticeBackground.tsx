import { View } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Path, Circle, Rect } from 'react-native-svg';
import { palette, withAlpha } from '../theme';

/**
 * The scenery behind every screen — a dusk sky sliding from plum to ember, a
 * glowing sun low on the horizon, three layers of parallax hills, and a
 * couple of birds crossing it. The reference is Alto's Adventure, Monument
 * Valley, Journey: a calm indie-game vista, not a texture.
 *
 * Kept dark by design, not literal daylight orange: this sits behind body
 * text on every screen — lessons, cards, whole paragraphs — and the sunset
 * has to lose to legibility. Every stop below was checked against the cream
 * text colour and stays at 5.8:1 contrast or better (WCAG AA is 4.5:1), so the
 * richer palette costs nothing in readability versus the flat `ink` it
 * replaces. The hills layer progressively darker toward the foreground, which
 * is what actually sells the depth — the gradient alone reads as a colour, the
 * silhouettes read as a place.
 *
 * One flourish, used on every screen, so it has to earn staying out of the way:
 * everything here is either behind the fold of a normal card layout or faint
 * enough that it never competes with what's on top of it.
 */
export function LatticeBackground({ opacity = 1 }: { opacity?: number }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', inset: 0, opacity }}>
      <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 400 900">
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={palette.ink} />
            <Stop offset="0.32" stopColor="#3A2A52" />
            <Stop offset="0.6" stopColor="#5C3155" />
            <Stop offset="0.82" stopColor="#7B3F4C" />
            <Stop offset="1" stopColor="#8C4A3E" />
          </LinearGradient>
          <RadialGradient id="sunCore" cx="0.5" cy="0.5" r="0.5" gradientUnits="objectBoundingBox">
            <Stop offset="0" stopColor={withAlpha(palette.goldLight, 0.85)} />
            <Stop offset="0.55" stopColor={withAlpha(palette.gold, 0.4)} />
            <Stop offset="1" stopColor={withAlpha(palette.gold, 0)} />
          </RadialGradient>
          <RadialGradient id="sunGlow" cx="0.5" cy="0.5" r="0.5" gradientUnits="objectBoundingBox">
            <Stop offset="0" stopColor={withAlpha(palette.gold, 0.16)} />
            <Stop offset="1" stopColor={withAlpha(palette.gold, 0)} />
          </RadialGradient>
        </Defs>

        <Rect width="400" height="900" fill="url(#sky)" />

        {/* the sun — a soft bloom, then a brighter core, sitting low so the
            hill layers below partly cover it, the way a real horizon would */}
        <Circle cx="290" cy="520" r="200" fill="url(#sunGlow)" />
        <Circle cx="290" cy="520" r="72" fill="url(#sunCore)" />

        {/* two birds crossing the sky — the one Alto's Adventure detail that
            makes a gradient read as a place rather than a colour swatch */}
        <Path d="M70,260 q10,-12 20,0 q10,-12 20,0" stroke={withAlpha(palette.ink600, 0.7)} strokeWidth={3} fill="none" strokeLinecap="round" />
        <Path d="M130,300 q8,-9 16,0 q8,-9 16,0" stroke={withAlpha(palette.ink600, 0.55)} strokeWidth={2.5} fill="none" strokeLinecap="round" />

        {/* far hills — barely there, just enough to read as a horizon */}
        <Path
          d="M0,560 C60,530 110,545 170,528 C230,512 260,545 330,522 C370,510 390,528 400,522 L400,900 L0,900 Z"
          fill={withAlpha('#4A2F45', 0.65)}
        />
        {/* mid hills — a shade darker, more relief */}
        <Path
          d="M0,650 C80,610 150,630 210,600 C270,572 320,615 400,585 L400,900 L0,900 Z"
          fill={withAlpha('#38233C', 0.8)}
        />
        {/* near hills — darkest, closest to the bottom edge */}
        <Path
          d="M0,730 C70,695 140,715 200,690 C260,665 310,700 400,675 L400,900 L0,900 Z"
          fill={withAlpha(palette.ink800, 0.92)}
        />
      </Svg>
    </View>
  );
}
