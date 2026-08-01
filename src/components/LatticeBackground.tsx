import { View } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Path, Ellipse, Rect } from 'react-native-svg';
import { palette, withAlpha } from '../theme';

/**
 * A ridge line, soft-shouldered rather than jagged.
 *
 * Friedrich's hills are long and low and read as *distance* rather than as
 * geology, so this is a single wide curve with a slight asymmetry — one
 * shoulder higher than the other — rather than a peak. `lift` is how far the
 * crest rises above the baseline; `skew` moves the crest off centre so no two
 * ridges share a profile.
 */
function ridge(baseY: number, lift: number, skew: number): string {
  const crest = 200 + skew;
  return [
    `M0,${baseY}`,
    `C${crest * 0.4},${baseY - lift * 0.55} ${crest * 0.72},${baseY - lift} ${crest},${baseY - lift}`,
    `C${crest + (400 - crest) * 0.3},${baseY - lift} ${crest + (400 - crest) * 0.66},${baseY - lift * 0.4} 400,${baseY - lift * 0.15}`,
    `L400,900 L0,900 Z`,
  ].join(' ');
}

/**
 * The scenery behind every screen: a landscape after Caspar David Friedrich.
 *
 * ## The method
 *
 * Aerial perspective, and almost nothing else. Depth is not drawn here, it is
 * dissolved: each ridge is *lighter* than the one in front of it, because more
 * air stands between it and the eye, and a band of mist lies in every gap. Only
 * the nearest silhouette is solid. Everything behind it is partway to being sky.
 *
 * That reversal — far things pale, near things black — is the whole trick, and
 * it looks wrong written down until you see it. It is also why this needs no
 * outlines: a shape stops where its tone stops.
 *
 * ## Why the softness came back
 *
 * The version before this was after Hopper: hard-edged flat planes, thick cloud
 * with a lit face and a shadow face. That is the opposite instinct, and it was
 * built deliberately. This is not a retreat from it — it is a different picture,
 * and the softness is the subject rather than an absence of definition.
 *
 * The alpha discipline the soft approach requires is back with it, and it is
 * strict for a measured reason: **each gap gets exactly one mist band.** Two
 * soft shapes at alpha `a` compose to about `2a - a²`, not `a`, and stacking
 * them is precisely what once put this scenery at 4.47:1 against body text
 * while every individual value looked safe. One band per gap, no exceptions.
 *
 * ## What the contrast ceiling costs
 *
 * Friedrich's skies open onto white. White is luminance 1.0; this sits behind
 * body text at 6:1, which caps every colour at 0.1016. So the luminous band is
 * `skyPale`, the brightest tone the arithmetic permits, and everything else is
 * pitched well below it. That turns out to be enough, because what reads as
 * light is the *interval* between the band and the dark beneath it, not the
 * absolute value. See `colors.ts` for every measurement.
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
            <Stop offset="0" stopColor={withAlpha(palette.skyWarm, 0.34)} />
            <Stop offset="0.5" stopColor={withAlpha(palette.skyWarm, 0.14)} />
            <Stop offset="1" stopColor={withAlpha(palette.skyWarm, 0)} />
          </RadialGradient>

          {/* Mist. Reaches zero alpha at the rim in every direction, so it has
              no edge of its own to show against the gradient behind it. */}
          <RadialGradient id="mist" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor={withAlpha(palette.mist, 0.2)} />
            <Stop offset="0.5" stopColor={withAlpha(palette.mist, 0.09)} />
            <Stop offset="1" stopColor={withAlpha(palette.mist, 0)} />
          </RadialGradient>
          <RadialGradient id="mistThin" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor={withAlpha(palette.mist, 0.12)} />
            <Stop offset="0.55" stopColor={withAlpha(palette.mist, 0.05)} />
            <Stop offset="1" stopColor={withAlpha(palette.mist, 0)} />
          </RadialGradient>
        </Defs>

        <Rect x="0" y="0" width="400" height="900" fill="url(#sky)" />

        {/* The occluded light, low and slightly off centre. Off centre because a
            glow in the middle of the frame reads as a lamp. */}
        <Ellipse cx="248" cy="470" rx="230" ry="150" fill="url(#glow)" />

        {/*
          Four ridges, far to near, each darker than the last. The mist band
          between each pair sits *on the base of the ridge behind it*, which is
          what makes the ridge appear to stand in air rather than to be cut out
          and pasted down.
        */}
        <Path d={ridge(560, 46, -70)} fill={palette.ridgeFar} />
        <Ellipse cx="150" cy="566" rx="300" ry="34" fill="url(#mist)" />

        <Path d={ridge(636, 58, 90)} fill={palette.ridgeMid} />
        <Ellipse cx="260" cy="644" rx="320" ry="38" fill="url(#mist)" />

        <Path d={ridge(716, 50, -40)} fill={palette.ridgeNear} />
        <Ellipse cx="140" cy="726" rx="300" ry="34" fill="url(#mistThin)" />

        {/* The foreground: one solid, unresolved silhouette. Friedrich puts a
            near-black repoussoir at the bottom of almost every landscape, and it
            is what gives the pale distance something to be distant *from*. */}
        <Path d={ridge(806, 42, 120)} fill={palette.foreground} />
        <Ellipse cx="300" cy="812" rx="260" ry="26" fill="url(#mistThin)" />
      </Svg>
    </View>
  );
}
