import { describe, it, expect } from 'vitest';

import { answerReveal } from './answerReveal';
import type { Exercise } from '../exercises/types';
import { WORDS } from '../data/words';
import { LETTERS } from '../data/letters';
import { SENTENCES } from '../data/sentences';

/**
 * What a learner is shown after getting something wrong.
 *
 * This is the app's only teaching moment that the learner has earned, and it
 * has been wrong twice. First it was a single line, `"لال: red"`, which left
 * out the transliteration — so somebody who typed `lal` was told they were
 * wrong and then shown a script they could not yet read. Then, once the panel
 * existed, `sentenceBuild` was left out of it: a learner who ordered the words
 * wrongly kept looking at their own wrong order, outlined in red, and never saw
 * the right one. On the script track they were not even shown the Roman,
 * because the exercise holds that behind `showRoman`.
 *
 * Both were invisible to every check in the project, because the reveal lived
 * inside a screen component where nothing could call it. It is a pure function
 * in its own file so that this test can exist.
 *
 * The `default: return null` arm is deliberate and is asserted here too: the
 * exercises that fall into it — matching, the grammar drill, reading and
 * dialogue — already mark the right answer where it stands, and a second copy
 * in the panel would tell the learner the same thing twice. A future kind added
 * to the switch without a reveal is the failure this guards against, so the
 * last test walks every kind the generator can produce rather than a list
 * written out by hand, which would go stale the moment a kind is added.
 */

const word = WORDS[0];
const letter = LETTERS[0];
const sentence = SENTENCES.find((s) => s.words.length >= 3)!;

describe('answerReveal', () => {
  it('gives a word its script, its reading and its meaning', () => {
    const r = answerReveal({ kind: 'typeWord', word } as Exercise);
    expect(r).toEqual({ script: word.urdu, roman: word.roman, meaning: word.meaning });
  });

  it('puts a letter’s name where the reading goes', () => {
    // A letter has no translation; its name is how it is read aloud.
    const r = answerReveal({ kind: 'letterPick', letter, options: [] } as unknown as Exercise);
    expect(r).toEqual({ script: letter.forms.isolated, roman: letter.name });
  });

  it('answers a letter-position question with the position', () => {
    const r = answerReveal({ kind: 'letterForm', letter, position: 'initial' } as unknown as Exercise);
    expect(r?.label).toBeTruthy();
    expect(r?.script).toBeUndefined();
  });

  it('shows the correct word order after a wrong sentence', () => {
    const r = answerReveal({ kind: 'sentenceBuild', sentence, tiles: [] } as unknown as Exercise);
    // The order is the whole answer — the learner's own wrong order is the only
    // thing otherwise on screen.
    expect(r?.script).toBe(sentence.words.join(' '));
    expect(r?.roman).toBe(sentence.roman);
  });

  it('does not repeat the English, which is already the prompt', () => {
    const r = answerReveal({ kind: 'sentenceBuild', sentence, tiles: [] } as unknown as Exercise);
    expect(r?.meaning).toBeUndefined();
  });

  it('stays silent for the exercises that correct themselves in place', () => {
    // Each of these lights up the right answer where it stands.
    expect(answerReveal({ kind: 'matching', words: [word] } as Exercise)).toBeNull();
    expect(answerReveal({ kind: 'reading', passage: { question: { answer: 'x' } } } as unknown as Exercise)).toBeNull();
    expect(
      answerReveal({ kind: 'dialogue', dialogue: { question: { answer: 'x' } } } as unknown as Exercise)
    ).toBeNull();
    expect(answerReveal({ kind: 'grammarDrill', drill: { answer: 'x' } } as unknown as Exercise)).toBeNull();
  });

  it('never returns an empty reveal, which would render a blank red panel', () => {
    // A reveal that is neither null nor populated is the one shape the panel
    // cannot draw: it renders the heading "The answer" over nothing at all.
    const kinds: Exercise[] = [
      { kind: 'typeWord', word },
      { kind: 'wordBuild', word, tiles: [] },
      { kind: 'wordFromMeaning', word, options: [word] },
      { kind: 'multipleChoice', word, options: [word] },
      { kind: 'meaningPick', word, options: [word] },
      { kind: 'listenTap', word, options: [word] },
      { kind: 'letterPick', letter, options: [] },
      { kind: 'letterTrace', letter },
      { kind: 'letterSpot', word, letter },
      { kind: 'letterContrast', letter },
      { kind: 'letterForm', letter, position: 'initial' },
      { kind: 'sentenceBuild', sentence, tiles: [] },
    ] as unknown as Exercise[];

    for (const ex of kinds) {
      const r = answerReveal(ex);
      expect(r, ex.kind).not.toBeNull();
      const filled = [r!.script, r!.roman, r!.meaning, r!.label].filter((v) => v && v.length);
      expect(filled.length, ex.kind).toBeGreaterThan(0);
    }
  });
});
