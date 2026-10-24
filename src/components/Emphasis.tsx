import type { ReactNode } from 'react';
import { urduRuns } from '../lib/urduRuns';
import { type } from '../theme';
import { Txt } from './Text';

const STARRED = /\*([^*\n]+)\*/g;

/**
 * Course text marks a stressed word as *this*, the way it was written. It was
 * rendered as typed, so five grammar cards showed literal asterisks around
 * "not", "before", "managed", "object" and "against" (QA report, 2026-10-12).
 * The starred word is set in italics, inside whatever text it sits in.
 */
export function withEmphasis(text: string): ReactNode {
  if (!text.includes('*')) return withUrdu(text, '');
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(STARRED)) {
    out.push(withUrdu(text.slice(last, m.index), `${last}`));
    out.push(
      <Txt key={m.index} style={{ fontStyle: 'italic' }}>
        {withUrdu(m[1], `${m.index}i`)}
      </Txt>
    );
    last = m.index! + m[0].length;
  }
  out.push(withUrdu(text.slice(last), `${last}`));
  return out;
}

/**
 * Urdu inside English prose, set in the app's Nastaliq rather than whatever
 * Arabic font the browser falls back to, which differed by device and showed
 * disjoined on desktop (Q-053). Plain text comes back as it was.
 */
function withUrdu(text: string, key: string): ReactNode {
  const runs = urduRuns(text);
  if (!runs.some((r) => r.urdu)) return text;
  return runs.map((r, i) =>
    r.urdu ? (
      <Txt key={`${key}-${i}`} style={{ fontFamily: type.nastaliq, writingDirection: 'rtl' }}>
        {r.text}
      </Txt>
    ) : (
      r.text
    )
  );
}

/** The same text with the marks dropped, for a screen-reader label. */
export const plainText = (text: string) => text.replace(STARRED, '$1');
