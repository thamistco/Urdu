import Svg, { G, Path } from 'react-native-svg';
import { palette } from '../theme';

/** A slim row of diamond motifs — a quiet section break echoing the lattice. */
export function GeoDivider({ color = palette.gold, opacity = 0.5 }: { color?: string; opacity?: number }) {
  return (
    <Svg viewBox="0 0 240 12" width={160} height={12} style={{ alignSelf: 'center', marginVertical: 12 }}>
      {Array.from({ length: 10 }).map((_, i) => {
        const cx = 12 + i * 24;
        return (
          <G key={i} opacity={opacity}>
            <Path d={`M${cx} 1 L${cx + 5} 6 L${cx} 11 L${cx - 5} 6 Z`} stroke={color} strokeWidth={1} fill="none" />
          </G>
        );
      })}
    </Svg>
  );
}
