import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Path, Circle, Rect } from 'react-native-svg';
import { palette, withAlpha } from '../theme';
import { currentTimeOfDay, type TimeOfDay } from '../lib/timeOfDay';

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
 * One sky per time of day, sharing a single composition: gradient → glow
 * orb → mist → parallax tree line. Blue is orange's complement, so the same
 * gold accent that already carries every button, streak and reward in this
 * app keeps reading as the warmest thing on screen no matter which sky is
 * behind it — dawn and dusk keep it as the sun itself, day keeps it high and
 * bright, night turns it into a pale, cooler moon.
 *
 * Every stop below was checked against the cream text colour (`palette.paper`)
 * and stays at 4.5:1 contrast or better (WCAG AA) — the sky sits behind body
 * text on every screen, so it has to lose to legibility at every hour.
 *
 * Deliberately no purple anywhere in any ramp — an earlier version of this
 * background shaded through plum and wine-rose on the way from blue to
 * orange, and it read as exactly the generic "twilight synthwave" gradient
 * every AI image generator reaches for by default. These go blue-grey-brown
 * to orange instead, the way an actual sky does.
 */
type SkyConfig = {
  stops: [number, string][];
  orb: { cx: number; cy: number; coreR: number; glowR: number; gradient: 'sun' | 'moon' };
  stars: boolean;
};

const SKIES: Record<TimeOfDay, SkyConfig> = {
  night: {
    stops: [
      [0, '#0A0E1A'],
      [0.4, '#101B30'],
      [0.7, '#152640'],
      [1, '#1B3350'],
    ],
    orb: { cx: 300, cy: 260, coreR: 46, glowR: 150, gradient: 'moon' },
    stars: true,
  },
  dawn: {
    stops: [
      [0, '#141C2E'],
      [0.35, '#2A3A4E'],
      [0.68, '#5C4630'],
      [1, '#9C5A2E'],
    ],
    orb: { cx: 290, cy: 610, coreR: 60, glowR: 190, gradient: 'sun' },
    stars: false,
  },
  day: {
    stops: [
      [0, '#101826'],
      [0.35, '#173352'],
      [0.68, '#1F4E72'],
      [1, '#2A6688'],
    ],
    orb: { cx: 290, cy: 260, coreR: 68, glowR: 210, gradient: 'sun' },
    stars: false,
  },
  dusk: {
    stops: [
      [0, palette.ink],
      [0.3, '#3A2416'],
      [0.6, '#5C2F1C'],
      [0.82, '#7A3D1E'],
      [1, '#8A4420'],
    ],
    orb: { cx: 290, cy: 520, coreR: 72, glowR: 200, gradient: 'sun' },
    stars: false,
  },
};

type Scene = TimeOfDay | 'auto';

/**
 * The scenery behind a screen — a green abstract forest whose sky shifts
 * through dawn, day, dusk and night with the learner's own clock, rather
 * than one fixed painting. `scene="auto"` (the default) reads the time once
 * per mount; pass an explicit `TimeOfDay` to pin one sky (used by the
 * onboarding placement preview and visual QA).
 *
 * Kept dark by design at every hour, not literal daylight brightness: this
 * sits behind body text on every screen — lessons, cards, whole paragraphs —
 * and the scenery has to lose to legibility. The layers get progressively
 * darker toward the foreground, which is what actually sells the depth — the
 * gradient alone reads as a colour, the silhouettes read as a place.
 */
export function LatticeBackground({ opacity = 1, scene = 'auto' }: { opacity?: number; scene?: Scene }) {
  const timeOfDay = useMemo(() => (scene === 'auto' ? currentTimeOfDay() : scene), [scene]);
  const sky = SKIES[timeOfDay];
  const isNight = timeOfDay === 'night';

  return (
    <View pointerEvents="none" style={{ position: 'absolute', inset: 0, opacity }}>
      <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 400 900">
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            {sky.stops.map(([offset, color]) => (
              <Stop key={offset} offset={offset} stopColor={color} />
            ))}
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
          <RadialGradient id="moonCore" cx="0.5" cy="0.5" r="0.5" gradientUnits="objectBoundingBox">
            <Stop offset="0" stopColor={withAlpha(palette.paperSoft, 0.8)} />
            <Stop offset="0.6" stopColor={withAlpha(palette.paper, 0.3)} />
            <Stop offset="1" stopColor={withAlpha(palette.paper, 0)} />
          </RadialGradient>
          <RadialGradient id="moonGlow" cx="0.5" cy="0.5" r="0.5" gradientUnits="objectBoundingBox">
            <Stop offset="0" stopColor={withAlpha(palette.paper, 0.1)} />
            <Stop offset="1" stopColor={withAlpha(palette.paper, 0)} />
          </RadialGradient>
          <RadialGradient id="mist" cx="0.5" cy="0.5" r="0.5" gradientUnits="objectBoundingBox">
            <Stop offset="0" stopColor={withAlpha(palette.mossLight, 0.16)} />
            <Stop offset="1" stopColor={withAlpha(palette.mossLight, 0)} />
          </RadialGradient>
        </Defs>

        <Rect width="400" height="900" fill="url(#sky)" />

        {/* the glow — sun by dawn, day and dusk; a paler, cooler moon by night */}
        <Circle
          cx={sky.orb.cx}
          cy={sky.orb.cy}
          r={sky.orb.glowR}
          fill={sky.orb.gradient === 'sun' ? 'url(#sunGlow)' : 'url(#moonGlow)'}
        />
        <Circle
          cx={sky.orb.cx}
          cy={sky.orb.cy}
          r={sky.orb.coreR}
          fill={sky.orb.gradient === 'sun' ? 'url(#sunCore)' : 'url(#moonCore)'}
        />

        {/* a scatter of stars, night only */}
        {sky.stars && (
          <>
            <Circle cx="60" cy="140" r="1.6" fill={withAlpha(palette.paper, 0.7)} />
            <Circle cx="140" cy="90" r="1.2" fill={withAlpha(palette.paper, 0.5)} />
            <Circle cx="220" cy="160" r="1.4" fill={withAlpha(palette.paper, 0.6)} />
            <Circle cx="90" cy="220" r="1" fill={withAlpha(palette.paper, 0.45)} />
            <Circle cx="350" cy="120" r="1.5" fill={withAlpha(palette.paper, 0.65)} />
            <Circle cx="180" cy="60" r="1" fill={withAlpha(palette.paper, 0.4)} />
          </>
        )}

        {/* two birds crossing the sky by day; skipped at night, where nothing
            flies — the one Alto's Adventure detail that makes a gradient
            read as a place, not a colour swatch */}
        {!isNight && (
          <>
            <Path d="M70,190 q10,-12 20,0 q10,-12 20,0" stroke={withAlpha(palette.ink600, 0.6)} strokeWidth={3} fill="none" strokeLinecap="round" />
            <Path d="M130,230 q8,-9 16,0 q8,-9 16,0" stroke={withAlpha(palette.ink600, 0.45)} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          </>
        )}

        {/* a drifting mist bank, low over the clearing */}
        <Circle cx="180" cy="700" r="260" fill="url(#mist)" />
        <Circle cx="300" cy="740" r="200" fill="url(#mist)" />

        {/* far tree line — palest, furthest back */}
        <Path d={treeline(560, 60, 14, 1)} fill={withAlpha(palette.mossDark, 0.45)} />
        {/* mid tree line — taller, denser */}
        <Path d={treeline(660, 90, 11, 7)} fill={withAlpha(palette.mossDark, 0.75)} />
        {/* near tree line — darkest, closest to the bottom edge */}
        <Path d={treeline(760, 110, 9, 13)} fill={withAlpha(palette.mossDeep, 0.95)} />

        {/* fireflies over the clearing, warmest at dusk and night, when they'd
            actually be out */}
        {(timeOfDay === 'dusk' || isNight) && (
          <>
            <Circle cx="150" cy="640" r="3" fill={withAlpha(palette.goldLight, 0.8)} />
            <Circle cx="240" cy="600" r="2.2" fill={withAlpha(palette.goldLight, 0.6)} />
          </>
        )}
      </Svg>
    </View>
  );
}
