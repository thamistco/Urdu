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

/**
 * A right-to-left mark. Urdu strings that *start* with a neutral character —
 * the `___` of a gap-fill, a digit, an opening bracket — would otherwise take
 * their direction from the surrounding paragraph and land on the left of the
 * line, i.e. at the end of the sentence instead of the start. Leading with an
 * RLM anchors those neutrals to the RTL run so the blank sits where the missing
 * word actually goes. It renders as nothing, and works on native and web alike,
 * unlike `writingDirection`, which react-native-web ignores.
 */
const RLM = '‏';

export function Urdu({ className = '', style, children, ...p }: Props) {
  return (
    <RNText
      {...p}
      style={[{ writingDirection: 'rtl', lineHeight: undefined }, style]}
      className={`font-nastaliq-bold text-paper ${className}`}
    >
      {typeof children === 'string' ? RLM + children : children}
    </RNText>
  );
}

// allow className on base RNText where needed
cssInterop(RNText, { className: 'style' });
