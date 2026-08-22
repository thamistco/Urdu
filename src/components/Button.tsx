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
   * THE CRITIC: the first version of this read `withAlpha(palette.paper,
   * 0.4)` — 3.24:1 against `ink700`, exactly the value `check:theme`'s own
   * measured table (its doc comment) names as a documented failure, the
   * reason that check enforces a 55% floor on `text-paper/N` classNames at
   * all. It passed `check:theme` anyway only because that check's floor
   * rule pattern-matches the Tailwind spelling, not an inline `withAlpha()`
   * call — a green check that wasn't looking at the thing it was supposed
   * to, the exact shape this project's CLAUDE.md names as non-negotiable
   * #2. Raised to the same 55% this project's own check already requires
   * everywhere else, rather than leaning on WCAG 1.4.3's disabled-control
   * exemption to justify a number this codebase has already measured and
   * rejected once.
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
  // THE CRITIC (MINOR): computed the same way as `fill` now is, rather than
  // leaving `isGhost` to be guarded only at the JSX call site below — two
  // places to keep in sync is exactly the shape that let `fill`'s own
  // missing guard go unnoticed until it started mattering.
  const edge = isGhost ? 'transparent' : disabled ? palette.ink800 : EDGE[variant];
  const text = disabled ? withAlpha(palette.paper, 0.55) : TEXT[variant];
  /**
   * THE CRITIC: this used to check `isGhost` *before* `disabled`
   * (`isGhost ? withAlpha(cream, 0.2) : disabled ? ... : palette.ink`), so
   * a ghost button's disabled branch was unreachable — its border stayed
   * `withAlpha(cream, 0.2)` whether enabled or disabled. Combined with
   * `fill` correctly staying transparent for ghost either way, a disabled
   * ghost button had no visual signal at all beyond the label dimming —
   * the exact "still reads as a button, just duller" failure this whole
   * item exists to fix, just relocated onto ghost instead of removed.
   * Real and reachable: `variant={x ? 'primary' : 'ghost'}` tied to
   * `disabled={!x}` is the standing pattern for a "type/select something
   * first" CTA (`SentenceReading.tsx`, `WordBuild.tsx`,
   * `RecallExercises.tsx`), so every one of those renders exactly this
   * combination for its entire pre-input state, not an edge case. Checking
   * `disabled` first gives every disabled button — ghost or not — the same
   * muted border, and leaves each variant's own border untouched while
   * enabled.
   */
  const border = disabled ? withAlpha(palette.paper, 0.15) : isGhost ? withAlpha(palette.cream, 0.2) : palette.ink;
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
        <View style={{ borderRadius: 16, backgroundColor: edge }}>
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
              // THE CRITIC: latent, not live today — no caller currently
              // passes `loading` to this component — but `text` right below
              // already branches on `disabled`; this didn't, so a button
              // that was ever both `loading` and `disabled` would have spun
              // in the variant's full-strength colour against the new muted
              // fill, undoing the rest of this fix for that one combination.
              <ActivityIndicator color={text} />
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
