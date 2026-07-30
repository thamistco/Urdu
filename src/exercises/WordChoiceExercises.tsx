import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Choice, PromptCard, Question, palette, withAlpha } from './common';
import { Txt, Bold } from '../components/Text';
import { Lexeme } from '../components/Lexeme';
import { WordArt, Illustration, pictureIdentifies } from '../components/Illustration';
import { feedback } from '../lib/feedback';
import { announce } from '../lib/speech';
import type { ExerciseProps, Exercise } from './types';
import { glossOf } from '../data/words';

type MCEx = Extract<Exercise, { kind: 'multipleChoice' }>;
type MeaningEx = Extract<Exercise, { kind: 'meaningPick' }>;
type ListenEx = Extract<Exercise, { kind: 'listenTap' }>;

/**
 * Picture shown → pick the matching word (translation-free, Drops-style).
 *
 * The picture is the whole question, so it has to be able to carry it. For a
 * pomegranate or a chair it can; for "forgive", "yes" or "big" it cannot, and
 * the same drawing would answer to half a dozen words. Those get the English
 * under the picture — which turns the exercise into meaning → word, still a
 * real question, rather than a riddle with no fair answer.
 */
export function MultipleChoiceExercise({ exercise, track, showRoman, locked, onGraded }: ExerciseProps<MCEx>) {
  const { word, options } = exercise;
  const [picked, setPicked] = useState<string | null>(null);
  const speaks = pictureIdentifies(word);

  const choose = (id: string) => {
    if (picked || locked) return;
    setPicked(id);
    const correct = id === word.id;
    correct ? feedback.correctAnnounceMeaning(word.id, word.urdu, word.roman, word.meaning)
      : feedback.incorrectAnnounce(word.id, word.urdu, word.roman);
    onGraded({ items: [{ id: word.id, type: 'word' }], correct });
  };

  return (
    <View>
      <PromptCard height={speaks ? 150 : 176}>
        <WordArt word={word} size={104} />
        {speaks ? null : (
          <Txt style={{ color: palette.ink }} className="mt-2 text-base capitalize opacity-70">
            {glossOf(word)}
          </Txt>
        )}
      </PromptCard>
      <View className="h-4" />
      <Question>{speaks ? 'Which word is this?' : 'Which word means this?'}</Question>
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
              <Lexeme
                urdu={o.urdu}
                roman={o.roman}
                // Before answering, the transliteration would give the game
                // away on the Script and Both tracks; on the Roman track it is
                // the only thing there is to read, so it always shows.
                track={picked || track === 'roman' ? track : 'script'}
                size={28}
              />
            </Choice>
          );
        })}
      </View>
    </View>
  );
}

/** Urdu word shown → pick the meaning (reverse recall). */
export function MeaningPickExercise({ exercise, track, showRoman, locked, onGraded }: ExerciseProps<MeaningEx>) {
  const { word, options } = exercise;
  const [picked, setPicked] = useState<string | null>(null);

  const choose = (id: string) => {
    if (picked || locked) return;
    setPicked(id);
    const correct = id === word.id;
    correct ? feedback.correctAnnounceMeaning(word.id, word.urdu, word.roman, word.meaning)
      : feedback.incorrectAnnounce(word.id, word.urdu, word.roman);
    onGraded({ items: [{ id: word.id, type: 'word' }], correct });
  };

  // adapt to length — single words render large, phrases scale down to fit
  const len = word.urdu.length;
  const fs = len > 16 ? 26 : len > 9 ? 36 : 56;
  return (
    <View>
      <PromptCard height={len > 9 ? 170 : 150}>
        <Lexeme urdu={word.urdu} roman={word.roman} track={track} size={fs} color={palette.ink} />
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
                <Bold className="text-base capitalize">{glossOf(o)}</Bold>
              </View>
            </Choice>
          );
        })}
      </View>
    </View>
  );
}

/** Hear it (TTS) → pick the matching picture + meaning. */
export function ListenTapExercise({ exercise, showRoman, locked, onGraded }: ExerciseProps<ListenEx>) {
  const { word, options } = exercise;
  const [picked, setPicked] = useState<string | null>(null);

  const choose = (id: string) => {
    if (picked || locked) return;
    setPicked(id);
    const correct = id === word.id;
    correct ? feedback.correctAnnounceMeaning(word.id, word.urdu, word.roman, word.meaning)
      : feedback.incorrectAnnounce(word.id, word.urdu, word.roman);
    onGraded({ items: [{ id: word.id, type: 'word' }], correct });
  };

  return (
    <View>
      <PromptCard height={150}>
        <Pressable
          onPress={() => announce(word.id, word.urdu, word.roman)}
          accessibilityRole="button"
          accessibilityLabel="Play the word again"
          style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.94 : 1 }] })}
        >
          <View
            className="h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: withAlpha(palette.gold, 0.2), borderWidth: 2, borderColor: palette.gold }}
          >
            <Illustration name="speaker" tile={false} size={36} />
          </View>
        </Pressable>
        <Txt style={{ color: palette.ink }} className="mt-3 text-xs opacity-50">
          {/* The transliteration is the answer written out, so it waits until
              the question has been answered; otherwise there is nothing to
              listen for. */}
          Tap to hear{picked && showRoman ? ` · ${word.roman}` : ''}
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
              <Bold className="mt-1 text-sm capitalize">{glossOf(o)}</Bold>
            </Choice>
          );
        })}
      </View>
    </View>
  );
}
