import { View } from 'react-native';
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg';
import { palette, withAlpha } from '../theme';

/**
 * The single ornamental motif — an 8-point Islamic geometric star lattice,
 * rendered very faintly behind content. Design-system discipline: one flourish,
 * used sparingly, so the interface stays calm and grid-driven.
 */
export function LatticeBackground({ opacity = 0.06 }: { opacity?: number }) {
  const stroke = withAlpha(palette.gold, opacity);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', inset: 0 }}>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="lattice" width={44} height={44} patternUnits="userSpaceOnUse">
            {/* 8-point star built from two overlapping squares */}
            <Path d="M22 6 L38 22 L22 38 L6 22 Z" stroke={stroke} strokeWidth={1} fill="none" />
            <Path d="M22 12 L32 22 L22 32 L12 22 Z" stroke={stroke} strokeWidth={0.75} fill="none" />
            <Path d="M10 10 L34 34 M34 10 L10 34" stroke={stroke} strokeWidth={0.5} fill="none" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#lattice)" />
      </Svg>
    </View>
  );
}
