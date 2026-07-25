import { ReactNode } from 'react';
import { Pressable, View, ActivityIndicator } from 'react-native';
import { Bold } from './Text';
import { feedback } from '../lib/feedback';
import { palette } from '../theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'correct' | 'incorrect';

const FILL: Record<Variant, string> = {
  primary: palette.gold,
  secondary: palette.paper,
  ghost: 'transparent',
  correct: palette.jade,
  incorrect: palette.rose,
};
const EDGE: Record<Variant, string> = {
  primary: palette.goldDark,
  secondary: palette.paperDim,
  ghost: 'transparent',
  correct: palette.jadeDark,
  incorrect: palette.roseDark,
};
const TEXT: Record<Variant, string> = {
  primary: palette.ink,
  secondary: palette.ink,
  ghost: palette.cream,
  correct: palette.white,
  incorrect: palette.white,
};

/**
 * A tactile, Duolingo-style button — a colored face sitting on a darker "edge"
 * that compresses on press, giving a satisfying physical click (paired with a
 * soft tap sound + haptic). Big hit target, generous radius.
 */
export function Button({
  children,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  className = '',
  sound = true,
  icon,
}: {
  children: ReactNode;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  sound?: boolean;
  icon?: ReactNode;
}) {
  const isGhost = variant === 'ghost';
  return (
    <Pressable
      disabled={disabled || loading}
      onPress={() => {
        if (sound) feedback.tap();
        onPress?.();
      }}
      style={({ pressed }) => ({
        opacity: disabled ? 0.4 : 1,
        transform: [{ translateY: pressed ? 3 : 0 }],
      })}
      className={className}
    >
      {({ pressed }: { pressed: boolean }) => (
        <View style={{ borderRadius: 16, backgroundColor: isGhost ? 'transparent' : EDGE[variant] }}>
          <View
            style={{
              backgroundColor: FILL[variant],
              borderRadius: 16,
              marginBottom: isGhost ? 0 : pressed ? 0 : 4,
              borderWidth: isGhost ? 1 : 0,
              borderColor: 'rgba(244,235,217,0.2)',
            }}
            className="flex-row items-center justify-center py-4 px-5"
          >
            {loading ? (
              <ActivityIndicator color={TEXT[variant]} />
            ) : (
              <>
                {icon}
                <Bold
                  style={{ color: TEXT[variant] }}
                  className="text-[15px] uppercase tracking-[1.5px]"
                >
                  {children}
                </Bold>
              </>
            )}
          </View>
        </View>
      )}
    </Pressable>
  );
}
