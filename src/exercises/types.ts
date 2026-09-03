import { Letter, PositionKey } from '../data/letters';
import { Word } from '../data/words';
import type { GrammarConcept, GrammarDrill } from '../data/grammar';
import type { Sentence, Passage, Dialogue } from '../data/sentences';
import type { LearnTrack } from '../store/useSettingsStore';

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
      /**
       * Every option (the answer and every distractor alike) renders at
       * this position, not always `isolated` — see the generator's own
       * comment on `nextPos`/URD-060 for why: this was the one
       * position-eligible letter-teaching kind that never actually
       * showed a position, wasting a step of the 4-form cycle every time
       * it was drawn. All options share one position rather than each
       * showing its own so the correct option is never visually distinct
       * from the distractors on that axis alone — a joining stroke only
       * one tile carries would answer the question before the learner
       * reads a single glyph.
       */
      position: PositionKey;
      /** pick the correct glyph from letters, all shown at `position` */
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
      /** draw the letter in one of its four forms, over a faint model */
      kind: 'letterTrace';
      letter: Letter;
      position: PositionKey;
    }
  | {
      /**
       * URD-047: pose a letter directly against the ones it is actually
       * confusable with — its whole `confusableWith` bucket, nothing else —
       * and ask which is which.
       *
       * `options` is 2 to 4 letters, deliberately not padded to
       * `OPTIONS_PER_QUESTION`. See `letterContrastExercise`'s doc comment
       * (`generator.ts`) for why padding this particular question with
       * non-confusable letters would measure stricter while testing less.
       */
      kind: 'letterContrast';
      letter: Letter;
      options: Letter[];
    }
  | {
      /** show the letter inside a real word; tap which tile of the word it is */
      kind: 'letterSpot';
      letter: Letter;
      word: Word;
      /**
       * One button per tappable tile, in display order. A tile whose
       * `fromWord` flag is true shows one of the word's own characters,
       * wrapped with its real neighbouring character(s) — so the OS's own
       * Arabic/Nastaliq shaping renders it in the true joined form it takes
       * in that word, not a synthesized isolated glyph standing in for it.
       * `fromWord: false` entries are decoys, added only when the word is
       * too short to give a genuine multiple-choice floor
       * (`letterSpotTiles`'s own doc comment, `generator.ts`) — spliced in
       * without disturbing the real tiles' own relative reading order.
       */
      tiles: string[];
      /** Parallel to `tiles`. */
      fromWord: boolean[];
      /** Parallel to `tiles`: whether tapping this index is the right
       *  answer — decided at generation time against the word's own
       *  characters, before any decoy padding, so the component never has
       *  to re-derive which of several multi-character display strings
       *  represents the taught letter. */
      correct: boolean[];
      /** Parallel to `tiles`: whether a real space in the word follows this
       *  tile — `LETTER_CONTEXT_WORD` includes two genuine multi-word
       *  phrases, and the prompt above shows their real spaces, so the tile
       *  row renders a wider gap at the same point rather than silently
       *  flattening two or three words into one undifferentiated run. */
      wordBreakAfter: boolean[];
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
      /** the drill's options transliterated, in order — see sentenceBuild */
      romanOptions?: string[];
    }
  | {
      /** assemble a sentence from shuffled word tiles */
      kind: 'sentenceBuild';
      sentence: Sentence;
      tiles: string[];
      /**
       * The same tiles transliterated, in the same order, for the Roman track.
       * Resolved when the exercise is built rather than when it is drawn, so a
       * sentence whose tiles cannot all be romanised is simply never offered on
       * that track instead of rendering a half-Roman tray.
       */
      romanTiles?: string[];
    }
  | {
      /** read a short passage, then answer a comprehension question */
      kind: 'reading';
      passage: Passage;
    }
  | {
      /** read a two-speaker exchange, then answer about what was meant */
      kind: 'dialogue';
      dialogue: Dialogue;
    };

export type ExerciseKind = Exercise['kind'];

export type ExerciseProps<E extends Exercise = Exercise> = {
  exercise: E;
  /**
   * Which of the two writing systems the learner reads. Every exercise that
   * displays Urdu consults this rather than deciding for itself, so the setting
   * means the same thing everywhere.
   */
  track: LearnTrack;
  /** `track !== 'script'` — kept as its own prop because a few places offer the
   *  transliteration as a hint independently of what is being read. */
  showRoman: boolean;
  locked: boolean;
  onGraded: (result: GradedResult) => void;
  /**
   * "I just made myself taller — bring the bottom of me into view."
   *
   * An exercise that reveals content on a tap pushes its own next button below
   * the fold, and a button the learner cannot see is a lesson that looks stuck.
   * The grammar card hit this the moment it started revealing its table on
   * demand. The exercise cannot scroll the lesson itself — it is inside the
   * lesson's ScrollView, not in charge of it — so it asks.
   */
  onExpand?: () => void;
};
