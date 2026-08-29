import { useState } from 'react';
import { View } from 'react-native';
import { Choice, PromptCard, Question, palette } from './common';
import { Urdu, Txt, Eyebrow, urduGlyph, urduLine } from '../components/Text';
import { feedback } from '../lib/feedback';
import { glossOf } from '../data/words';
import { isCorrectTap } from './letterSpotGrading';
import type { ExerciseProps, Exercise } from './types';

type SpotEx = Extract<Exercise, { kind: 'letterSpot' }>;

/**
 * "Can you find it inside a real word?" — URD-045. `letterForm`/`letterPick`/
 * `letterTrace` only ever show a letter alone, and the old context-word
 * sighting (`wordExercise`, `LETTER_CONTEXT_WORD`) asked the ordinary
 * picture/meaning question every other vocabulary word gets, answerable
 * without the learner ever needing to spot the taught letter's shape inside
 * the word showing it. This asks directly.
 *
 * The prompt shows the word as one real, correctly-joined line of script.
 * The tiles below are not isolated glyphs standing in for that — each one
 * (see `letterSpotTiles`, `generator.ts`) already carries its own real
 * neighbouring character(s) from the word itself, so it renders in the exact
 * shape that letter actually takes there: the same reason `WordBuild.tsx`'s
 * own assembled row reads its placed tiles as one run instead of isolated
 * glyphs, not something this component has to reproduce itself. Grading
 * (`isCorrectTap`, `letterSpotGrading.ts`) reads `exercise.correct`, decided
 * once at generation time, not re-derived here from whatever a tile happens
 * to display — a tile can be a multi-character cluster, or a decoy that
 * isn't part of the word at all. Pulled into its own dependency-free module
 * so it has a real unit test — see that file's own doc comment for why this
 * component itself cannot be rendered under this project's test setup.
 */
export function LetterSpotExercise({ exercise, showRoman, locked, onGraded }: ExerciseProps<SpotEx>) {
  const { letter, word, tiles } = exercise;
  const [picked, setPicked] = useState<number | null>(null);

  const choose = (i: number) => {
    if (picked != null || locked) return;
    feedback.tap();
    setPicked(i);
    const correct = isCorrectTap(exercise, i);
    correct
      ? feedback.correctAnnounce(letter.id, letter.forms.isolated, letter.name)
      : feedback.incorrectAnnounce(letter.id, letter.forms.isolated, letter.name);
    onGraded({ items: [{ id: letter.id, type: 'letter' }], correct });
  };

  return (
    <View>
      <Eyebrow style={{ color: palette.gold }} className="mb-2 text-center">
        {letter.name} · sounds like “{letter.sound}”
      </Eyebrow>
      <PromptCard height={150}>
        <Urdu style={{ color: palette.ink, fontSize: 40, lineHeight: urduLine(40) }}>{word.urdu}</Urdu>
        <Txt style={{ color: palette.ink }} className="mt-2 text-sm capitalize opacity-60">
          {glossOf(word)}
          {showRoman ? ` · ${word.roman}` : ''}
        </Txt>
      </PromptCard>
      {/* URD-071: this is the one sighting that shows a real word alongside
       *  the letter — `LetterFormExercise`'s reveal of the same fact never
       *  puts a live example next to it. Shown here too, so the rule and a
       *  real instance of it land on the same screen at least once. */}
      {letter.functionNote && <Txt className="mt-2 text-center text-xs text-paper/55">{letter.functionNote}</Txt>}
      <View className="h-4" />
      <Question>Which tile is {letter.name}?</Question>
      <View className="flex-row-reverse flex-wrap items-center justify-center">
        {tiles.map((t, i) => {
          // A word can hold the taught letter more than once — every
          // occurrence is a right answer, not only whichever one the
          // learner happens to tap first.
          const isAnswer = isCorrectTap(exercise, i);
          const state =
            picked == null ? 'idle' : i === picked ? (isAnswer ? 'correct' : 'wrong') : isAnswer ? 'correct' : 'muted';
          // DESIGN CRITIC: `LETTER_CONTEXT_WORD` has two real multi-word
          // phrases (baRi-he, hamza) — the row is laid out `flex-row-reverse`
          // (tile 0 rightmost, matching Urdu's own reading direction), so a
          // break after tile `i` in reading order sits on the side facing
          // tile `i + 1` — `marginStart` under this app's own (never
          // flipped, see `check:direction`'s doc comment) LTR direction, the
          // same side `marginLeft` would have named, just not pinned there.
          const wordGap = exercise.wordBreakAfter[i] ? 14 : 4;
          return (
            <View key={i} style={{ marginStart: wordGap, marginEnd: 4 }}>
              <Choice
                state={state}
                disabled={picked != null || locked}
                onPress={() => choose(i)}
                // URD-063: no width class at all, before this — a tile
                // measured only whatever a bare 1-3 character glyph cluster
                // plus `Choice`'s own `px-3` padding happened to need,
                // nowhere near a real tap target and, worse, under
                // `scripts/soak.js`'s `b.width > 110` floor for "is this an
                // acted-on-able candidate at all" — so soak found zero
                // candidates on every real `letterSpot` screen and reported
                // the whole lesson unanswerable, not merely mis-graded.
                // `min-w-[116px]` clears that floor with margin, at both
                // soak's fixed 412px viewport and `check:sizes`'s 320px
                // floor: unlike `letterContrast`'s fixed 2-4 option count,
                // this row holds a variable number of tiles (4 to 8 across
                // the real corpus, `LETTER_CONTEXT_WORD`'s longest words),
                // so a percentage-of-row width doesn't apply here the way it
                // does there — a fixed minimum per tile, left free to grow
                // for a wider cluster, and to wrap via the row's own
                // `flex-wrap` rather than needing every tile to share one
                // row, is the right shape for a tile count that isn't fixed.
                className="my-1 min-w-[116px]"
                accessibilityLabel={`Tile ${i + 1} of ${tiles.length}`}
              >
                <Urdu style={{ ...urduGlyph(26) }}>{t}</Urdu>
              </Choice>
            </View>
          );
        })}
      </View>
    </View>
  );
}
