import { View, Image, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { palette, withAlpha } from '../theme';

/**
 * The evening sky, as a photograph rather than a drawing.
 *
 * ## Why this one is a raster
 *
 * The scenery behind every screen used to be drawn — an SVG built out of the
 * palette, which re-themed for free, scaled to any screen, and whose colours
 * `check:theme` could read. This does none of that, and the whole app stands on
 * it now.
 *
 * The price is worth stating plainly, because it is permanent: the background
 * no longer re-themes. Change `colors.ts` and every surface, every accent and
 * every piece of text moves; the landscape does not. Re-theming it means
 * re-exporting two JPEGs. That was an acceptable trade for one screen and it is
 * a deliberate one for all of them — the picture is better than the drawing was,
 * and a language course is not a product anyone re-themes twice a year.
 *
 * The drawn landscape and its eleven palette tokens were deleted rather than
 * left unrendered. `git log` has them.
 *
 * ## Why it cannot simply be the background everywhere
 *
 * `check:scenery` holds the scenery to 6:1 against body copy, measured on the
 * single brightest pixel, because text can land anywhere. This picture's
 * brightest pixel is the sun: **1.04:1**. As a whole-screen backdrop for
 * arbitrary text it is not a marginal failure, it is the worst possible one.
 *
 * Dimming it to pass was tried and measured: it clears 6:1 at 38% brightness,
 * and at 38% the pink is brown. The picture and the rule are in real conflict
 * and no global adjustment resolves it.
 *
 * ## What does resolve it
 *
 * The conflict is only global. Measured band by band, most of this image is
 * dark — the sun is a narrow horizontal strip, and above and below it the
 * picture is already darker than the drawn scenery ever was:
 *
 * | region                  | worst contrast vs `paper` |
 * | ----------------------- | ------------------------- |
 * | top 0–18%               | 8.86:1                    |
 * | 18–72% (sun, sky)       | down to 1.04:1            |
 * | bottom 72–100%, scrimmed| 11.77:1                   |
 *
 * So the picture is untouched and the *text* moves: the name sits in the top
 * band, the controls in the bottom one, and the sunset between them carries no
 * text at all. Nothing is dimmed to make room for a paragraph.
 *
 * Every figure above was measured on the shipped JPEG, not the export it came
 * from, because the encode moves them a little. `check:scenery` re-measures the
 * composited result on the real built app, so these numbers are documentation,
 * not the guarantee — the guarantee is the check.
 */

/** The image's own aspect. Everything here is sized from it. */
const ASPECT = 1080 / 1920;

/**
 * The two bands text is allowed in, as fractions of the picture's height.
 *
 * Exported because `LoginScreen` lays itself out against them and
 * `check:scenery` measures them; a copy in either place is a copy that drifts.
 */
export const SAFE_TOP = 0.18;
export const SAFE_BOTTOM = 0.72;

/**
 * The scrim under the bottom band: ink, absent at `FADE_TOP`, holding at
 * `SCRIM` from `SAFE_BOTTOM` down.
 *
 * It is not what makes the bottom band legible — the raw picture already
 * measures 6.37:1 across those rows on a phone, and `check:scenery` reads 7.74:1
 * under the actual controls with the scrim set to zero. It is there so the band
 * does not depend on the phone's crop: at full width the same rows fall to
 * 5.19:1, because a brighter patch sits at the right edge that a narrow screen
 * cuts off. A backdrop that passes on one screen shape and fails on another is
 * not a backdrop, so the scrim removes the difference — 11.77:1 across the band,
 * 10.1:1 measured under the controls.
 *
 * `FADE_TOP` is above the sun's brightest pixel (60.7%) by seven parts in a
 * thousand — the scrim is 4% opaque where the sun is, which is nothing. Moving
 * it any earlier to buy room for a taller button stack starts costing the sun.
 */
const FADE_TOP = 0.6;
const SCRIM = 0.7;

/**
 * The picture, sized so its height is exactly the screen's.
 *
 * This is the whole reason the safe bands can be stated as fractions: with the
 * height pinned, a fraction of the screen is the same fraction of the image on
 * every device, and the bands hold. `resizeMode="cover"` on a full-screen box
 * would not — on anything wider than 9:16 it fills the width instead and crops
 * the top and bottom away, which is to say it crops off both safe bands and
 * leaves the sun spanning the screen.
 *
 * The cost is that a wide window gets ink either side of a portrait panel. On a
 * phone, which is what this ships to, the picture is full-bleed.
 */
export function EveningScene() {
  const { height } = useWindowDimensions();
  const width = Math.round(height * ASPECT);

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', alignItems: 'center' }}
    >
      <Image
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        source={require('../../assets/images/evening.jpg')}
        style={{ width, height }}
        resizeMode="cover"
        accessibilityRole="image"
        accessibilityLabel=""
      />
      <Svg
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <Defs>
          <LinearGradient id="eveningScrim" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={withAlpha(palette.ink, 0)} />
            <Stop offset={FADE_TOP} stopColor={withAlpha(palette.ink, 0)} />
            <Stop offset={SAFE_BOTTOM} stopColor={withAlpha(palette.ink, SCRIM)} />
            <Stop offset="1" stopColor={withAlpha(palette.ink, SCRIM)} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#eveningScrim)" />
      </Svg>
    </View>
  );
}

/**
 * The same view, an hour later.
 *
 * `EveningScene` above only works where the layout can be built around its two
 * dark bands. A screen with a heading, three figures, a button and two lines of
 * small print has text down its whole middle, and the middle of that picture is
 * the sun — 1.04:1. There is no arrangement of those elements that avoids it.
 *
 * The first attempt at this blurred the picture heavily and darkened it, on the
 * theory that removing the detail removes the fight with the text. It did, and
 * it also removed the picture: what was left was a soft blue-violet wash,
 * because the sky this image starts from is blue at the top and a saturation
 * boost pulled the whole frame that way. Detail and warmth were exactly what
 * was worth keeping.
 *
 * So nothing is blurred. Every pixel is composited toward `palette.ink` — the
 * app's own warm espresso — which lowers luminance while leaving every edge in
 * place. The clouds, the ridge line, the treeline and the path down the valley
 * are all still there; the scene simply reads as later in the evening rather
 * than as a photograph someone dimmed. Compositing toward a warm dark also
 * keeps the sunset red where a blur averaged it into mauve.
 *
 * At 72% ink it measures **6.65:1** against body copy at its brightest point,
 * everywhere, so no part of the screen is off-limits. 58 KB.
 *
 * The floor it sets: text must be at least 75% opaque paper to clear WCAG AA
 * against the last of the horizon glow. Nothing on this screen goes below that.
 */
export function DuskScene({ dim = 0 }: { dim?: number }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <Image
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        source={require('../../assets/images/evening-dusk.jpg')}
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
        accessibilityRole="image"
        accessibilityLabel=""
      />
      {dim > 0 && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: withAlpha(palette.ink, dim),
          }}
        />
      )}
    </View>
  );
}

/**
 * How much further into the night the app's interior screens go.
 *
 * The welcome screen holds a name, a line, three figures and a button, and the
 * picture behind it is the picture. A lesson list is forty rows of icon, title
 * and subtitle stacked down the whole frame, and behind that the same landscape
 * stops being scenery and starts being noise: the horizon runs straight through
 * the middle of the list and its glow lands under the labels.
 *
 * It is the same place either way — that is the point of continuing the theme —
 * just later, so it reads as air behind the interface rather than as a view
 * competing with it. The drawn scenery this replaces made the same move by
 * dissolving its own ridges into mist; this does it with light.
 */
export const INTERIOR_DIM = 0.45;
