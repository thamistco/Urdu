import { useState } from 'react';
import { View } from 'react-native';
import { Choice, PromptCard, Question, palette } from './common';
import { Urdu, Txt, Bold, Eyebrow, urduGlyph } from '../components/Text';
import { POSITIONS, PositionKey } from '../data/letters';
import { feedback } from '../lib/feedback';
import type { ExerciseProps, Exercise } from './types';

type FormEx = Extract<Exercise, { kind: 'letterForm' }>;
type PickEx = Extract<Exercise, { kind: 'letterPick' }>;

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
