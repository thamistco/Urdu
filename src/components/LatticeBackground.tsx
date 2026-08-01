import { View } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Path, Ellipse, Rect } from 'react-native-svg';
import { palette, withAlpha } from '../theme';

/** Where the light is. Everything directional in the scene points back at it. */
const SUN = { x: 248, y: 470 };

/**
 * How the rim light breaks along a treeline.
 *
 * Backlighting does not outline a row of trees, it catches some of them: a lit
 * shoulder here, two dark ones, a bright tip. An unbroken stroke over this
 * zigzag drew the row as a saw blade — unmistakably a graphic of a forest
 * rather than light falling on one. Irregular on purpose; an even dash reads as
 * a dashed line, which is just a different drawing.
 */
const CATCH = '4 9 7 5 3 12';

/**
 * The lit edge of a ridge, as an open curve.
 *
 * Split out from `ridge` below because the rim light has to stroke *only* the
 * skyline. Stroking the filled shape would draw a neon line down both sides of
 * the frame and along the bottom, which is not a horizon, it is a box.
 *
 * Friedrich's hills are long and low and read as *distance* rather than as
 * geology, so this is a single wide curve with a slight asymmetry — one
 * shoulder higher than the other — rather than a peak. `lift` is how far the
 * crest rises above the baseline; `skew` moves the crest off centre so no two
 * ridges share a profile.
 */
function crest(baseY: number, lift: number, skew: number): string {
  const c = 200 + skew;
  return [
    `M0,${baseY}`,
    `C${c * 0.4},${baseY - lift * 0.55} ${c * 0.72},${baseY - lift} ${c},${baseY - lift}`,
    `C${c + (400 - c) * 0.3},${baseY - lift} ${c + (400 - c) * 0.66},${baseY - lift * 0.4} 400,${baseY - lift * 0.15}`,
  ].join(' ');
}

/** The ridge as a solid body: its crest, closed down to the bottom of the frame. */
function ridge(baseY: number, lift: number, skew: number): string {
  return `${crest(baseY, lift, skew)} L400,900 L0,900 Z`;
}

/**
 * The tops of a row of firs, as an open polyline.
 *
 * Friedrich's foregrounds are almost always a stand of spruce or fir in
 * silhouette, and they are the one thing in his pictures with a crisp edge —
 * everything behind them is dissolving, which is exactly what makes them read
 * as *near*.
 *
 * `spread` is how far apart they stand and `h` how tall; both shrink with
 * distance, which is the only perspective cue they need.
 */
function firsEdge(baseY: number, h: number, spread: number, seed: number, sag: number): string {
  const parts: string[] = [`M0,${baseY + h}`];
  for (let x = -spread / 2; x < 400 + spread; x += spread) {
    // A little variation in height and lean, or a row of identical triangles
    // reads as a fence rather than as trees.
    const n = Math.abs(Math.sin(x * 0.021 + seed));
    const top = baseY - h * (0.55 + n * 0.75);
    const half = spread * (0.34 + n * 0.16);
    // The ridge it stands on is curved, so the feet follow that curve.
    const foot = baseY + Math.sin((x / 400) * Math.PI) * -sag;
    parts.push(`L${(x - half).toFixed(1)},${foot.toFixed(1)}`);
    parts.push(`L${x.toFixed(1)},${top.toFixed(1)}`);
    parts.push(`L${(x + half).toFixed(1)},${foot.toFixed(1)}`);
  }
  return parts.join(' ');
}

/**
 * The treeline as a solid body. Drawn opaque and in its ridge's own colour, so
 * it unions with the ridge rather than sitting on it as a separate band, and so
 * two overlapping trees show no seam.
 */
function firs(baseY: number, h: number, spread: number, seed: number, sag: number): string {
  return `${firsEdge(baseY, h, spread, seed, sag)} L400,900 L0,900 Z`;
}

/**
 * A shaft of light leaving the sun, as a long thin wedge.
 *
 * `angle` is degrees from straight up, positive to the right; `spread` is how
 * much the shaft widens over its length. Drawn behind the ridges on purpose:
 * god rays in front of the terrain would lighten the very shapes the text has
 * to be legible against, and the mist bands already do the in-front-of-the-hills
 * job. In the sky, which is where a shaft actually reads, they cost nothing.
 */
function beam(angle: number, spread: number, len: number): string {
  const at = (deg: number) => {
    const t = ((deg - 90) * Math.PI) / 180;
    return `${(SUN.x - len * Math.cos(t)).toFixed(1)},${(SUN.y - len * Math.sin(t)).toFixed(1)}`;
  };
  return `M${SUN.x},${SUN.y} L${at(angle - spread / 2)} L${at(angle + spread / 2)} Z`;
}

/**
 * The scenery behind every screen: a landscape after Caspar David Friedrich,
 * lit and graded like a film.
 *
 * ## The method
 *
 * Aerial perspective first, and almost nothing else structural. Depth is not
 * drawn here, it is dissolved: each ridge is *lighter* than the one in front of
 * it, because more air stands between it and the eye, and a band of mist lies in
 * every gap. Only the nearest silhouette is solid. Everything behind it is
 * partway to being sky.
 *
 * ## The cinematic layer, and what is not in it
 *
 * On top of the landscape sit four things a camera does and an eye does not:
 * shafts of light made visible by haze, an anamorphic flare off the sun, rim
 * light picking out the edges that face it, and a grade that falls off top and
 * bottom. All of them are warm, because all of them are this sun's light.
 *
 * There is deliberately **no neon here**. A pass that rimmed these skylines in
 * electric blue is worth recording because it was defensible and still wrong:
 * blue is the only hue that survives the contrast ceiling at full intensity —
 * luminance is 0.2126R + 0.7152G + 0.0722B, so at full saturation the ceiling
 * allows blue and indigo at value 1.00 while orange caps at 0.56 and yellow at
 * 0.37 — which makes blue the only *available* neon. It rendered cleanly and
 * measured fine, and it turned the landscape into signage: a lit wireframe of
 * hills rather than hills.
 *
 * Neon is a made object and belongs on the made object. It lives on the
 * wordmark now (`components/Wordmark.tsx`); the land is lit by the sun that is
 * actually in the picture.
 *
 * ## The alpha discipline, which has not relaxed
 *
 * **Each gap still gets exactly one mist band.** Two soft shapes at alpha `a`
 * compose to about `2a - a²`, not `a`, and stacking them is precisely what once
 * put this scenery at 4.47:1 against body text while every individual value
 * looked safe. The cinematic layers here — shafts, streak, bloom, vignette — are
 * all further soft passes over the same sky, so they are pitched low and the
 * composite is measured, never estimated. The vignette earns its place twice
 * over: it is the only new layer that *subtracts* light.
 */
export function LatticeBackground({ opacity = 1 }: { opacity?: number }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', inset: 0, opacity }}>
      <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 400 900">
        <Defs>
          {/* Cold at the top, opening toward the light low down. The pale stop
              sits just above the first ridge, so the brightest part of the sky
              is the part the land is silhouetted against. */}
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={palette.skyHigh} />
            <Stop offset="0.44" stopColor={palette.skyMid} />
            <Stop offset="0.82" stopColor={palette.skyPale} />
            <Stop offset="1" stopColor={palette.skyPale} />
          </LinearGradient>

          {/* The sun, behind weather. Never a disc — Friedrich's light source is
              almost always occluded, and a visible disc would make the picture
              about the sun rather than about the air. */}
          <RadialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor={withAlpha(palette.skyWarm, 0.3)} />
            <Stop offset="0.5" stopColor={withAlpha(palette.skyWarm, 0.14)} />
            <Stop offset="1" stopColor={withAlpha(palette.skyWarm, 0)} />
          </RadialGradient>

          {/* Mist. Reaches zero alpha at the rim in every direction, so it has
              no edge of its own to show against the gradient behind it. */}
          <RadialGradient id="mist" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor={withAlpha(palette.mist, 0.14)} />
            <Stop offset="0.5" stopColor={withAlpha(palette.mist, 0.06)} />
            <Stop offset="1" stopColor={withAlpha(palette.mist, 0)} />
          </RadialGradient>
          <RadialGradient id="mistThin" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor={withAlpha(palette.mist, 0.12)} />
            <Stop offset="0.55" stopColor={withAlpha(palette.mist, 0.05)} />
            <Stop offset="1" stopColor={withAlpha(palette.mist, 0)} />
          </RadialGradient>

          {/* A shaft, brightest at the sun and gone before it lands. */}
          <LinearGradient id="ray" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={withAlpha(palette.skyWarm, 0.16)} />
            <Stop offset="1" stopColor={withAlpha(palette.skyWarm, 0)} />
          </LinearGradient>

          {/* The anamorphic streak: the horizontal flare a wide cine lens throws
              off a bright source. It is the most recognisable "shot on film"
              artefact there is. Warm, because it is this sun's light bent by
              glass, not a colour of its own. Narrow in the middle and gone well
              before the frame edge — a streak that reaches both edges stops
              being a flare and becomes a rule. */}
          <LinearGradient id="streak" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={withAlpha(palette.rimLight, 0)} />
            <Stop offset="0.36" stopColor={withAlpha(palette.rimLight, 0.3)} />
            <Stop offset="0.5" stopColor={withAlpha(palette.rimLight, 0.95)} />
            <Stop offset="0.64" stopColor={withAlpha(palette.rimLight, 0.3)} />
            <Stop offset="1" stopColor={withAlpha(palette.rimLight, 0)} />
          </LinearGradient>

          {/* Rim light. A gradient rather than a flat stroke, so the edge is lit
              only where it faces the sun and dies away fast — a rim of even
              brightness all the way across reads as an outline, and an outline
              is the one thing this picture has never had.

              An earlier pass lit roughly the middle two-thirds and looked like
              vector art: a continuous line tracing every ridge and every tree,
              which is a wireframe of the landscape rather than light on it. The
              pool is now tight and falls to nothing well inside the frame. */}
          <LinearGradient id="rimNear" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={withAlpha(palette.rimLight, 0)} />
            <Stop offset="0.34" stopColor={withAlpha(palette.rimLight, 0.16)} />
            <Stop offset="0.52" stopColor={withAlpha(palette.rimLight, 1)} />
            <Stop offset="0.7" stopColor={withAlpha(palette.rimLight, 0.2)} />
            <Stop offset="1" stopColor={withAlpha(palette.rimLight, 0)} />
          </LinearGradient>
          <LinearGradient id="rimFar" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={withAlpha(palette.rimLight, 0)} />
            <Stop offset="0.36" stopColor={withAlpha(palette.rimLight, 0.12)} />
            <Stop offset="0.54" stopColor={withAlpha(palette.rimLight, 0.85)} />
            <Stop offset="0.72" stopColor={withAlpha(palette.rimLight, 0.16)} />
            <Stop offset="1" stopColor={withAlpha(palette.rimLight, 0)} />
          </LinearGradient>

          {/* Letterbox. Not black bars — a grade that falls off top and bottom,
              which is what actually makes a frame feel photographed rather than
              cropped. */}
          <LinearGradient id="capTop" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={withAlpha(palette.ink, 0.72)} />
            <Stop offset="1" stopColor={withAlpha(palette.ink, 0)} />
          </LinearGradient>
          <LinearGradient id="capBottom" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0" stopColor={withAlpha(palette.ink, 0.6)} />
            <Stop offset="1" stopColor={withAlpha(palette.ink, 0)} />
          </LinearGradient>
        </Defs>

        <Rect x="0" y="0" width="400" height="900" fill="url(#sky)" />

        {/* The occluded light, low and slightly off centre. Off centre because a
            glow in the middle of the frame reads as a lamp. */}
        <Ellipse cx={SUN.x} cy={SUN.y} rx="230" ry="150" fill="url(#glow)" />

        {/* Shafts, fanning up and out. Uneven spacing and widths — evenly spaced
            rays read as a graphic sunburst rather than as light through cloud. */}
        <Path d={beam(-64, 7, 620)} fill="url(#ray)" />
        <Path d={beam(-38, 4, 560)} fill="url(#ray)" />
        <Path d={beam(-12, 9, 640)} fill="url(#ray)" />
        <Path d={beam(20, 5, 580)} fill="url(#ray)" />
        <Path d={beam(46, 8, 600)} fill="url(#ray)" />

        {/* The flare: three passes at widening scale — atmospheric haze, then
            bloom, then the filament. A single stroke of any width reads as a
            drawn line; it is the falloff between the passes that reads as light
            blooming inside glass. */}
        <Ellipse cx={SUN.x} cy={SUN.y} rx="290" ry="34" fill="url(#streak)" opacity="0.1" />
        <Ellipse cx={SUN.x} cy={SUN.y} rx="270" ry="9" fill="url(#streak)" opacity="0.22" />
        <Ellipse cx={SUN.x} cy={SUN.y} rx="250" ry="1.5" fill="url(#streak)" opacity="0.8" />

        {/*
          Four ridges, far to near, each darker than the last, and each with the
          sun catching its skyline. Rim first, then the mist band — so the mist
          softens the far rims and leaves the near ones crisp, which is the rule
          the whole picture already runs on.

          Every rim is two strokes: a wide dim one for the bloom and a narrow
          bright one for the filament. That pairing is what separates neon from
          a line.
        */}
        <Path d={ridge(560, 46, -70)} fill={palette.ridgeFar} />
        <Path d={crest(560, 46, -70)} stroke="url(#rimFar)" strokeWidth="10" fill="none" opacity="0.08" />
        <Path d={crest(560, 46, -70)} stroke="url(#rimFar)" strokeWidth="0.9" fill="none" opacity="0.4" />
        <Ellipse cx="150" cy="566" rx="300" ry="34" fill="url(#mist)" />

        <Path d={ridge(636, 58, 90)} fill={palette.ridgeMid} />
        {/* The furthest trees: small, close-packed, barely more than a texture
            on the ridge — which is all a distant treeline ever is. */}
        <Path d={firs(628, 15, 15, 1.7, 22)} fill={palette.ridgeMid} />
        <Path d={firsEdge(628, 15, 15, 1.7, 22)} stroke="url(#rimFar)" strokeWidth="7" fill="none" opacity="0.1" />
        <Path
          d={firsEdge(628, 15, 15, 1.7, 22)}
          stroke="url(#rimFar)"
          strokeWidth="0.8"
          strokeDasharray={CATCH}
          fill="none"
          opacity="0.5"
        />
        <Ellipse cx="260" cy="644" rx="320" ry="38" fill="url(#mist)" />

        <Path d={ridge(716, 50, -40)} fill={palette.ridgeNear} />
        <Path d={firs(708, 26, 24, 4.1, 18)} fill={palette.ridgeNear} />
        <Path d={firsEdge(708, 26, 24, 4.1, 18)} stroke="url(#rimNear)" strokeWidth="9" fill="none" opacity="0.11" />
        <Path
          d={firsEdge(708, 26, 24, 4.1, 18)}
          stroke="url(#rimNear)"
          strokeWidth="1"
          strokeDasharray={CATCH}
          fill="none"
          opacity="0.6"
        />
        <Ellipse cx="140" cy="726" rx="300" ry="34" fill="url(#mistThin)" />

        {/* The foreground: one solid, unresolved silhouette. Friedrich puts a
            near-black repoussoir at the bottom of almost every landscape, and it
            is what gives the pale distance something to be distant *from*. Its
            rim is the brightest and the tightest in the picture — this is the
            edge the eye is meant to land on. */}
        <Path d={ridge(806, 42, 120)} fill={palette.foreground} />
        <Path d={firs(798, 54, 42, 0.4, 14)} fill={palette.foreground} />
        <Path d={firsEdge(798, 54, 42, 0.4, 14)} stroke="url(#rimNear)" strokeWidth="12" fill="none" opacity="0.1" />
        <Path
          d={firsEdge(798, 54, 42, 0.4, 14)}
          stroke="url(#rimNear)"
          strokeWidth="1.2"
          strokeDasharray={CATCH}
          fill="none"
          opacity="0.7"
        />
        <Ellipse cx="300" cy="826" rx="260" ry="24" fill="url(#mistThin)" />

        {/* The grade, last and over everything. */}
        <Rect x="0" y="0" width="400" height="230" fill="url(#capTop)" />
        <Rect x="0" y="700" width="400" height="200" fill="url(#capBottom)" />
      </Svg>
    </View>
  );
}
