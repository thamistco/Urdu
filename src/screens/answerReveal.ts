import type { Exercise } from '../exercises/types';
import { POSITIONS } from '../data/letters';
import { glossOf } from '../data/words';
import { sentenceText } from '../data/sentences';
import { plainRoman } from '../lib/roman';

/**
 * What to show a learner who just got it wrong.
 *
 * This used to be one string, `"لال: red"`, set in the smallest type on the
 * screen next to the encouragement. It was missing the transliteration
 * entirely, which is the one part a learner answering in Roman needs most: they
 * typed `lal`, were told they were wrong, and were then shown a script they may
 * not read and a translation they already knew. The word they actually got
 * wrong was never on screen.
 *
 * Returned in parts rather than joined, so the reveal can set the script at a
 * readable size with the Roman under it, the way `Lexeme` renders a word
 * everywhere else, instead of running all three together after a colon.
 *
 * `label` is for the answers that are neither a word nor a letter. A letter's
 * *position* is "initial", and there is nothing to transliterate.
 */
export type AnswerReveal = { script?: string; roman?: string; meaning?: string; label?: string };

const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];

export function answerReveal(ex: Exercise): AnswerReveal | null {
  switch (ex.kind) {
    case 'letterForm':
      return { label: POSITIONS.find((p) => p.key === ex.position)?.label ?? '' };
    case 'letterSpot': {
      // The question is which *tile* of the word holds the letter, and the
      // learner already knew the letter — that was the prompt. Showing them
      // "ا / alif" answered a question they had not asked. Showing the tile
      // did no better: a tile is the letter with its neighbours, so alif in
      // پانی came back as "پان", which reads as another word (paan) (QA,
      // 2026-10-24, Q-101). The word, and which tile it was; the row above
      // already marks that tile.
      const at = ex.correct.indexOf(true);
      return {
        script: ex.word.urdu,
        roman: ex.word.roman,
        meaning:
          at < 0
            ? ex.letter.name
            : `${ex.letter.name} is the ${ORDINALS[at] ?? `number ${at + 1}`} tile from the right`,
      };
    }
    case 'letterTrace':
      // Nothing to reveal: the shape is already on the pad, drawn in grey
      // under the learner's line, and the pad says what was missed. A card
      // showing ـت again under "The answer" read as a correction to a
      // question that had none (design review, 2026-10-23).
      return null;
    case 'letterPick':
      // Show the form that was actually asked about. Every option on a
      // `letterPick` renders at one position — often a joined one — so
      // revealing the isolated glyph answered with a different-looking shape
      // than any on screen: a beginner who cannot yet map ـپـ to پ reads that
      // as a new puzzle rather than a correction.
      return { script: ex.letter.forms[ex.position] ?? ex.letter.forms.isolated, roman: ex.letter.name };
    case 'letterContrast':
      // No position here: the options are whole letters, shown isolated.
      return { script: ex.letter.forms.isolated, roman: ex.letter.name };
    case 'multipleChoice':
    case 'meaningPick':
    case 'listenTap':
    case 'wordBuild':
    case 'wordFromMeaning':
    case 'typeWord':
      // glossOf, as every other screen shows it: the raw field is lower case
      // and drops the register, so "Wife (polite)" was revealed as "wife"
      // (QA report v3, L18).
      return { script: ex.word.urdu, roman: ex.word.roman, meaning: glossOf(ex.word) };
    case 'sentenceBuild':
      // A wrong sentence left the learner looking at their own word order,
      // outlined in red, with the correct order nowhere on screen — and on the
      // script track not even the transliteration, since that is held back
      // behind `showRoman`. The English is already the prompt, so repeating it
      // here would only push the part that was actually missing further down.
      return { script: sentenceText(ex.sentence), roman: ex.sentence.roman };
    default:
      // Everything left grades in place: matching swaps the pair in the tray,
      // and the grammar drill, reading and dialogue questions all light up the
      // right option where it stands (the drill adds its `because` under it).
      // A second copy in this panel would be telling the learner twice.
      return null;
  }
}

/**
 * The banner's verdict, as one sentence for a screen reader.
 *
 * The banner said right or wrong only on screen: nothing announced it, and
 * after a tap the tile that had focus was disabled, so focus fell to the page
 * and a screen-reader user heard nothing at all (design review, 2026-10-19).
 * This is what an always-present live region reads instead. It follows the
 * banner: the Roman on every track but `script`, which promises none.
 */
export function spokenVerdict(correct: boolean, reveal: AnswerReveal | null, track: string): string {
  if (correct) return 'Beautifully done.';
  if (!reveal) return 'Not quite, but that’s okay.';
  const said = reveal.label ?? (track !== 'script' && reveal.roman ? plainRoman(reveal.roman) : reveal.script);
  const answer = [said, reveal.meaning].filter(Boolean).join(', ');
  return answer ? `Not quite. The answer: ${answer}.` : 'Not quite, but that’s okay.';
}
