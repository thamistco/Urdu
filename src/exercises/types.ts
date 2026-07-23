import { Letter, PositionKey } from '../data/letters';
import { Word } from '../data/words';

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
      kind: 'wordBuild';
      word: Word;
      /** scrambled letter tiles to assemble the script */
      tiles: string[];
    }
  | {
      kind: 'matching';
      words: Word[];
    };

export type ExerciseKind = Exercise['kind'];

export type ExerciseProps<E extends Exercise = Exercise> = {
  exercise: E;
  showRoman: boolean;
  locked: boolean;
  onGraded: (result: GradedResult) => void;
};
