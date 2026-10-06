/**
 * Grow a control's tap area by `n` on every side without moving it: padding
 * makes the box bigger, the matching negative margin gives the space back to
 * the layout.
 *
 * This is what `hitSlop` was meant to do, and on the web it does nothing:
 * react-native-web's Pressable ignores the prop, and the web is where Qaaf
 * ships today. Measured on the built site (daily review 2026-10-07), the
 * lesson's close button was a 20x32 target and Say it back's microphone 24x24,
 * both under hitSlops written to make them 44.
 */
export function reach(n: number) {
  return { padding: n, margin: -n } as const;
}
