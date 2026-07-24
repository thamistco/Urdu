import { useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { PromptCard, Question, palette, withAlpha } from './common';
import { Urdu, Txt, Bold } from '../components/Text';
import { WordArt } from '../components/Illustration';
import { Button } from '../components/Button';
import { feedback } from '../lib/feedback';
import type { ExerciseProps, Exercise } from './types';

type BuildEx = Extract<Exercise, { kind: 'wordBuild' }>;

/**
 * Build the Urdu word from scrambled letter tiles. Kinesthetic reinforcement —
 * the learner assembles the script right-to-left, feeling how letters sequence.
 * Note: tiles show isolated glyphs; the target is a left-to-right code-point
 * match of the assembled string against the word.
 */
export function WordBuildExercise({ exercise, showRoman, locked, onGraded }: ExerciseProps<BuildEx>) {
  const { word, tiles } = exercise;
  const target = useMemo(() => Array.from(word.urdu).filter((c) => c.trim().length > 0), [word]);
  const [placed, setPlaced] = useState<number[]>([]); // indices into tiles
  const [graded, setGraded] = useState<boolean | null>(null);

  const available = tiles.map((_, i) => i).filter((i) => !placed.includes(i));

  const place = (i: number) => {
    if (graded != null || locked) return;
    feedback.tap();
    setPlaced((p) => [...p, i]);
  };
  const unplace = (i: number) => {
    if (graded != null || locked) return;
    feedback.tap();
    setPlaced((p) => p.filter((x) => x !== i));
  };

  const check = () => {
    const built = placed.map((i) => tiles[i]).join('');
    const correct = built === target.join('');
    setGraded(correct);
    correct ? feedback.correct() : feedback.incorrect();
    onGraded({ items: [{ id: word.id, type: 'word' }], correct });
  };

  const assembled = placed.map((i) => tiles[i]).join('');

  return (
    <View>
      <PromptCard height={140}>
        <WordArt word={word} size={80} />
        <Txt style={{ color: palette.ink }} className="mt-2 text-sm opacity-60 capitalize">
          {word.meaning}
          {showRoman ? ` · ${word.roman}` : ''}
        </Txt>
      </PromptCard>

      <View className="h-4" />
      <Question>Build the word</Question>

      {/* assembly line (RTL) */}
      <View
        className="mb-5 min-h-[70px] flex-row-reverse flex-wrap items-center justify-center rounded-2xl border-2 border-dashed px-3 py-3"
        style={{
          borderColor:
            graded == null ? withAlpha(palette.paper, 0.25) : graded ? palette.jade : palette.rose,
        }}
      >
        {placed.length === 0 ? (
          <Txt className="text-sm text-paper/30">Tap letters below…</Txt>
        ) : (
          placed.map((i, order) => (
            <Pressable key={`${i}-${order}`} onPress={() => unplace(i)}>
              <View
                className="mx-1 my-1 rounded-xl px-3 py-1"
                style={{ backgroundColor: withAlpha(palette.gold, 0.18) }}
              >
                <Urdu style={{ fontSize: 34, lineHeight: 52 }}>{tiles[i]}</Urdu>
              </View>
            </Pressable>
          ))
        )}
      </View>

      {/* tile tray */}
      <View className="mb-5 flex-row flex-wrap justify-center">
        {available.map((i) => (
          <Pressable key={i} onPress={() => place(i)}>
            <View className="m-1.5 rounded-xl border border-white/10 bg-ink-700 px-4 py-2">
              <Urdu style={{ fontSize: 36, lineHeight: 54 }}>{tiles[i]}</Urdu>
            </View>
          </Pressable>
        ))}
      </View>

      {graded == null && (
        <Button
          variant={placed.length ? 'primary' : 'ghost'}
          disabled={placed.length === 0}
          onPress={check}
        >
          Check
        </Button>
      )}
      {graded === true && (
        <View className="items-center">
          <Bold style={{ color: palette.jade }}>Perfectly built ✓</Bold>
        </View>
      )}
      {graded === false && (
        <View className="items-center">
          <Bold style={{ color: palette.rose }}>Correct: </Bold>
          <Urdu style={{ fontSize: 34, lineHeight: 52 }}>{word.urdu}</Urdu>
        </View>
      )}
    </View>
  );
}
