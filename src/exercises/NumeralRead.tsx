import { useState } from 'react';
import { View } from 'react-native';
import { Choice, PromptCard, Question, palette } from './common';
import { Bold, Txt } from '../components/Text';
import { feedback } from '../lib/feedback';
import { reversedOf } from '../lib/numerals';
import type { ExerciseProps, Exercise } from './types';

type NumeralEx = Extract<Exercise, { kind: 'numeralRead' }>;

/**
 * An Urdu-digit number shown → say what it is worth.
 *
 * The one exercise in the course about reading rather than about vocabulary.
 * `types.ts` carries the measurement behind it; what matters here is that the
 * question is the glyphs and nothing else. No transliteration, no gloss, and no
 * Roman-track variant — the digits are the same on both tracks, which is rather
 * the point of them, so this is the one exercise a Roman learner reads in the
 * script and is meant to.
 *
 * The options are Western digits because that is what "what is this worth"
 * takes as an answer: a value, not another spelling of it. Urdu digits on both
 * sides would be a matching game between two forms of one glyph.
 *
 * It is not spoken. Every other exercise offers a way to hear what is on
 * screen, and this one deliberately does not: the recorded voice covers the
 * words the course teaches, and forty-seven is not one of them. A device voice
 * reading "forty-seven" in English would also simply say the answer.
 */
export function NumeralReadExercise({ exercise, locked, onGraded }: ExerciseProps<NumeralEx>) {
  const { glyphs, value, options } = exercise;
  const [picked, setPicked] = useState<number | null>(null);

  const choose = (n: number) => {
    if (picked !== null || locked) return;
    setPicked(n);
    const correct = n === value;
    correct ? feedback.correct() : feedback.incorrect();
    // Nothing enters the spaced-repetition queue: this is not about an item.
    // `itemsOf` in generator.ts says the same thing from the other side.
    onGraded({ items: [], correct });
  };

  return (
    <View>
      <PromptCard height={150}>
        <Txt
          accessibilityLabel={`A number written in Urdu digits: ${[...glyphs].join(' ')}`}
          style={{ fontFamily: 'NotoNastaliq-Bold', color: palette.ink, fontSize: 52, lineHeight: 96 }}
        >
          {glyphs}
        </Txt>
      </PromptCard>
      <View className="h-4" />
      <Question>What number is this?</Question>
      <View className="flex-row flex-wrap justify-between">
        {options.map((o) => {
          const state = picked === null ? 'idle' : o === value ? 'correct' : o === picked ? 'wrong' : 'muted';
          return (
            <Choice
              key={o}
              state={state}
              disabled={picked !== null || locked}
              onPress={() => choose(o)}
              className="mb-3 w-[48%]"
            >
              <Bold className="text-center text-2xl">{o}</Bold>
            </Choice>
          );
        })}
      </View>
      {/* Reading it backwards is the mistake this exercise is built around, so
          when that is the mistake made, it gets named. Any other wrong answer
          is a plain miss and says nothing extra. */}
      {picked !== null && picked === reversedOf(value) && picked !== value && (
        <Txt className="mt-1 text-center text-sm leading-6 text-paper/70">
          Urdu digits run left to right, the same way these do, even though the words around them do not.
        </Txt>
      )}
    </View>
  );
}
