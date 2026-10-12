import type { ReactNode } from 'react';
import { Txt } from './Text';

const STARRED = /\*([^*\n]+)\*/g;

/**
 * Course text marks a stressed word as *this*, the way it was written. It was
 * rendered as typed, so five grammar cards showed literal asterisks around
 * "not", "before", "managed", "object" and "against" (QA report, 2026-10-12).
 * The starred word is set in italics, inside whatever text it sits in.
 */
export function withEmphasis(text: string): ReactNode {
  if (!text.includes('*')) return text;
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(STARRED)) {
    out.push(text.slice(last, m.index));
    out.push(
      <Txt key={m.index} style={{ fontStyle: 'italic' }}>
        {m[1]}
      </Txt>
    );
    last = m.index! + m[0].length;
  }
  out.push(text.slice(last));
  return out;
}

/** The same text with the marks dropped, for a screen-reader label. */
export const plainText = (text: string) => text.replace(STARRED, '$1');
