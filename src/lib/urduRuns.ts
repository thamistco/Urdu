/**
 * English prose with Urdu in it, cut into runs of each.
 *
 * Grammar notes are English with Urdu words inline ("وہ does double duty…").
 * The prose is set in Public Sans, which has no Arabic letters, so each Urdu
 * word fell back to whatever font the browser had: a different face on every
 * device, and on desktop testers saw it disjoined (Q-053). Cutting the Urdu
 * out lets it be set in the app's own Nastaliq, which joins properly
 * everywhere.
 *
 * A run is one or more words of Arabic script, with the spaces, joiner
 * controls and Urdu punctuation between them, so a phrase stays one run and
 * reads right to left as a whole rather than word by word.
 */
const ARABIC = '؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿';
// The joiners are alternatives rather than class members: inside a class the
// linter reads a zero-width joiner as gluing its neighbours into one character.
const RUN = new RegExp(`[${ARABIC}](?:(?:[${ARABIC} ]|\\u200C|\\u200D)*[${ARABIC}])?`, 'g');

export type Run = { text: string; urdu: boolean };

export function urduRuns(text: string): Run[] {
  const out: Run[] = [];
  let last = 0;
  for (const m of text.matchAll(RUN)) {
    if (m.index! > last) out.push({ text: text.slice(last, m.index), urdu: false });
    out.push({ text: m[0], urdu: true });
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), urdu: false });
  return out;
}
