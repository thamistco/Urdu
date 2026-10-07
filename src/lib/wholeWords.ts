import { Platform } from 'react-native';

/**
 * Keep a text column at least as wide as its longest word.
 *
 * react-native-web gives every View `minWidth: 0`, so a `flex-1` column beside
 * a fixed-width sibling shrinks below its own longest word once the reader
 * makes text bigger, and Text (`overflow-wrap: break-word`) then breaks inside
 * the word: the Home headline read "Spea / k" at 1.5x (design review,
 * 2026-10-07). `min-content` puts back the floor CSS has by default; pair it
 * with `flex-wrap` on the row, so that when the words no longer fit beside
 * their neighbour, the neighbour moves to a line of its own instead.
 *
 * Web only: native text never had the zero floor, and `min-content` is not a
 * React Native length.
 */
export const wholeWords: object = Platform.OS === 'web' ? { minWidth: 'min-content' } : {};
