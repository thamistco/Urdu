import { useState } from 'react';
import { View } from 'react-native';
import { Choice, PromptCard, Question, palette } from './common';
import { Urdu, Txt, Eyebrow, urduGlyph, urduLine } from '../components/Text';
import { feedback } from '../lib/feedback';
import { glossOf } from '../data/words';
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
 * The prompt shows the word as one real, correctly-joined line of script —
 * Urdu letters change shape to fuse with their neighbours, so the tiles
 * below (each its own `Choice`, its own isolated glyph) cannot substitute for
 * this the way `wordBuild`'s own doc comment already explains for its
 * assembled row. The tiles exist only so each character has its own tap
 * target; reading the word itself happens above them, joined for real.
 */
export function LetterSpotExercise({ exercise, showRoman, locked, onGraded }: ExerciseProps<SpotEx>) {
  const { letter, word, tiles } = exercise;
  const [picked, setPicked] = useState<number | null>(null);

  const choose = (i: number) => {
    if (picked != null || locked) return;
    feedback.tap();
    setPicked(i);
    const correct = tiles[i] === letter.forms.isolated;
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
          // occurrence is a right answer, not only whichever one the learner
          // happens to tap first.
          const isAnswer = t === letter.forms.isolated;
          const state =
            picked == null ? 'idle' : i === picked ? (isAnswer ? 'correct' : 'wrong') : isAnswer ? 'correct' : 'muted';
          return (
            <Choice key={i} state={state} disabled={picked != null || locked} onPress={() => choose(i)} className="m-1">
              <Urdu style={{ ...urduGlyph(26) }}>{t}</Urdu>
            </Choice>
          );
        })}
      </View>
    </View>
  );
}
