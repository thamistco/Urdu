import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path, Ellipse, G, Rect } from 'react-native-svg';
import { palette } from '../theme';

/**
 * One cumulus mass, drawn the way a painter blocks one in.
 *
 * A cloud is not an outline to be filled; it is a solid with a side facing the
 * light and a side turned away. So it is built twice: a shadow body from
 * overlapping opaque ellipses, then a smaller, higher set in the lit tone
 * sitting on top of it. The offset between them *is* the light direction, and
 * because both sets are opaque and same-coloured within themselves they union
 * cleanly — no seams where they overlap.
 *
 * `lobes` are [dx, dy, rx, ry] relative to the mass centre, in a 0-1 scale that
 * `w` and `h` stretch. The same lobe list drives both passes; the lit pass just
 * shrinks and lifts it.
 */
function cloud(cx: number, cy: number, w: number, h: number, key: string, flip = false) {
  /**
   * Deliberately flat and asymmetric. The first version used tall, evenly
   * spaced lobes and produced three cartoon puffs — the shape a child draws,
   * not the shape weather makes. Real stratocumulus is wide, shallow, heaped up
   * at one end and trailing at the other, and its underside is nearly flat
   * because that is where the air stops rising. `flip` mirrors the heap so the
   * three masses are not one silhouette repeated.
   */
  const lobes: [number, number, number, number][] = [
    [-0.78, 0.24, 0.34, 0.2],
    [-0.34, 0.02, 0.46, 0.44],
    [0.02, -0.14, 0.4, 0.56],
    [0.36, 0.06, 0.44, 0.36],
    [0.74, 0.26, 0.36, 0.18],
    [0.0, 0.34, 0.98, 0.2],
  ].map(([dx, dy, rx, ry]) => [flip ? -dx : dx, dy, rx, ry]) as [number, number, number, number][];
  const at = (pass: 'shade' | 'lit') =>
    lobes.map(([dx, dy, rx, ry], i) => {
      // The lit pass is inset and lifted: the sun is up and to the left, so the
      // face it catches is the upper-left of every lobe.
      const k = pass === 'lit' ? 0.82 : 1;
      const lift = pass === 'lit' ? -0.2 : 0;
      const slide = pass === 'lit' ? -0.06 : 0;
      return (
        <Ellipse
          key={`${key}-${pass}-${i}`}
          cx={cx + (dx + slide) * w}
          cy={cy + (dy + lift) * h}
          rx={rx * w * k}
          ry={ry * h * k}
          fill={pass === 'lit' ? palette.cloudLit : palette.cloudShade}
        />
      );
    });
  return (
    <G key={key}>
      {at('shade')}
      {at('lit')}
    </G>
  );
}

/**
 * The scenery behind every screen: a landscape after Edward Hopper.
 *
 * ## What changed, and why the old rule was retired
 *
 * The scenery before this was a misty forest built entirely from soft radial
 * gradients, under one governing rule: **nothing in the air has a hard edge.**
 * That rule was real and hard-won — a semi-transparent shape shows its own
 * outline over a gradient however low the alpha, and two overlapping at alpha
 * `a` composite to about `2a - a²`, which is what once made a row of clouds
 * read as a row of grey discs.
 *
 * Hopper is the opposite instinct: hard-edged planes of flat colour, big simple
 * masses, raking light, and a single warm accent carrying the feeling. Those
 * two positions look irreconcilable, and are not. The old rule was never about
 * clouds; it was a workaround for **alpha**. Opaque shapes of one colour union
 * cleanly and have no seam to show. Painting the clouds solid does not break
 * the rule so much as remove the thing it was protecting against.
 *
 * ## What could not be carried over
 *
 * Hopper as he is usually remembered — hard noon on a white clapboard wall —
 * is impossible here, and not for want of trying. This sits behind body text on
 * every screen and is held to 6:1 against it, capping any colour at a relative
 * luminance of 0.1016. Sunlit white is 0.76, seven times over the ceiling. So
 * this is his other register: the late, low light of the road and rail
 * paintings, sky gone slate, one band near the horizon still warm. Same grammar,
 * lower key. See `colors.ts` for every measured value.
 *
 * ## The composition
 *
 * Three cloud masses, thick and close-valued, sitting high; a horizon band that
 * is the only warm thing in the picture; three flat land planes each darker than
 * the one behind it; and one long raking shadow thrown across the middle plane,
 * which is the most Hopper thing here — a shape defined by light rather than by
 * an object.
 */
export function LatticeBackground({ opacity = 1 }: { opacity?: number }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', inset: 0, opacity }}>
      <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 400 900">
        <Defs>
          {/* The sky is the one place a gradient still earns its keep: a flat
              band would put a hard horizontal edge across the top of every
              screen, and that edge would sit behind running text. */}
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={palette.skySlate} />
            <Stop offset="0.42" stopColor={palette.skyMid} />
            <Stop offset="0.72" stopColor={palette.skyLow} />
            <Stop offset="1" stopColor={palette.skyWarm} />
          </LinearGradient>
        </Defs>

        <Rect x="0" y="0" width="400" height="620" fill="url(#sky)" />

        {/* Thick weather, high up and reading left to right. Overlapping in
            plan but not in size, so they group as one bank rather than three
            repetitions. */}
        {cloud(110, 138, 165, 46, 'a')}
        {cloud(292, 226, 190, 56, 'b', true)}
        {cloud(140, 322, 225, 64, 'c')}

        {/* The warm band. Hopper's pictures usually have exactly one of these
            and everything else defers to it, so it is a single hard-edged strip
            rather than a glow. */}
        <Rect x="0" y="556" width="400" height="26" fill={palette.skyWarm} />

        {/* Land: three planes, hard-edged, each darker than the one behind.
            Depth here comes from value, not from haze — which is the change of
            method the whole scene turns on. */}
        <Path d="M0,582 L400,582 L400,664 L0,640 Z" fill={palette.landFar} />
        <Path d="M0,640 L400,664 L400,752 L0,716 Z" fill={palette.landMid} />
        <Path d="M0,716 L400,752 L400,900 L0,900 Z" fill={palette.landNear} />

        {/* The raking shadow: a shape defined by light rather than by an object,
            thrown across the middle plane by something off-frame. Drawn in the
            near plane's own colour so it reads as the same ground in shade, not
            as a fourth thing. */}
        <Path d="M0,662 L168,652 L268,724 L0,742 Z" fill={palette.landNear} opacity={0.72} />

        {/* A second, narrower shadow further down, angled the other way — two
            parallel diagonals would read as a pattern rather than as light. */}
        <Path d="M400,760 L400,830 L214,806 L306,754 Z" fill={palette.landNear} opacity={0.55} />
      </Svg>
    </View>
  );
}
