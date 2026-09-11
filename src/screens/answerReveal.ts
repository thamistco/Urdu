import type { Exercise } from '../exercises/types';
import { POSITIONS } from '../data/letters';

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

export function answerReveal(ex: Exercise): AnswerReveal | null {
  switch (ex.kind) {
    case 'letterForm':
      return { label: POSITIONS.find((p) => p.key === ex.position)?.label ?? '' };
    case 'letterPick':
    case 'letterTrace':
    case 'letterSpot':
    case 'letterContrast':
      // A letter's name *is* its reading, so it sits where the Roman goes.
      return { script: ex.letter.forms.isolated, roman: ex.letter.name };
    case 'multipleChoice':
    case 'meaningPick':
    case 'listenTap':
    case 'wordBuild':
    case 'wordFromMeaning':
    case 'typeWord':
      return { script: ex.word.urdu, roman: ex.word.roman, meaning: ex.word.meaning };
    case 'sentenceBuild':
      // A wrong sentence left the learner looking at their own word order,
      // outlined in red, with the correct order nowhere on screen — and on the
      // script track not even the transliteration, since that is held back
      // behind `showRoman`. The English is already the prompt, so repeating it
      // here would only push the part that was actually missing further down.
      return { script: ex.sentence.words.join(' '), roman: ex.sentence.roman };
    default:
      // Everything left grades in place: matching swaps the pair in the tray,
      // and the grammar drill, reading and dialogue questions all light up the
      // right option where it stands (the drill adds its `because` under it).
      // A second copy in this panel would be telling the learner twice.
      return null;
  }
}
