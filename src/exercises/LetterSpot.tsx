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
            <Choice
              key={i}
              state={state}
              disabled={picked != null || locked}
              onPress={() => choose(i)}
              className="my-1"
              style={{ marginStart: wordGap, marginEnd: 4 }}
              accessibilityLabel={`Tile ${i + 1} of ${tiles.length}`}
            >
              <Urdu style={{ ...urduGlyph(26) }}>{t}</Urdu>
            </Choice>
          );
        })}
      </View>
    </View>
  );
}
