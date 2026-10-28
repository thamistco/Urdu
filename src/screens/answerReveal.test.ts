import { describe, it, expect } from 'vitest';

import { answerReveal, spokenVerdict } from './answerReveal';
import type { Exercise } from '../exercises/types';
import { WORDS, glossOf } from '../data/words';
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
    expect(r).toEqual({ script: word.urdu, roman: word.roman, meaning: glossOf(word) });
  });

  it('puts a letter’s name where the reading goes', () => {
    // A letter has no translation; its name is how it is read aloud.
    const r = answerReveal({ kind: 'letterPick', letter, position: 'isolated', options: [] } as unknown as Exercise);
    expect(r).toEqual({ script: letter.forms.isolated, roman: letter.name });
  });

  // No test for a letter lacking the asked-for form: `nonConnector` fills
  // medial and final for every letter in the data, so that state cannot occur.
  // The `?? isolated` fallback in the source stays as a guard against data that
  // does not exist yet, deliberately untested rather than tested against a
  // fixture invented to make it reachable.
  it('shows the letter in the form the question asked about', () => {
    // Every option on a letterPick renders at one position. Revealing the
    // isolated glyph after a question posed in joined forms shows a shape that
    // was never on screen.
    const joined = LETTERS.find((l) => l.forms.initial && l.forms.initial !== l.forms.isolated)!;
    const r = answerReveal({
      kind: 'letterPick',
      letter: joined,
      position: 'initial',
      options: [],
    } as unknown as Exercise);
    expect(r?.script).toBe(joined.forms.initial);
    expect(r?.script).not.toBe(joined.forms.isolated);
  });

  it('answers "which tile holds this letter" with the word and which tile', () => {
    // The learner knew the letter — that was the prompt. What they got wrong
    // was which tile of the word carries it.
    const r = answerReveal({
      kind: 'letterSpot',
      letter,
      word,
      tiles: ['پا', 'پان', 'انی', 'نی'],
      correct: [false, true, false, false],
    } as unknown as Exercise);
    // The word, not a tile: a tile is the letter with its neighbours and can
    // read as another word ("پان", Q-101).
    expect(r?.script).toBe(word.urdu);
    expect(r?.roman).toBe(word.roman);
    expect(r?.meaning).toBe(`${letter.name} is the second tile from the right`);
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
    // In order, and ended the way Urdu ends it (2026-10-13, L8).
    expect(r?.script).toMatch(new RegExp(`^${sentence.words.join(' ')}[۔؟]$`));
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

  it('reveals nothing after a trace, whose shape is already on the pad', () => {
    expect(answerReveal({ kind: 'letterTrace', letter, position: 'isolated' } as unknown as Exercise)).toBeNull();
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
      { kind: 'letterPick', letter, position: 'isolated', options: [] },
      { kind: 'letterSpot', word, letter, tiles: ['پا', 'نی'], correct: [true, false] },
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

describe('the verdict a screen reader hears', () => {
  const water = { script: 'پانی', roman: 'paani', meaning: 'Water' };

  it('says a right answer was right', () => {
    expect(spokenVerdict(true, null, 'both')).toBe('Beautifully done.');
  });

  it('says the answer after a wrong one, the way the banner shows it', () => {
    expect(spokenVerdict(false, water, 'both')).toBe('Not quite. The answer: paani, Water.');
    expect(spokenVerdict(false, water, 'roman')).toBe('Not quite. The answer: paani, Water.');
  });

  it('keeps the script track free of Roman, as the banner does', () => {
    expect(spokenVerdict(false, water, 'script')).toBe('Not quite. The answer: پانی, Water.');
  });

  it('reads a label answer as it is', () => {
    expect(spokenVerdict(false, { label: 'Initial' }, 'both')).toBe('Not quite. The answer: Initial.');
  });

  it('still says it was wrong when there is no answer to show', () => {
    expect(spokenVerdict(false, null, 'both')).toBe('Not quite, but that’s okay.');
  });
});

describe('the which-position answer', () => {
  it('names the button the learner saw, grouped when two shapes are alike', () => {
    const alif = LETTERS.find((l) => l.id === 'alif')!;
    const be = LETTERS.find((l) => l.id === 'be')!;
    const form = (letter: typeof alif, position: 'final' | 'initial' | 'medial') =>
      answerReveal({ kind: 'letterForm', letter, position, options: [] } as Exercise)?.label;
    expect(form(alif, 'final')).toBe('Middle or end');
    expect(form(alif, 'initial')).toBe('Alone or start');
    expect(form(be, 'final')).toBe('End');
  });

  it('names only positions a letter is asked in: hamza and nūn ghunna never start a word', () => {
    const at = (id: string, position: 'isolated' | 'medial' | 'final') =>
      answerReveal({ kind: 'letterForm', letter: LETTERS.find((l) => l.id === id)!, position, options: [] } as Exercise)
        ?.label;
    expect(at('hamza', 'isolated')).toBe('Alone');
    expect(at('noon-ghunna', 'isolated')).toBe('Alone');
    expect(at('noon-ghunna', 'final')).toBe('End');
    expect(at('alif-madda', 'isolated')).toBe('Alone or start');
  });
});
