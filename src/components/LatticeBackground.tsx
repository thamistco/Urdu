import { View } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Path, Circle, Ellipse, G, Rect } from 'react-native-svg';
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
 *
 * One rule holds the whole thing together: **nothing in the air has a hard
 * edge.** Cloud, haze, bloom and mote are all radial gradients that reach zero
 * alpha at their rim, never flat-alpha shapes. A flat shape shows its own
 * outline against a gradient no matter how low you push the alpha, and two of
 * them overlapping double up into a visible seam — which is precisely what
 * made an earlier pass at the clouds read as a row of grey discs. Only the
 * ground silhouettes are allowed a hard edge, because ground is the one thing
 * here that genuinely has one.
 */
export function LatticeBackground({ opacity = 1, scene = 'sunset' }: { opacity?: number; scene?: Scene }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', inset: 0, opacity }}>
      <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 400 900">
        {scene === 'sunset' ? (
          <Defs>
            <LinearGradient id="skySunset" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={palette.ink} />
              <Stop offset="0.3" stopColor={palette.skyDusk} />
              <Stop offset="0.6" stopColor={palette.skyEmber} />
              <Stop offset="0.82" stopColor={palette.skyGlow} />
              <Stop offset="1" stopColor={palette.skyHorizon} />
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
            {/* Cloud bodies. Feathered to fully transparent at the rim, because
                a flat-alpha shape over a gradient shows its outline no matter
                how low the alpha is — which is what made the first attempt at
                these read as a row of grey discs rather than cloud. */}
            <RadialGradient id="cloudWarm" cx="0.5" cy="0.5" r="0.5" gradientUnits="objectBoundingBox">
              <Stop offset="0" stopColor={withAlpha(palette.goldLight, 0.5)} />
              <Stop offset="0.45" stopColor={withAlpha(palette.goldLight, 0.28)} />
              <Stop offset="1" stopColor={withAlpha(palette.goldLight, 0)} />
            </RadialGradient>
            <RadialGradient id="cloudPale" cx="0.5" cy="0.5" r="0.5" gradientUnits="objectBoundingBox">
              <Stop offset="0" stopColor={withAlpha(palette.paperSoft, 0.34)} />
              <Stop offset="0.45" stopColor={withAlpha(palette.paperSoft, 0.18)} />
              <Stop offset="1" stopColor={withAlpha(palette.paperSoft, 0)} />
            </RadialGradient>
            {/* The brighter, tighter edge of a cloud where it faces the sun. */}
            <RadialGradient id="cloudCrown" cx="0.5" cy="0.5" r="0.5" gradientUnits="objectBoundingBox">
              <Stop offset="0" stopColor={withAlpha(palette.paperSoft, 0.42)} />
              <Stop offset="1" stopColor={withAlpha(palette.paperSoft, 0)} />
            </RadialGradient>
            {/* Aerial perspective: air itself is not clear, so each further
                ridge is veiled a little more than the one in front of it. This
                is what reads as distance — without it the layers look like flat
                paper cut-outs stacked on each other. */}
            <RadialGradient id="ridgeHaze" cx="0.5" cy="0.5" r="0.5" gradientUnits="objectBoundingBox">
              <Stop offset="0" stopColor={withAlpha(palette.gold, 0.1)} />
              <Stop offset="0.6" stopColor={withAlpha(palette.gold, 0.04)} />
              <Stop offset="1" stopColor={withAlpha(palette.gold, 0)} />
            </RadialGradient>
            {/* The sun's light scattering sideways along the horizon line. */}
            <RadialGradient id="horizonSpread" cx="0.5" cy="0.5" r="0.5" gradientUnits="objectBoundingBox">
              <Stop offset="0" stopColor={withAlpha(palette.gold, 0.085)} />
              <Stop offset="1" stopColor={withAlpha(palette.gold, 0)} />
            </RadialGradient>
          </Defs>
        ) : (
          <Defs>
            <LinearGradient id="skyForest" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={palette.mossDeep} />
              <Stop offset="0.4" stopColor={palette.mossCharcoal} />
              <Stop offset="0.72" stopColor={palette.mossDark} />
              <Stop offset="1" stopColor={palette.mossNear} />
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

            {/* the sun — light spreading along the horizon, then a soft bloom,
                then a brighter core, sitting low so the hill layers below partly
                cover it, the way a real horizon would */}
            <Ellipse cx="290" cy="532" rx="300" ry="76" fill="url(#horizonSpread)" />
            <Circle cx="290" cy="520" r="200" fill="url(#sunGlow)" />
            <Circle cx="290" cy="520" r="72" fill="url(#sunCore)" />

            {/* Clouds: long, low, horizontal — the shape sunset cloud actually
                takes, rather than the round puffs of a midday sky. Each is a
                few soft ellipses under one group opacity, so the bank has some
                internal relief without any overlap hardening into a seam. The
                nearer the sun, the warmer the light they catch. */}
            <G opacity={0.62}>
              <Ellipse cx="296" cy="437" rx="94" ry="11" fill="url(#cloudWarm)" />
              <Ellipse cx="318" cy="431" rx="50" ry="8" fill="url(#cloudWarm)" />
              {/* the lit crown: the sun is below and to the right, so the top
                  of the bank facing it is brighter and tighter than the body.
                  Without this a cloud is a uniform smear; with it, it has a
                  side that faces the light. */}
              <Ellipse cx="322" cy="428" rx="34" ry="4.5" fill="url(#cloudCrown)" />
            </G>
            <G opacity={0.42}>
              <Ellipse cx="116" cy="470" rx="76" ry="9" fill="url(#cloudWarm)" />
              <Ellipse cx="138" cy="465" rx="38" ry="6.5" fill="url(#cloudWarm)" />
              <Ellipse cx="146" cy="462" rx="24" ry="3.5" fill="url(#cloudCrown)" />
            </G>
            <G opacity={0.22}>
              <Ellipse cx="196" cy="368" rx="68" ry="8" fill="url(#cloudPale)" />
              <Ellipse cx="212" cy="364" rx="30" ry="4" fill="url(#cloudPale)" />
            </G>

            {/* two birds crossing the sky — the one Alto's Adventure detail
                that makes a gradient read as a place, not a colour swatch */}
            <Path d="M70,260 q10,-12 20,0 q10,-12 20,0" stroke={withAlpha(palette.ink600, 0.7)} strokeWidth={3} fill="none" strokeLinecap="round" />
            <Path d="M130,300 q8,-9 16,0 q8,-9 16,0" stroke={withAlpha(palette.ink600, 0.55)} strokeWidth={2.5} fill="none" strokeLinecap="round" />

            {/* far hills — soft green, barely there, just enough to read as a horizon */}
            <Path
              d="M0,560 C60,530 110,545 170,528 C230,512 260,545 330,522 C370,510 390,528 400,522 L400,900 L0,900 Z"
              fill={withAlpha(palette.mossDark, 0.55)}
            />
            {/* warm air pooling along the far ridge, in front of it — distance
                reads as haze, not as a paler shade of the same flat green */}
            <Ellipse cx="210" cy="556" rx="290" ry="42" fill="url(#ridgeHaze)" />

            {/* a low mist bank settled into the fold between the hills */}
            <Circle cx="150" cy="645" r="220" fill="url(#hillMist)" />
            <Circle cx="300" cy="665" r="180" fill="url(#hillMist)" />

            {/* mid hills — deeper green, more relief */}
            <Path
              d="M0,650 C80,610 150,630 210,600 C270,572 320,615 400,585 L400,900 L0,900 Z"
              fill={withAlpha(palette.mossDeep, 0.82)}
            />
            {/* the same veil again over the mid ridge, weaker — each layer is
                a little clearer than the one behind it */}
            <Ellipse cx="200" cy="636" rx="300" ry="34" fill="url(#ridgeHaze)" opacity={0.7} />

            {/* near hills — darkest, closest to the bottom edge */}
            <Path
              d="M0,730 C70,695 140,715 200,690 C260,665 310,700 400,675 L400,900 L0,900 Z"
              fill={withAlpha(palette.mossDeep, 0.97)}
            />

            {/* Motes of pollen drifting in the last of the light. These were
                flat opaque dots and read as confetti scattered on the hill;
                soft-edged and dim, they sit in the air instead of on top of
                the picture. */}
            <G opacity={0.55}>
              <Circle cx="58" cy="806" r="9" fill="url(#cloudWarm)" />
              <Circle cx="150" cy="848" r="7" fill="url(#cloudWarm)" />
              <Circle cx="268" cy="820" r="8" fill="url(#cloudWarm)" />
              <Circle cx="342" cy="862" r="6" fill="url(#cloudWarm)" />
            </G>
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
