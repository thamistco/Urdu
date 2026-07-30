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

/**
 * The scenery behind every screen: a misty forest at dusk with the sun barely
 * showing through.
 *
 * It began as a sunset — a bright disc low over bare green hills. That read as
 * a *sunset*, which is a colour, rather than as a *place*. What was asked for,
 * and what this is now, is forest: ridges carrying tree lines, fog lying in the
 * valleys between them, layered cloud across the sky, and the sun reduced to a
 * warm bloom behind the weather rather than a lamp hanging in the middle of the
 * picture. Mist is the subject; the sun is the hint that gives it a direction.
 *
 * There used to be a second `forest` scene selectable by a prop. Nothing ever
 * selected it — every screen took the default — so it was two hundred lines
 * nobody had seen. Its ideas are the ones worth keeping, so they are here, in
 * the one scene that actually renders, and the dead branch is gone.
 *
 * References: Alto's Adventure, Monument Valley, Journey — muted earth and
 * green, nothing saturated or synthetic. Deliberately no purple: the first
 * version shaded through plum and wine-rose and read as the generic "twilight"
 * gradient every image generator reaches for by default.
 *
 * Kept dark by design, not literal daylight brightness: this sits behind body
 * text on every screen — lessons, cards, whole paragraphs — and the scenery has
 * to lose to legibility. Every stop was checked against the cream text colour
 * and stays at 6:1 contrast or better (WCAG AA is 4.5:1). The layers darken
 * toward the foreground, which is what actually sells the depth — a gradient
 * alone reads as a colour; silhouettes read as a place.
 *
 * One rule holds the whole thing together: **nothing in the air has a hard
 * edge.** Cloud, fog, bloom and mote are radial gradients that reach zero alpha
 * at their rim, never flat-alpha shapes. A flat shape shows its own outline
 * against a gradient no matter how low the alpha, and two overlapping double up
 * into a visible seam — which is exactly what made an early pass at the clouds
 * read as a row of grey discs. Only the ground silhouettes get a hard edge,
 * because ground is the one thing here that genuinely has one.
 */
export function LatticeBackground({ opacity = 1 }: { opacity?: number }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', inset: 0, opacity }}>
      <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 400 900">
        <Defs>
          {/* Cool and green up top, warming only near the horizon. The old ramp
              went orange most of the way down, which is what made it read as a
              sunset rather than as weather over a forest. */}
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={palette.mossDeep} />
            <Stop offset="0.34" stopColor={palette.mossCharcoal} />
            <Stop offset="0.62" stopColor={palette.skyDusk} />
            <Stop offset="0.84" stopColor={palette.skyEmber} />
            <Stop offset="1" stopColor={palette.skyGlow} />
          </LinearGradient>

          {/* The sun, as a hint: no hard core any more, just a warm swelling in
              the cloud where it sits. A visible disc made itself the subject. */}
          <RadialGradient id="sunBloom" cx="0.5" cy="0.5" r="0.5" gradientUnits="objectBoundingBox">
            <Stop offset="0" stopColor={withAlpha(palette.goldLight, 0.28)} />
            <Stop offset="0.4" stopColor={withAlpha(palette.gold, 0.13)} />
            <Stop offset="1" stopColor={withAlpha(palette.gold, 0)} />
          </RadialGradient>
          <RadialGradient id="horizonSpread" cx="0.5" cy="0.5" r="0.5" gradientUnits="objectBoundingBox">
            <Stop offset="0" stopColor={withAlpha(palette.gold, 0.07)} />
            <Stop offset="1" stopColor={withAlpha(palette.gold, 0)} />
          </RadialGradient>

          {/* Fog. Cool and pale, and the thing there is most of in this picture:
              it lies in the valleys, drifts across the tree lines, and is what
              turns three silhouettes into distance. */}
          <RadialGradient id="fog" cx="0.5" cy="0.5" r="0.5" gradientUnits="objectBoundingBox">
            <Stop offset="0" stopColor={withAlpha(palette.mossLight, 0.2)} />
            <Stop offset="0.55" stopColor={withAlpha(palette.mossLight, 0.09)} />
            <Stop offset="1" stopColor={withAlpha(palette.mossLight, 0)} />
          </RadialGradient>
          <RadialGradient id="fogWarm" cx="0.5" cy="0.5" r="0.5" gradientUnits="objectBoundingBox">
            <Stop offset="0" stopColor={withAlpha(palette.paperSoft, 0.16)} />
            <Stop offset="1" stopColor={withAlpha(palette.paperSoft, 0)} />
          </RadialGradient>

          {/* Cloud bodies, feathered to nothing at the rim — a flat-alpha shape
              shows its own outline over a gradient however low the alpha, and
              two overlapping double into a seam. That is what made an early
              pass at these read as a row of grey discs. */}
          <RadialGradient id="cloudWarm" cx="0.5" cy="0.5" r="0.5" gradientUnits="objectBoundingBox">
            <Stop offset="0" stopColor={withAlpha(palette.goldLight, 0.3)} />
            <Stop offset="0.45" stopColor={withAlpha(palette.goldLight, 0.16)} />
            <Stop offset="1" stopColor={withAlpha(palette.goldLight, 0)} />
          </RadialGradient>
          <RadialGradient id="cloudPale" cx="0.5" cy="0.5" r="0.5" gradientUnits="objectBoundingBox">
            <Stop offset="0" stopColor={withAlpha(palette.paperSoft, 0.3)} />
            <Stop offset="0.45" stopColor={withAlpha(palette.paperSoft, 0.15)} />
            <Stop offset="1" stopColor={withAlpha(palette.paperSoft, 0)} />
          </RadialGradient>
          <RadialGradient id="cloudCool" cx="0.5" cy="0.5" r="0.5" gradientUnits="objectBoundingBox">
            <Stop offset="0" stopColor={withAlpha(palette.mossLight, 0.22)} />
            <Stop offset="0.5" stopColor={withAlpha(palette.mossLight, 0.1)} />
            <Stop offset="1" stopColor={withAlpha(palette.mossLight, 0)} />
          </RadialGradient>
          {/* The brighter, tighter edge where a cloud faces the light. Without
              it a cloud is a uniform smear; with it, it has a lit side.
              Kept quiet on purpose: three warm layers stack here — two cloud
              bodies and this — and at their first values the pile-up measured
              4.47:1 against the cream body text, under even the WCAG AA floor,
              while the comment at the top of this file claimed 6:1. See
              `npm run check:scenery`, which measures it rather than trusting
              anyone's estimate of what a stack of alphas comes to. */}
          <RadialGradient id="cloudCrown" cx="0.5" cy="0.5" r="0.5" gradientUnits="objectBoundingBox">
            <Stop offset="0" stopColor={withAlpha(palette.paperSoft, 0.24)} />
            <Stop offset="1" stopColor={withAlpha(palette.paperSoft, 0)} />
          </RadialGradient>

          {/* Aerial perspective: air is not clear, so each further ridge is
              veiled a little more than the one in front. This is what reads as
              depth — without it the layers are flat paper cut-outs stacked up. */}
          <RadialGradient id="ridgeHaze" cx="0.5" cy="0.5" r="0.5" gradientUnits="objectBoundingBox">
            <Stop offset="0" stopColor={withAlpha(palette.mossLight, 0.13)} />
            <Stop offset="0.6" stopColor={withAlpha(palette.mossLight, 0.05)} />
            <Stop offset="1" stopColor={withAlpha(palette.mossLight, 0)} />
          </RadialGradient>
        </Defs>

        <>
          <Rect width="400" height="900" fill="url(#sky)" />

          {/* The sun, low and to the right, showing only as a warm swelling in
              the weather. Cloud crosses it below, so it is never a clean disc. */}
          <Ellipse cx="286" cy="548" rx="300" ry="70" fill="url(#horizonSpread)" />
          <Circle cx="286" cy="524" r="168" fill="url(#sunBloom)" />

          {/* High cloud: cool and pale, drifting across the upper sky. Sparse
              enough to leave air between the banks. */}
          <G opacity={0.4}>
            <Ellipse cx="128" cy="196" rx="104" ry="13" fill="url(#cloudCool)" />
            <Ellipse cx="152" cy="189" rx="56" ry="8" fill="url(#cloudCool)" />
          </G>
          <G opacity={0.3}>
            <Ellipse cx="300" cy="268" rx="86" ry="10" fill="url(#cloudPale)" />
            <Ellipse cx="318" cy="262" rx="42" ry="6" fill="url(#cloudPale)" />
          </G>
          <G opacity={0.34}>
            <Ellipse cx="86" cy="330" rx="92" ry="11" fill="url(#cloudCool)" />
            <Ellipse cx="108" cy="324" rx="46" ry="7" fill="url(#cloudPale)" />
          </G>

          {/* two birds crossing — the one detail that makes a gradient read as
              a place rather than a colour swatch */}
          <Path d="M70,258 q10,-12 20,0 q10,-12 20,0" stroke={withAlpha(palette.ink600, 0.7)} strokeWidth={3} fill="none" strokeLinecap="round" />
          <Path d="M132,296 q8,-9 16,0 q8,-9 16,0" stroke={withAlpha(palette.ink600, 0.55)} strokeWidth={2.5} fill="none" strokeLinecap="round" />

          {/* Low cloud, warm because it is near the sun, and lying across it —
              the sun reads as *behind* the weather rather than in front. */}
          <G opacity={0.44}>
            <Ellipse cx="292" cy="446" rx="106" ry="12" fill="url(#cloudWarm)" />
            <Ellipse cx="316" cy="439" rx="54" ry="8" fill="url(#cloudWarm)" />
            <Ellipse cx="322" cy="435" rx="34" ry="4.5" fill="url(#cloudCrown)" />
          </G>
          <G opacity={0.34}>
            <Ellipse cx="112" cy="480" rx="84" ry="10" fill="url(#cloudWarm)" />
            <Ellipse cx="136" cy="474" rx="40" ry="6.5" fill="url(#cloudWarm)" />
            <Ellipse cx="144" cy="471" rx="24" ry="3.5" fill="url(#cloudCrown)" />
          </G>

          {/* ---- the land, in three layers, each with its own tree line ---- */}

          {/* far ridge: palest, barely separated from the sky */}
          <Path
            d="M0,566 C60,538 110,552 170,534 C230,518 260,550 330,528 C370,516 390,534 400,528 L400,900 L0,900 Z"
            fill={withAlpha(palette.mossDark, 0.5)}
          />
          <Path d={treeline(560, 26, 22, 1)} fill={withAlpha(palette.mossDark, 0.42)} />
          {/* Fog pooling in front of the far ridge — distance reads as haze,
              not as a paler shade of the same flat green.
              One layer, not two. There were a haze and a fog ellipse here,
              overlapping across most of their width, and two soft shapes at
              alpha ~0.16 compose to ~0.28 rather than ~0.16 — the exact trap
              the note at the top of this file warns about, walked into three
              paragraphs below writing it. It made this the brightest place in
              the whole scene, 5.5:1 behind body text, and the fix was never a
              dimmer fog; it was one fog. */}
          <Ellipse cx="200" cy="578" rx="320" ry="48" fill="url(#ridgeHaze)" />

          {/* mid ridge */}
          <Path
            d="M0,660 C80,620 150,640 210,610 C270,582 320,626 400,596 L400,900 L0,900 Z"
            fill={withAlpha(palette.mossDeep, 0.78)}
          />
          <Path d={treeline(652, 34, 17, 7)} fill={withAlpha(palette.mossDeep, 0.72)} />
          {/* the valley between the ridges, full of it */}
          <Ellipse cx="230" cy="668" rx="300" ry="40" fill="url(#fog)" />
          <Ellipse cx="96" cy="676" rx="200" ry="28" fill="url(#fogWarm)" />

          {/* near ridge: darkest, closest, its trees the only ones with any
              individual shape */}
          <Path
            d="M0,742 C70,706 140,726 200,700 C260,676 310,712 400,686 L400,900 L0,900 Z"
            fill={withAlpha(palette.mossDeep, 0.97)}
          />
          <Path d={treeline(738, 44, 13, 13)} fill={palette.ink} opacity={0.72} />
          {/* a last thin band of fog caught at the foot of the near trees */}
          <Ellipse cx="180" cy="760" rx="280" ry="22" fill="url(#fog)" opacity={0.7} />

          {/* Motes drifting in the last of the light.
              These were flat opaque dots and read as confetti thrown on the
              hill; softening them stopped that, but four of them spread across
              the bare dark foreground still read as dust on the lens, because
              there was nothing down there for light to catch on. So they moved
              up into the fog, where mist is the reason they are visible at all,
              and there are two rather than four — a mote is a detail, and four
              identical details in a row is a pattern. */}
          <G opacity={0.45}>
            <Circle cx="96" cy="700" r="7" fill="url(#fogWarm)" />
            <Circle cx="252" cy="686" r="5" fill="url(#fogWarm)" />
          </G>
        </>
      </Svg>
    </View>
  );
}
