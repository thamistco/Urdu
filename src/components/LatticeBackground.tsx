import { View } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Path, Circle, Rect } from 'react-native-svg';
import { palette, withAlpha } from '../theme';

/**
 * A jagged tree-line silhouette, built rather than hand-drawn: alternating
 * peaks and troughs across the width, so the forest scene doesn't need one
 * enormous hand-authored path per layer. `seed` staggers each layer so three
 * of them stacked don't repeat the same rhythm.
 */
function treeline(baseY: number, amp: number, teeth: number, seed: number): string {
  const w = 400;
  const step = w / teeth;
  let d = `M0,${baseY + amp}`;
  for (let i = 0; i <= teeth; i++) {
    const x = i * step;
    const jitter = ((Math.sin(i * 12.9898 + seed) * 43758.5453) % 1) * amp * 0.6;
    const peakY = baseY - amp * 0.5 + jitter;
    d += ` L${(x - step / 2).toFixed(1)},${peakY.toFixed(1)} L${x.toFixed(1)},${(baseY + amp * 0.3).toFixed(1)}`;
  }
  return `${d} L${w},900 L0,900 Z`;
}

type Scene = 'sunset' | 'forest';

/**
 * The scenery behind a screen — two scenes sharing one composition (sky
 * gradient → glow → three parallax layers), so a section can change place
 * without the app changing identity.
 *
 * `sunset` (the default, used almost everywhere): a dusk sky sliding from warm
 * espresso through oxblood to burnt orange, a glowing sun low on the horizon
 * partly hidden behind rolling green hills, soft mist settled in their folds,
 * a couple of clouds catching the last light, two birds crossing it. The
 * hills moved from an earlier brown-toned ramp to the same moss green as the
 * `forest` scene below — calmer and closer to an actual dusk landscape than
 * bare silhouette, and it ties the two scenes together as one place rather
 * than two unrelated ones. References: Alto's Adventure, Monument Valley,
 * Journey, and the quiet rolling-hills-at-dusk mood of a well-made wellness
 * site — muted earth and green rather than anything saturated or synthetic.
 *
 * `forest` (used for Practice — a deliberate change of place, not of mood): a
 * misty tree line at dusk, built from a real "into the woods" reference
 * palette (moss, pine, fog), with the same warm gold light now filtering
 * through the canopy instead of sitting on a horizon. The orange stays,
 * because the sunset is still the one thing every scene in this app has —
 * this is scenery variety within that, not a second theme.
 *
 * Deliberately no purple anywhere in either ramp — the first sunset version
 * shaded through plum and wine-rose, and read as the generic "twilight"
 * gradient every AI image generator reaches for by default.
 *
 * Kept dark by design, not literal daylight brightness: this sits behind body
 * text on every screen — lessons, cards, whole paragraphs — and the scenery
 * has to lose to legibility. Every stop in both ramps was checked against the
 * cream text colour and stays at 6:1 contrast or better (WCAG AA is 4.5:1).
 * The layers get progressively darker toward the foreground, which is what
 * actually sells the depth — the gradient alone reads as a colour, the
 * silhouettes read as a place.
 */
export function LatticeBackground({ opacity = 1, scene = 'sunset' }: { opacity?: number; scene?: Scene }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', inset: 0, opacity }}>
      <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 400 900">
        {scene === 'sunset' ? (
          <Defs>
            <LinearGradient id="skySunset" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={palette.ink} />
              <Stop offset="0.3" stopColor="#3A2416" />
              <Stop offset="0.6" stopColor="#5C2F1C" />
              <Stop offset="0.82" stopColor="#7A3D1E" />
              <Stop offset="1" stopColor="#8A4420" />
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
            <RadialGradient id="hillMist" cx="0.5" cy="0.5" r="0.5" gradientUnits="objectBoundingBox">
              <Stop offset="0" stopColor={withAlpha(palette.mossLight, 0.16)} />
              <Stop offset="1" stopColor={withAlpha(palette.mossLight, 0)} />
            </RadialGradient>
          </Defs>
        ) : (
          <Defs>
            <LinearGradient id="skyForest" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={palette.mossDeep} />
              <Stop offset="0.4" stopColor={palette.mossCharcoal} />
              <Stop offset="0.72" stopColor={palette.mossDark} />
              <Stop offset="1" stopColor="#5A5C3E" />
            </LinearGradient>
            <RadialGradient id="canopyGlow" cx="0.5" cy="0.5" r="0.5" gradientUnits="objectBoundingBox">
              <Stop offset="0" stopColor={withAlpha(palette.gold, 0.28)} />
              <Stop offset="0.5" stopColor={withAlpha(palette.gold, 0.1)} />
              <Stop offset="1" stopColor={withAlpha(palette.gold, 0)} />
            </RadialGradient>
            <RadialGradient id="mist" cx="0.5" cy="0.5" r="0.5" gradientUnits="objectBoundingBox">
              <Stop offset="0" stopColor={withAlpha(palette.mossLight, 0.18)} />
              <Stop offset="1" stopColor={withAlpha(palette.mossLight, 0)} />
            </RadialGradient>
          </Defs>
        )}

        {scene === 'sunset' ? (
          <>
            <Rect width="400" height="900" fill="url(#skySunset)" />

            {/* the sun — a soft bloom, then a brighter core, sitting low so the
                hill layers below partly cover it, the way a real horizon would */}
            <Circle cx="290" cy="520" r="200" fill="url(#sunGlow)" />
            <Circle cx="290" cy="520" r="72" fill="url(#sunCore)" />

            {/* a couple of clouds catching the glow, drifting ahead of the hills —
                built from overlapping circles rather than a filter, so this stays
                cheap and identical across web and native */}
            <Circle cx="120" cy="368" r="26" fill={withAlpha(palette.goldLight, 0.14)} />
            <Circle cx="150" cy="378" r="34" fill={withAlpha(palette.goldLight, 0.12)} />
            <Circle cx="92" cy="384" r="20" fill={withAlpha(palette.goldLight, 0.12)} />
            <Circle cx="326" cy="412" r="20" fill={withAlpha(palette.paperSoft, 0.12)} />
            <Circle cx="350" cy="422" r="27" fill={withAlpha(palette.paperSoft, 0.1)} />

            {/* two birds crossing the sky — the one Alto's Adventure detail
                that makes a gradient read as a place, not a colour swatch */}
            <Path d="M70,260 q10,-12 20,0 q10,-12 20,0" stroke={withAlpha(palette.ink600, 0.7)} strokeWidth={3} fill="none" strokeLinecap="round" />
            <Path d="M130,300 q8,-9 16,0 q8,-9 16,0" stroke={withAlpha(palette.ink600, 0.55)} strokeWidth={2.5} fill="none" strokeLinecap="round" />

            {/* far hills — soft green, barely there, just enough to read as a horizon */}
            <Path
              d="M0,560 C60,530 110,545 170,528 C230,512 260,545 330,522 C370,510 390,528 400,522 L400,900 L0,900 Z"
              fill={withAlpha(palette.mossDark, 0.55)}
            />

            {/* a low mist bank settled into the fold between the hills */}
            <Circle cx="150" cy="645" r="220" fill="url(#hillMist)" />
            <Circle cx="300" cy="665" r="180" fill="url(#hillMist)" />

            {/* mid hills — deeper green, more relief */}
            <Path
              d="M0,650 C80,610 150,630 210,600 C270,572 320,615 400,585 L400,900 L0,900 Z"
              fill={withAlpha(palette.mossDeep, 0.82)}
            />
            {/* near hills — darkest, closest to the bottom edge */}
            <Path
              d="M0,730 C70,695 140,715 200,690 C260,665 310,700 400,675 L400,900 L0,900 Z"
              fill={withAlpha(palette.mossDeep, 0.97)}
            />

            {/* a scatter of wildflowers at the meadow's edge */}
            <Circle cx="55" cy="862" r="4" fill={withAlpha(palette.goldLight, 0.5)} />
            <Circle cx="92" cy="880" r="3" fill={withAlpha(palette.paper, 0.4)} />
            <Circle cx="225" cy="866" r="3.5" fill={withAlpha(palette.roseLight, 0.4)} />
            <Circle cx="266" cy="884" r="3" fill={withAlpha(palette.goldLight, 0.45)} />
            <Circle cx="338" cy="868" r="4" fill={withAlpha(palette.paper, 0.35)} />
          </>
        ) : (
          <>
            <Rect width="400" height="900" fill="url(#skyForest)" />

            {/* light breaking through the canopy — low and warm, the same
                gold as the sunset scene, so the two scenes still feel related */}
            <Circle cx="230" cy="470" r="230" fill="url(#canopyGlow)" />

            {/* a drifting mist bank, low over the clearing */}
            <Circle cx="180" cy="700" r="260" fill="url(#mist)" />
            <Circle cx="300" cy="740" r="200" fill="url(#mist)" />

            {/* far tree line — palest, furthest back */}
            <Path d={treeline(560, 60, 14, 1)} fill={withAlpha(palette.mossDark, 0.45)} />
            {/* mid tree line — taller, denser */}
            <Path d={treeline(660, 90, 11, 7)} fill={withAlpha(palette.mossDark, 0.75)} />
            {/* near tree line — darkest, closest to the bottom edge */}
            <Path d={treeline(760, 110, 9, 13)} fill={withAlpha(palette.mossDeep, 0.95)} />

            {/* a couple of fireflies over the clearing — the forest's answer
                to the sunset scene's birds */}
            <Circle cx="150" cy="640" r="3" fill={withAlpha(palette.goldLight, 0.8)} />
            <Circle cx="240" cy="600" r="2.2" fill={withAlpha(palette.goldLight, 0.6)} />
          </>
        )}
      </Svg>
    </View>
  );
}
