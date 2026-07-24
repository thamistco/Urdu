import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Choice, PromptCard, Question, palette, withAlpha } from './common';
import { Urdu, Txt, Bold } from '../components/Text';
import { WordArt } from '../components/Illustration';
import { feedback } from '../lib/feedback';
import { announce } from '../lib/speech';
import type { ExerciseProps, Exercise } from './types';

type MCEx = Extract<Exercise, { kind: 'multipleChoice' }>;
type MeaningEx = Extract<Exercise, { kind: 'meaningPick' }>;
type ListenEx = Extract<Exercise, { kind: 'listenTap' }>;

/** Emoji shown → pick the matching Urdu word (translation-free, Drops-style). */
export function MultipleChoiceExercise({ exercise, showRoman, locked, onGraded }: ExerciseProps<MCEx>) {
  const { word, options } = exercise;
  const [picked, setPicked] = useState<string | null>(null);

  const choose = (id: string) => {
    if (picked || locked) return;
    setPicked(id);
    const correct = id === word.id;
    correct ? feedback.correctAnnounce(word.id, word.urdu, word.roman) : feedback.incorrect();
    onGraded({ items: [{ id: word.id, type: 'word' }], correct });
  };

  return (
    <View>
      <PromptCard height={150}>
        <WordArt word={word} size={104} />
      </PromptCard>
      <View className="h-4" />
      <Question>Which word is this?</Question>
      <View className="flex-row flex-wrap justify-between">
        {options.map((o) => {
          const state =
            picked == null ? 'idle' : o.id === word.id ? 'correct' : o.id === picked ? 'wrong' : 'muted';
          return (
            <Choice
              key={o.id}
              state={state}
              disabled={picked != null || locked}
              onPress={() => choose(o.id)}
              className="mb-3 w-[48%]"
            >
              <Urdu style={{ fontSize: 34, color: palette.paper, lineHeight: 52 }}>{o.urdu}</Urdu>
              {picked && showRoman ? (
                <Txt className="mt-1 text-xs text-paper/50">{o.roman}</Txt>
              ) : null}
            </Choice>
          );
        })}
      </View>
    </View>
  );
}

/** Urdu word shown → pick the meaning (reverse recall). */
export function MeaningPickExercise({ exercise, showRoman, locked, onGraded }: ExerciseProps<MeaningEx>) {
  const { word, options } = exercise;
  const [picked, setPicked] = useState<string | null>(null);

  const choose = (id: string) => {
    if (picked || locked) return;
    setPicked(id);
    const correct = id === word.id;
    correct ? feedback.correctAnnounce(word.id, word.urdu, word.roman) : feedback.incorrect();
    onGraded({ items: [{ id: word.id, type: 'word' }], correct });
  };

  return (
    <View>
      <PromptCard height={150}>
        <Urdu style={{ fontSize: 60, color: palette.ink, lineHeight: 90 }}>{word.urdu}</Urdu>
        {showRoman ? (
          <Txt style={{ color: palette.ink }} className="mt-1 text-sm opacity-55">
            {word.roman}
          </Txt>
        ) : null}
      </PromptCard>
      <View className="h-4" />
      <Question>What does it mean?</Question>
      <View className="gap-3">
        {options.map((o) => {
          const state =
            picked == null ? 'idle' : o.id === word.id ? 'correct' : o.id === picked ? 'wrong' : 'muted';
          return (
            <Choice
              key={o.id}
              state={state}
              disabled={picked != null || locked}
              onPress={() => choose(o.id)}
            >
              <View className="flex-row items-center gap-3">
                <WordArt word={o} size={38} />
                <Bold className="text-base capitalize">{o.meaning}</Bold>
              </View>
            </Choice>
          );
        })}
      </View>
    </View>
  );
}

/** Hear it (TTS) → pick the matching emoji + meaning. */
export function ListenTapExercise({ exercise, showRoman, locked, onGraded }: ExerciseProps<ListenEx>) {
  const { word, options } = exercise;
  const [picked, setPicked] = useState<string | null>(null);

  const choose = (id: string) => {
    if (picked || locked) return;
    setPicked(id);
    const correct = id === word.id;
    correct ? feedback.correctAnnounce(word.id, word.urdu, word.roman) : feedback.incorrect();
    onGraded({ items: [{ id: word.id, type: 'word' }], correct });
  };

  return (
    <View>
      <PromptCard height={150}>
        <Pressable
          onPress={() => announce(word.id, word.urdu, word.roman)}
          style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.94 : 1 }] })}
        >
          <View
            className="h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: withAlpha(palette.gold, 0.2), borderWidth: 2, borderColor: palette.gold }}
          >
            <Txt style={{ fontSize: 34 }}>🔊</Txt>
          </View>
        </Pressable>
        <Txt style={{ color: palette.ink }} className="mt-3 text-xs opacity-50">
          Tap to hear{showRoman ? ` · ${word.roman}` : ''}
        </Txt>
      </PromptCard>
      <View className="h-4" />
      <Question>Which one did you hear?</Question>
      <View className="flex-row flex-wrap justify-between">
        {options.map((o) => {
          const state =
            picked == null ? 'idle' : o.id === word.id ? 'correct' : o.id === picked ? 'wrong' : 'muted';
          return (
            <Choice
              key={o.id}
              state={state}
              disabled={picked != null || locked}
              onPress={() => choose(o.id)}
              className="mb-3 w-[48%]"
            >
              <WordArt word={o} size={52} />
              <Bold className="mt-1 text-sm capitalize">{o.meaning}</Bold>
            </Choice>
          );
        })}
      </View>
    </View>
  );
}
