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
    case 'letterSpot':
      // The question is which *tile* of the word holds the letter, and the
      // learner already knew the letter — that was the prompt. Showing them
      // "ا / alif" answered a question they had not asked and left the one
      // they got wrong unanswered. Show the tile instead, with the letter's
      // name for the reading.
      return {
        script: ex.tiles.filter((_, i) => ex.correct[i]).join('   ') || ex.letter.forms.isolated,
        roman: ex.letter.name,
      };
    case 'letterPick':
    case 'letterTrace':
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
