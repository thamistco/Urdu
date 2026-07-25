import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Choice, Question, palette, withAlpha } from './common';
import { Urdu, Txt, Bold, Eyebrow } from '../components/Text';
import { Button } from '../components/Button';
import { feedback } from '../lib/feedback';
import type { ExerciseProps, Exercise } from './types';

type BuildEx = Extract<Exercise, { kind: 'sentenceBuild' }>;
type ReadEx = Extract<Exercise, { kind: 'reading' }>;

/**
 * Assemble a sentence from shuffled word tiles. Because Urdu is written
 * right-to-left and puts the verb last, physically ordering the words teaches
 * word order far better than a rule ever could.
 */
export function SentenceBuildExercise({ exercise, showRoman, locked, onGraded }: ExerciseProps<BuildEx>) {
  const { sentence, tiles } = exercise;
  const [placed, setPlaced] = useState<number[]>([]);
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
    const built = placed.map((i) => tiles[i]);
    const correct = built.join(' ') === sentence.words.join(' ');
    setGraded(correct);
    correct ? feedback.correct() : feedback.incorrect();
    onGraded({ items: [], correct });
  };

  return (
    <View>
      <Question>Build the sentence</Question>
      <View className="mb-4 items-center rounded-2xl bg-paper px-5 py-4">
        <Txt style={{ color: palette.ink }} className="text-center text-[15px] font-semibold">
          {sentence.meaning}
        </Txt>
        {showRoman ? (
          <Txt style={{ color: palette.ink }} className="mt-1 text-center text-xs opacity-55">
            {sentence.roman}
          </Txt>
        ) : null}
      </View>

      {/* assembly line — right-to-left, like Urdu */}
      <View
        className="mb-5 min-h-[76px] flex-row-reverse flex-wrap items-center justify-center rounded-2xl border-2 border-dashed px-3 py-3"
        style={{
          borderColor:
            graded == null ? withAlpha(palette.paper, 0.25) : graded ? palette.jade : palette.rose,
        }}
      >
        {placed.length === 0 ? (
          <Txt className="text-sm text-paper/30">Tap the words below…</Txt>
        ) : (
          placed.map((i, order) => (
            <Pressable key={`${i}-${order}`} onPress={() => unplace(i)} hitSlop={4}>
              <View
                className="mx-1 my-1 rounded-xl px-3 py-1.5"
                style={{ backgroundColor: withAlpha(palette.gold, 0.18) }}
              >
                <Urdu style={{ fontSize: 24, lineHeight: 40 }}>{tiles[i]}</Urdu>
              </View>
            </Pressable>
          ))
        )}
      </View>

      <View className="mb-5 flex-row flex-wrap justify-center">
        {available.map((i) => (
          <Pressable key={i} onPress={() => place(i)} hitSlop={4}>
            <View className="m-1.5 rounded-xl border border-white/10 bg-ink-700 px-4 py-2">
              <Urdu style={{ fontSize: 24, lineHeight: 40 }}>{tiles[i]}</Urdu>
            </View>
          </Pressable>
        ))}
      </View>

      {graded == null && (
        <Button variant={placed.length ? 'primary' : 'ghost'} disabled={placed.length === 0} onPress={check}>
          Check
        </Button>
      )}
      {graded === false && (
        <View className="items-center">
          <Txt className="mb-1 text-xs text-paper/50">Correct order:</Txt>
          <Urdu style={{ fontSize: 24, lineHeight: 42, textAlign: 'center' }}>
            {sentence.words.join(' ')}
          </Urdu>
        </View>
      )}
      {graded === true && (
        <View className="items-center">
          <Bold style={{ color: palette.jade }}>Exactly right ✓</Bold>
        </View>
      )}
    </View>
  );
}

/** Read a short passage, then answer one comprehension question. */
export function ReadingExercise({ exercise, showRoman, locked, onGraded }: ExerciseProps<ReadEx>) {
  const { passage } = exercise;
  const [stage, setStage] = useState<'read' | 'answer'>('read');
  const [picked, setPicked] = useState<string | null>(null);

  const choose = (opt: string) => {
    if (picked || locked) return;
    setPicked(opt);
    const correct = opt === passage.question.answer;
    correct ? feedback.correct() : feedback.incorrect();
    onGraded({ items: [], correct });
  };

  return (
    <View>
      <Eyebrow style={{ color: palette.gold }} className="mb-2 text-center">
        Reading · {passage.title}
      </Eyebrow>

      <View className="mb-4 rounded-2xl bg-paper px-5 py-4">
        {passage.lines.map((l, i) => (
          <View key={i} className={i > 0 ? 'mt-3' : ''}>
            <Urdu style={{ fontSize: 24, color: palette.ink, lineHeight: 44, textAlign: 'right' }}>
              {l.urdu}
            </Urdu>
            {showRoman ? (
              <Txt style={{ color: palette.ink }} className="text-[11px] opacity-50">
                {l.roman}
              </Txt>
            ) : null}
            {stage === 'answer' ? (
              <Txt style={{ color: palette.ink }} className="text-xs opacity-70">
                {l.meaning}
              </Txt>
            ) : null}
          </View>
        ))}
      </View>

      {stage === 'read' ? (
        <Button
          onPress={() => {
            feedback.tap();
            setStage('answer');
          }}
        >
          I've read it
        </Button>
      ) : (
        <>
          <Question>{passage.question.ask}</Question>
          <View className="gap-3">
            {passage.question.options.map((o) => {
              const state =
                picked == null
                  ? 'idle'
                  : o === passage.question.answer
                  ? 'correct'
                  : o === picked
                  ? 'wrong'
                  : 'muted';
              return (
                <Choice key={o} state={state} disabled={picked != null || locked} onPress={() => choose(o)}>
                  <Bold className="text-[15px]">{o}</Bold>
                </Choice>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}
