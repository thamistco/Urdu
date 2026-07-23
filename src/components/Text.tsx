import { Text as RNText, TextProps } from 'react-native';
import { cssInterop } from 'nativewind';

/**
 * Typography wrappers so screens don't repeat font classes.
 *   Display  — Fraunces, warm serif for headings/numbers.
 *   Txt/Body — Public Sans, clean and legible for everything else.
 *   Urdu     — Noto Nastaliq Urdu, RTL, generous line-height (the script needs air).
 */

type Props = TextProps & { className?: string };

export function Display({ className = '', ...p }: Props) {
  return <RNText {...p} className={`font-display-black text-paper ${className}`} />;
}

export function Heading({ className = '', ...p }: Props) {
  return <RNText {...p} className={`font-display text-paper ${className}`} />;
}

export function Txt({ className = '', ...p }: Props) {
  return <RNText {...p} className={`font-body text-paper ${className}`} />;
}

export function Bold({ className = '', ...p }: Props) {
  return <RNText {...p} className={`font-body-bold text-paper ${className}`} />;
}

export function Eyebrow({ className = '', ...p }: Props) {
  return (
    <RNText
      {...p}
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
