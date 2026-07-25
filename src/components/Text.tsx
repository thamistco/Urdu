import { Text as RNText, TextProps } from 'react-native';
import { cssInterop } from 'nativewind';

/**
 * Typography wrappers so screens don't repeat font classes.
 *   Display  — Fraunces, warm serif for headings/numbers.
 *   Txt/Body — Public Sans, clean and legible for everything else.
 *   Urdu     — Noto Nastaliq Urdu, RTL, generous line-height (the script needs air).
 */

type Props = TextProps & { className?: string };

/**
 * English-language text always lays out left-to-right. Without this, a
 * paragraph that *begins* with an Urdu word (e.g. "وہ does double duty…")
 * flips the entire line to RTL and strands the full stop on the wrong side.
 * The `Urdu` component below opts back into RTL for actual Urdu text.
 */
// Only the direction — alignment is left to each call site so `text-center`
// and friends keep working.
const LTR = { writingDirection: 'ltr' as const };

export function Display({ className = '', style, ...p }: Props) {
  return <RNText {...p} style={[LTR, style]} className={`font-display-black text-paper ${className}`} />;
}

export function Heading({ className = '', style, ...p }: Props) {
  return <RNText {...p} style={[LTR, style]} className={`font-display text-paper ${className}`} />;
}

export function Txt({ className = '', style, ...p }: Props) {
  return <RNText {...p} style={[LTR, style]} className={`font-body text-paper ${className}`} />;
}

export function Bold({ className = '', style, ...p }: Props) {
  return <RNText {...p} style={[LTR, style]} className={`font-body-bold text-paper ${className}`} />;
}

export function Eyebrow({ className = '', style, ...p }: Props) {
  return (
    <RNText
      {...p}
      style={[LTR, style]}
      className={`font-body-bold uppercase tracking-[2px] text-[11px] ${className}`}
    />
  );
}

export function Urdu({ className = '', style, ...p }: Props) {
  return (
    <RNText
      {...p}
      style={[{ writingDirection: 'rtl', lineHeight: undefined }, style]}
      className={`font-nastaliq-bold text-paper ${className}`}
    />
  );
}

// allow className on base RNText where needed
cssInterop(RNText, { className: 'style' });
