import { useState } from 'react';
import { View } from 'react-native';
import { Choice, PromptCard, Question, palette, withAlpha } from './common';
import { Urdu, Txt, Bold, Eyebrow, urduGlyph } from '../components/Text';
import { POSITIONS, PositionKey } from '../data/letters';
import { feedback } from '../lib/feedback';
import type { ExerciseProps, Exercise } from './types';

type FormEx = Extract<Exercise, { kind: 'letterForm' }>;
type PickEx = Extract<Exercise, { kind: 'letterPick' }>;
type ContrastEx = Extract<Exercise, { kind: 'letterContrast' }>;

/** "Where does this letter sit?" — the app's core position-form skill. */
export function LetterFormExercise({ exercise, locked, onGraded }: ExerciseProps<FormEx>) {
  const { letter, position } = exercise;
  const [picked, setPicked] = useState<PositionKey | null>(null);

  const choose = (key: PositionKey) => {
    if (picked || locked) return;
    setPicked(key);
    const correct = key === position;
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
      <PromptCard height={200}>
        <Urdu style={{ color: palette.ink, ...urduGlyph(66) }}>{letter.forms[position]}</Urdu>
      </PromptCard>
      <View className="h-4" />
      <Question>Which position is this letter showing?</Question>
      <View className="flex-row flex-wrap justify-between">
        {POSITIONS.map((p) => {
          const state = picked == null ? 'idle' : p.key === position ? 'correct' : p.key === picked ? 'wrong' : 'muted';
          return (
            <Choice
              key={p.key}
              state={state}
              disabled={picked != null || locked}
              onPress={() => choose(p.key)}
              className="mb-3 w-[48%]"
            >
              <Bold className="text-base">{p.label}</Bold>
              <Txt className="mt-1 text-xs text-paper/55">{p.hint}</Txt>
            </Choice>
          );
        })}
      </View>
    </View>
  );
}

/**
 * "These two look alike — which one is X?" — URD-047.
 *
 * The options are the letter's own `confusableWith` bucket and nothing else,
 * so every wrong answer is a letter the learner might genuinely mistake this
 * one for, rather than a letter they can rule out on sight. That is the whole
 * exercise: `letterPick`'s distractors are drawn from the alphabet at large
 * and are mostly easy, which tests recognition but never discrimination.
 *
 * Prompted by name rather than sound — see `letterContrastExercise`
 * (`generator.ts`) for why sound cannot carry this question for one real
 * bucket. The distinguishing mark is revealed only *after* answering, from
 * the letter's own curated `note` ("Daal with one dot above", "Re with three
 * dots"): showing it up front would answer the question, and withholding it
 * entirely would leave a learner who guessed wrong knowing only that they
 * were wrong, which is the moment the explanation is worth most.
 */
export function LetterContrastExercise({ exercise, locked, onGraded }: ExerciseProps<ContrastEx>) {
  const { letter, options } = exercise;
  const [picked, setPicked] = useState<string | null>(null);

  const choose = (id: string) => {
    if (picked || locked) return;
    setPicked(id);
    const correct = id === letter.id;
    correct
      ? feedback.correctAnnounce(letter.id, letter.forms.isolated, letter.name)
      : feedback.incorrectAnnounce(letter.id, letter.forms.isolated, letter.name);
    onGraded({ items: [{ id: letter.id, type: 'letter' }], correct });
  };

  return (
    <View>
      <Eyebrow style={{ color: palette.gold }} className="mb-2 text-center">
        These look alike
      </Eyebrow>
      <PromptCard height={150}>
        <Bold style={{ color: palette.ink }} className="text-3xl">
          {letter.name}
        </Bold>
        <Txt style={{ color: palette.ink }} className="mt-2 text-base opacity-60">
          sounds like “{letter.sound}”
        </Txt>
      </PromptCard>
      <View className="h-4" />
      <Question>Which one is {letter.name}?</Question>
      <View className="flex-row flex-wrap justify-center">
        {options.map((o) => {
          const state = picked == null ? 'idle' : o.id === letter.id ? 'correct' : o.id === picked ? 'wrong' : 'muted';
          // Width by option count, so no bucket size leaves an orphan tile
          // alone on a final row. A bucket is 2, 3 or 4 letters: two and four
          // lay out as full rows at 44%, but three at 44% wraps 2 + 1, which
          // is the exact "orphan sitting alone on a row, which looks like a
          // mistake" that `OPTIONS_PER_QUESTION`'s own doc comment gives as
          // the reason this app asks four-option questions and not five.
          // Three across is a full row instead. The exact numbers are
          // measured at 320px, the narrowest size `check:sizes` holds the app
          // to, and they are tight: 30% with the usual `m-1.5` came to just
          // over the content width there and wrapped anyway, which is how
          // this comment came to have numbers in it at all.
          const width = options.length === 3 ? 'm-1 w-[29%]' : 'm-1.5 w-[44%]';
          return (
            <Choice
              key={o.id}
              state={state}
              disabled={picked != null || locked}
              onPress={() => choose(o.id)}
              className={width}
              accessibilityLabel={`Letter option ${options.indexOf(o) + 1} of ${options.length}`}
            >
              <Urdu style={{ color: palette.paper, ...urduGlyph(40) }}>{o.forms.isolated}</Urdu>
            </Choice>
          );
        })}
      </View>
      {picked != null && (
        <View className="mt-2 rounded-2xl px-4 py-3" style={{ backgroundColor: withAlpha(palette.gold, 0.12) }}>
          <Txt className="text-center text-sm text-paper/80">{letter.note}</Txt>
        </View>
      )}
    </View>
  );
}

/** "Which letter makes this sound?" — pick the glyph. */
export function LetterPickExercise({ exercise, locked, onGraded }: ExerciseProps<PickEx>) {
  const { letter, options } = exercise;
  const [picked, setPicked] = useState<string | null>(null);

  const choose = (id: string) => {
    if (picked || locked) return;
    setPicked(id);
    const correct = id === letter.id;
    correct
      ? feedback.correctAnnounce(letter.id, letter.forms.isolated, letter.name)
      : feedback.incorrectAnnounce(letter.id, letter.forms.isolated, letter.name);
    onGraded({ items: [{ id: letter.id, type: 'letter' }], correct });
  };

  return (
    <View>
      <PromptCard height={150}>
        <Bold style={{ color: palette.ink }} className="text-3xl">
          “{letter.sound}”
        </Bold>
        <Txt style={{ color: palette.ink }} className="mt-2 text-base opacity-60">
          {letter.name}
        </Txt>
      </PromptCard>
      <View className="h-4" />
      <Question>Which letter is this?</Question>
      <View className="flex-row flex-wrap justify-between">
        {options.map((o) => {
          const state = picked == null ? 'idle' : o.id === letter.id ? 'correct' : o.id === picked ? 'wrong' : 'muted';
          return (
            <Choice
              key={o.id}
              state={state}
              disabled={picked != null || locked}
              onPress={() => choose(o.id)}
              className="mb-3 w-[48%]"
            >
              <Urdu style={{ color: palette.paper, ...urduGlyph(32) }}>{o.forms.isolated}</Urdu>
            </Choice>
          );
        })}
      </View>
    </View>
  );
}
