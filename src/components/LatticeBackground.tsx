import { View } from 'react-native';
import Svg, { Defs, Pattern, Circle, Rect } from 'react-native-svg';
import { palette, withAlpha } from '../theme';

/**
 * The single ornamental motif — a halftone dot screen, the texture of cheap
 * four-colour comic printing, laid very faintly behind everything.
 *
 * Design-system discipline: one flourish, used sparingly, so the interface
 * stays calm and grid-driven. On a dark ground this is what carries the comic
 * register — flat colour alone just reads as a bright theme.
 *
 * The dots sit on the offset grid a real halftone screen uses (every other row
 * shifted by half a cell) rather than a square grid, which is what stops it
 * looking like polka dots.
 */
export function LatticeBackground({ opacity = 0.07 }: { opacity?: number }) {
  const dot = withAlpha(palette.gold, opacity);
  const r = 1.6;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', inset: 0 }}>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="halftone" width={18} height={18} patternUnits="userSpaceOnUse">
            <Circle cx={4.5} cy={4.5} r={r} fill={dot} />
            <Circle cx={13.5} cy={13.5} r={r} fill={dot} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#halftone)" />
      </Svg>
    </View>
  );
}
