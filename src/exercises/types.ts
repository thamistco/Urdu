import { Letter, PositionKey } from '../data/letters';
import { Word } from '../data/words';
import type { GrammarConcept, GrammarDrill } from '../data/grammar';
import type { Sentence, Passage } from '../data/sentences';

export type ItemRef = { id: string; type: 'letter' | 'word' };

/** Result of a single graded exercise, fed back into SRS + stats. */
export type GradedResult = { items: ItemRef[]; correct: boolean };

export type Exercise =
  | {
      kind: 'letterForm';
      letter: Letter;
      position: PositionKey;
      /** ask for the position of the shown glyph */
      options: PositionKey[];
    }
  | {
      kind: 'letterPick';
      letter: Letter;
      /** pick the correct isolated glyph from letters */
      options: Letter[];
    }
  | {
      kind: 'multipleChoice';
      word: Word;
      /** show emoji, pick the matching Urdu word */
      options: Word[];
    }
  | {
      kind: 'meaningPick';
      word: Word;
      /** show Urdu word, pick the meaning */
      options: Word[];
    }
  | {
      kind: 'listenTap';
      word: Word;
      /** hear it, pick the matching emoji/meaning */
      options: Word[];
    }
  | {
      /** show the meaning, pick the Urdu — the harder direction */
      kind: 'wordFromMeaning';
      word: Word;
      options: Word[];
    }
  | {
      /** show the meaning, type the word from memory — the only free recall */
      kind: 'typeWord';
      word: Word;
    }
  | {
      kind: 'wordBuild';
      word: Word;
      /** scrambled letter tiles to assemble the script */
      tiles: string[];
    }
  | {
      kind: 'matching';
      words: Word[];
    }
  | {
      /** teaching card — explanation, table and examples, then "got it" */
      kind: 'grammarTeach';
      concept: GrammarConcept;
    }
  | {
      /** fill the gap in a sentence with the right form */
      kind: 'grammarDrill';
      concept: GrammarConcept;
      drill: GrammarDrill;
    }
  | {
      /** assemble a sentence from shuffled word tiles */
      kind: 'sentenceBuild';
      sentence: Sentence;
      tiles: string[];
    }
  | {
      /** read a short passage, then answer a comprehension question */
      kind: 'reading';
      passage: Passage;
    };

export type ExerciseKind = Exercise['kind'];

export type ExerciseProps<E extends Exercise = Exercise> = {
  exercise: E;
  showRoman: boolean;
  locked: boolean;
  onGraded: (result: GradedResult) => void;
};
