import { ReactNode } from 'react';
import { Pressable, View, ActivityIndicator } from 'react-native';
import { Bold } from './Text';
import { feedback } from '../lib/feedback';
import { palette, withAlpha } from '../theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'correct' | 'incorrect';

const FILL: Record<Variant, string> = {
  primary: palette.gold,
  secondary: palette.parchment,
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
  correct: palette.ink,
  incorrect: palette.ink,
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
  /**
   * URD-036: `opacity: disabled ? 0.4 : 1` alone dims a variant's own fill,
   * border and label together to a *muted version of the same colour* — a
   * warm-gold `primary` button stays a shaped, coloured, tactile-looking
   * pill at 40% opacity, still raised on its darker "edge" layer below.
   * Found by DESIGN CRITIC comparing an enabled vs. disabled refill button
   * at the same seed: "at a glance, before reading, a warm 40%-opacity gold
   * pill still reads as 'a button,' just a slightly duller one."
   *
   * Two changes, not one, because either alone still reads as "this
   * variant, but dim": swap every colour to this app's own existing
   * inert-and-unavailable *fill* (`palette.ink700`/`ink800` — the same flat
   * colour `HomeScreen.tsx` already gives a locked lesson row's background,
   * rather than a new neutral invented for this one component — though
   * that row also layers a further `opacity: 0.7` on top, which this
   * deliberately does not; see the contrast note below), *and* flatten the
   * 3D raised-pill effect disabled buttons no longer earn (`marginBottom:
   * 0` collapses the "edge" shadow layer entirely, the same visual state a
   * pressed button already uses mid-tap — a button that looks permanently
   * pressed-flat reads as inert the way a temporarily-pressed one reads as
   * "being tapped"). Full opacity throughout: the muted tones already read
   * as unavailable on their own, and dimming them further just makes the
   * label harder to read without adding a second signal.
   *
   * DESIGN CRITIC measured the disabled label's own contrast against this
   * fill at 3.24:1 — below the 4.5:1 AA floor for normal text, though
   * WCAG 1.4.3 explicitly exempts inactive/disabled controls from any
   * contrast requirement, and the label reads fine at the size this app
   * actually renders it. Noted rather than silently accepted: a future
   * pass could afford to lighten the disabled text a little without
   * undoing the muted-fill signal this fix depends on.
   */
  /**
   * DESIGN CRITIC: this line originally read `disabled ? palette.ink700 :
   * FILL[variant]` with no `isGhost` guard — unlike `edge` and `border`
   * right below it, which both already do guard it. Before this fix that
   * asymmetry was invisible: `fill` was always `FILL[variant]` regardless
   * of `disabled`, and `FILL.ghost` is `'transparent'` already, so nothing
   * ever showed through. The moment `fill` became disabled-dependent, a
   * disabled ghost button started rendering a solid `ink700` box instead
   * of staying transparent — reproduced live on `TracePad.tsx`'s disabled
   * "Clear" button, indistinguishable from a disabled *primary* button
   * beside it, contradicting the very comment two lines below this one
   * ("Ghost buttons have no fill, so they keep the faint outline").
   */
  const fill = isGhost ? 'transparent' : disabled ? palette.ink700 : FILL[variant];
  const edge = disabled ? palette.ink800 : EDGE[variant];
  const text = disabled ? withAlpha(palette.paper, 0.4) : TEXT[variant];
  const border = isGhost ? withAlpha(palette.cream, 0.2) : disabled ? withAlpha(palette.paper, 0.15) : palette.ink;
  return (
    <Pressable
      disabled={disabled || loading}
      onPress={() => {
        if (sound) feedback.tap();
        onPress?.();
      }}
      style={({ pressed }) => ({
        transform: [{ translateY: pressed ? 3 : 0 }],
      })}
      className={className}
    >
      {({ pressed }: { pressed: boolean }) => (
        <View style={{ borderRadius: 16, backgroundColor: isGhost ? 'transparent' : edge }}>
          <View
            style={{
              backgroundColor: fill,
              borderRadius: 16,
              marginBottom: isGhost || disabled ? 0 : pressed ? 0 : 4,
              // A flat fill reads as a coloured rectangle; a keyline around it
              // reads as ink on paper. Ghost buttons have no fill, so they keep
              // the faint outline that gives them an edge at all.
              borderWidth: isGhost ? 1 : 2,
              borderColor: border,
            }}
            className="flex-row items-center justify-center py-4 px-5"
          >
            {loading ? (
              <ActivityIndicator color={TEXT[variant]} />
            ) : (
              <>
                {icon}
                <Bold style={{ color: text }} className="text-[15px] uppercase tracking-[1.5px]">
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
