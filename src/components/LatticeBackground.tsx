import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Path,
  Circle,
  Rect,
  G,
  Filter,
  FeGaussianBlur,
} from 'react-native-svg';
import { palette, withAlpha } from '../theme';
import { currentHour, TIME_OF_DAY_HOUR, type TimeOfDay } from '../lib/timeOfDay';

/** Deterministic pseudo-random in [0, 1) — no `Math.random`, so the same
 *  seed always draws the same silhouette, on every render and every reload. */
function pseudoRandom(i: number, seed: number): number {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * A soft sunburst — thin, low-opacity wedges radiating from the orb, the way
 * light actually blooms in a hand-painted anime sky (the Makoto Shinkai
 * reference this pass leaned on). Kept faint and blurred rather than a crisp
 * graphic star burst: this sits behind reading text everywhere, so it has to
 * read as atmosphere, not decoration competing for attention.
 */
function sunburstRays(cx: number, cy: number, count: number, seed: number): string[] {
  const rays: string[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const halfWidth = 0.045 + pseudoRandom(i, seed + 2) * 0.03;
    const len = 220 + pseudoRandom(i, seed) * 140;
    const x1 = cx + Math.cos(angle - halfWidth) * len;
    const y1 = cy + Math.sin(angle - halfWidth) * len;
    const x2 = cx + Math.cos(angle + halfWidth) * len;
    const y2 = cy + Math.sin(angle + halfWidth) * len;
    rays.push(`M${cx.toFixed(1)},${cy.toFixed(1)} L${x1.toFixed(1)},${y1.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)} Z`);
  }
  return rays;
}

/**
 * A soft, rolling conifer ridge line, drawn with quadratic curves rather than
 * the straight zigzag this used to be. A real coastal forest — the Pacific
 * Northwest reference this was rebuilt from — reads from a distance as one
 * calm, rounded silhouette, not a jagged mountain range; the curve through
 * each peak is what actually sells "soft" rather than "spiky." `seed`
 * staggers each layer so three stacked don't repeat the same rhythm.
 */
function treeline(baseY: number, amp: number, teeth: number, seed: number): string {
  const w = 400;
  const step = w / teeth;
  let d = `M0,${(baseY + amp).toFixed(1)}`;
  let prevX = 0;
  for (let i = 1; i <= teeth; i++) {
    const x = i * step;
    const jitter = pseudoRandom(i, seed) * amp * 0.55;
    const peakY = baseY - amp * 0.42 + jitter;
    const midX = (prevX + x) / 2;
    d += ` Q${midX.toFixed(1)},${peakY.toFixed(1)} ${x.toFixed(1)},${(baseY + amp * 0.22).toFixed(1)}`;
    prevX = x;
  }
  return `${d} L${w},900 L0,900 Z`;
}

// ---- continuous sky interpolation --------------------------------------

function hexToRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}
function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
function lerpColor(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(lerp(ar, br, t), lerp(ag, bg, t), lerp(ab, bb, t));
}

const STOP_OFFSETS = [0, 0.35, 0.68, 1] as const;

type Keyframe = {
  hour: number;
  stops: readonly [string, string, string, string];
  orbCx: number;
  orbCy: number;
  orbCoreR: number;
  orbGlowR: number;
  moonMix: number; // 0 = sun, 1 = moon
  starOpacity: number;
  birdOpacity: number;
  fireflyOpacity: number;
};

/**
 * Four keyframes at regular sunrise/sunset hours (6am / 6pm) plus solar noon
 * and midnight, each carrying the same shape of data so every value between
 * them — colour, orb position and size, how visible the stars or birds are —
 * can be linearly blended. That blend is what makes the sky change steadily
 * through the day rather than snapping between a handful of looks: check the
 * app at 6:05am and 6:35am and the sky should have moved only a little.
 *
 * Blue is orange's complement, so day and night both go blue while dawn and
 * dusk carry the warm gold that is this app's one accent everywhere else —
 * the sun by day, dawn and dusk, a paler, cooler moon by night. Deliberately
 * no purple anywhere in any ramp — an earlier version of this background
 * shaded through plum and wine-rose on the way from blue to orange, and read
 * as exactly the generic "twilight synthwave" gradient every AI image
 * generator reaches for by default.
 */
const KEYFRAMES: Keyframe[] = [
  { hour: 0, stops: ['#0A0E1A', '#101B30', '#152640', '#1B3350'], orbCx: 300, orbCy: 260, orbCoreR: 46, orbGlowR: 150, moonMix: 1, starOpacity: 1, birdOpacity: 0, fireflyOpacity: 0.7 },
  { hour: 6, stops: ['#141C2E', '#2A3A4E', '#5C4630', '#9C5A2E'], orbCx: 290, orbCy: 610, orbCoreR: 60, orbGlowR: 190, moonMix: 0, starOpacity: 0, birdOpacity: 1, fireflyOpacity: 0 },
  { hour: 12, stops: ['#101826', '#173352', '#1F4E72', '#2A6688'], orbCx: 290, orbCy: 260, orbCoreR: 68, orbGlowR: 210, moonMix: 0, starOpacity: 0, birdOpacity: 1, fireflyOpacity: 0 },
  { hour: 18, stops: ['#211712', '#4A2A1B', '#7A3D1E', '#8A4420'], orbCx: 290, orbCy: 520, orbCoreR: 72, orbGlowR: 200, moonMix: 0, starOpacity: 0, birdOpacity: 1, fireflyOpacity: 0.6 },
  { hour: 24, stops: ['#0A0E1A', '#101B30', '#152640', '#1B3350'], orbCx: 300, orbCy: 260, orbCoreR: 46, orbGlowR: 150, moonMix: 1, starOpacity: 1, birdOpacity: 0, fireflyOpacity: 0.7 },
];

function skyAt(hour: number) {
  const h = ((hour % 24) + 24) % 24;
  let k0 = KEYFRAMES[0];
  let k1 = KEYFRAMES[KEYFRAMES.length - 1];
  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    if (h >= KEYFRAMES[i].hour && h <= KEYFRAMES[i + 1].hour) {
      k0 = KEYFRAMES[i];
      k1 = KEYFRAMES[i + 1];
      break;
    }
  }
  const t = k1.hour === k0.hour ? 0 : (h - k0.hour) / (k1.hour - k0.hour);
  return {
    stops: STOP_OFFSETS.map((offset, i) => [offset, lerpColor(k0.stops[i], k1.stops[i], t)] as const),
    orbCx: lerp(k0.orbCx, k1.orbCx, t),
    orbCy: lerp(k0.orbCy, k1.orbCy, t),
    orbCoreR: lerp(k0.orbCoreR, k1.orbCoreR, t),
    orbGlowR: lerp(k0.orbGlowR, k1.orbGlowR, t),
    moonMix: lerp(k0.moonMix, k1.moonMix, t),
    starOpacity: lerp(k0.starOpacity, k1.starOpacity, t),
    birdOpacity: lerp(k0.birdOpacity, k1.birdOpacity, t),
    fireflyOpacity: lerp(k0.fireflyOpacity, k1.fireflyOpacity, t),
  };
}

/**
 * A fluffy cumulus silhouette built from overlapping circles rather than one
 * ellipse — the classic stylised anime cloud shape (a row of soft bumps over
 * a flatter base) instead of a plain blurred blob.
 */
const CLOUD_BUMPS = [
  { dx: -0.9, dy: 0.15, r: 0.55 },
  { dx: -0.35, dy: -0.15, r: 0.7 },
  { dx: 0.25, dy: -0.05, r: 0.62 },
  { dx: 0.8, dy: 0.18, r: 0.5 },
  { dx: 0.1, dy: 0.25, r: 0.85 },
];
function CloudCluster({ cx, cy, scale = 1 }: { cx: number; cy: number; scale?: number }) {
  return (
    <G filter="url(#blurFar)">
      {CLOUD_BUMPS.map((b, i) => (
        <Circle key={i} cx={cx + b.dx * 90 * scale} cy={cy + b.dy * 60 * scale} r={b.r * 60 * scale} fill="url(#cloud)" />
      ))}
    </G>
  );
}

type Scene = 'auto' | TimeOfDay;

/**
 * The scenery behind a screen — a calm, painterly forest whose sky shifts
 * steadily through the day with the learner's own clock, rather than one
 * fixed painting or a handful of looks that jump between each other.
 * `scene="auto"` (the default) reads the time once per mount; pass an
 * explicit `TimeOfDay` to pin one sky (previews, screenshots, visual QA).
 *
 * The look leans soft and a little painterly on purpose — closer to a
 * hand-animated backdrop than a crisp vector illustration: distant tree
 * lines carry a gentle blur so the nearest layer reads as being in focus and
 * the rest recede, the way actual depth of field works, and every ridge is
 * drawn with rounded curves rather than sharp zigzag peaks.
 *
 * Kept dark by design at every hour, not literal daylight brightness: this
 * sits behind body text on every screen — lessons, cards, whole paragraphs —
 * and the scenery has to lose to legibility. Every colour stop stays at
 * 4.5:1 contrast or better against the reading text (WCAG AA), checked
 * across the full day, not just at the four named hours.
 */
export function LatticeBackground({ opacity = 1, scene = 'auto' }: { opacity?: number; scene?: Scene }) {
  const hour = useMemo(() => (scene === 'auto' ? currentHour() : TIME_OF_DAY_HOUR[scene]), [scene]);
  const sky = useMemo(() => skyAt(hour), [hour]);

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
          <RadialGradient id="cloud" cx="0.5" cy="0.5" r="0.5" gradientUnits="objectBoundingBox">
            <Stop offset="0" stopColor={withAlpha(palette.paper, 0.14)} />
            <Stop offset="1" stopColor={withAlpha(palette.paper, 0)} />
          </RadialGradient>
          <RadialGradient id="mist" cx="0.5" cy="0.5" r="0.5" gradientUnits="objectBoundingBox">
            <Stop offset="0" stopColor={withAlpha(palette.mossLight, 0.16)} />
            <Stop offset="1" stopColor={withAlpha(palette.mossLight, 0)} />
          </RadialGradient>
          {/* soft-focus, so the distant tree lines recede instead of
              competing for sharpness with the near one */}
          <Filter id="blurFar" x="-30%" y="-30%" width="160%" height="160%">
            <FeGaussianBlur stdDeviation="4" />
          </Filter>
          <Filter id="blurMid" x="-30%" y="-30%" width="160%" height="160%">
            <FeGaussianBlur stdDeviation="2" />
          </Filter>
        </Defs>

        <Rect width="400" height="900" fill="url(#sky)" />

        {/* a couple of soft anime-cloud clusters, high in the sky — the same
            gentle blur as the far tree line, so the whole upper scene reads
            as painted rather than vector-flat */}
        <CloudCluster cx={120} cy={200} scale={1.1} />
        <CloudCluster cx={300} cy={330} scale={0.85} />

        {/* the glow — sun by dawn, day and dusk, crossfading smoothly into a
            paler, cooler moon by night rather than swapping abruptly */}
        <Circle cx={sky.orbCx} cy={sky.orbCy} r={sky.orbGlowR} fill="url(#sunGlow)" opacity={1 - sky.moonMix} />
        <Circle cx={sky.orbCx} cy={sky.orbCy} r={sky.orbGlowR} fill="url(#moonGlow)" opacity={sky.moonMix} />

        {/* a soft sunburst behind the core — the hand-painted-sky detail,
            faint enough to read as atmosphere rather than a graphic burst */}
        <G filter="url(#blurMid)" opacity={0.5}>
          {sunburstRays(sky.orbCx, sky.orbCy, 10, 3).map((d, i) => (
            <Path key={i} d={d} fill={sky.moonMix > 0.5 ? withAlpha(palette.paper, 0.1) : withAlpha(palette.gold, 0.14)} />
          ))}
        </G>

        <Circle cx={sky.orbCx} cy={sky.orbCy} r={sky.orbCoreR} fill="url(#sunCore)" opacity={1 - sky.moonMix} />
        <Circle cx={sky.orbCx} cy={sky.orbCy} r={sky.orbCoreR} fill="url(#moonCore)" opacity={sky.moonMix} />

        {/* a scatter of stars, fading in and out with how close to night it is */}
        {sky.starOpacity > 0.02 && (
          <G opacity={sky.starOpacity}>
            <Circle cx="60" cy="140" r="1.6" fill={withAlpha(palette.paper, 0.7)} />
            <Circle cx="140" cy="90" r="1.2" fill={withAlpha(palette.paper, 0.5)} />
            <Circle cx="220" cy="160" r="1.4" fill={withAlpha(palette.paper, 0.6)} />
            <Circle cx="90" cy="220" r="1" fill={withAlpha(palette.paper, 0.45)} />
            <Circle cx="350" cy="120" r="1.5" fill={withAlpha(palette.paper, 0.65)} />
            <Circle cx="180" cy="60" r="1" fill={withAlpha(palette.paper, 0.4)} />
          </G>
        )}

        {/* two birds crossing the sky, fading out toward night — the one
            Alto's Adventure detail that makes a gradient read as a place */}
        {sky.birdOpacity > 0.02 && (
          <G opacity={sky.birdOpacity}>
            <Path d="M70,190 q10,-12 20,0 q10,-12 20,0" stroke={withAlpha(palette.ink600, 0.6)} strokeWidth={3} fill="none" strokeLinecap="round" />
            <Path d="M130,230 q8,-9 16,0 q8,-9 16,0" stroke={withAlpha(palette.ink600, 0.45)} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          </G>
        )}

        {/* a low, drifting mist bank over the clearing */}
        <Circle cx="180" cy="700" r="260" fill="url(#mist)" />
        <Circle cx="300" cy="740" r="200" fill="url(#mist)" />
        <Circle cx="60" cy="650" r="150" fill="url(#mist)" />

        {/* far tree line — palest, furthest back, softened out of focus */}
        <Path d={treeline(560, 60, 12, 1)} fill={withAlpha(palette.mossDark, 0.4)} filter="url(#blurFar)" />
        {/* mid tree line — taller, denser, a touch softer than the near one */}
        <Path d={treeline(660, 90, 10, 7)} fill={withAlpha(palette.mossDark, 0.72)} filter="url(#blurMid)" />
        {/* near tree line — darkest, closest to the bottom edge, left sharp
            so the eye has one place in the scene that is actually in focus */}
        <Path d={treeline(760, 110, 8, 13)} fill={withAlpha(palette.mossDeep, 0.95)} />

        {/* fireflies over the clearing, out at dusk and night */}
        {sky.fireflyOpacity > 0.02 && (
          <G opacity={sky.fireflyOpacity}>
            <Circle cx="150" cy="640" r="3" fill={withAlpha(palette.goldLight, 0.8)} />
            <Circle cx="240" cy="600" r="2.2" fill={withAlpha(palette.goldLight, 0.6)} />
          </G>
        )}
      </Svg>
    </View>
  );
}
