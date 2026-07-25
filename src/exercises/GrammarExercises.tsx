import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Choice, Question, palette, withAlpha } from './common';
import { Urdu, Txt, Bold, Eyebrow, Heading } from '../components/Text';
import { Button } from '../components/Button';
import { feedback } from '../lib/feedback';
import type { ExerciseProps, Exercise } from './types';

type TeachEx = Extract<Exercise, { kind: 'grammarTeach' }>;
type DrillEx = Extract<Exercise, { kind: 'grammarDrill' }>;

/**
 * A teaching card. Not graded — the learner reads, then continues. Presenting
 * the rule *before* drilling it is what makes grammar stick rather than feeling
 * like guesswork.
 */
export function GrammarTeachExercise({ exercise, onGraded }: ExerciseProps<TeachEx>) {
  const { concept } = exercise;
  const [read, setRead] = useState(false);

  const done = () => {
    if (read) return;
    setRead(true);
    feedback.tap();
    // always "correct" — a teaching card can't be failed
    onGraded({ items: [], correct: true });
  };

  return (
    <View>
      <Eyebrow style={{ color: palette.gold }} className="mb-2 text-center">
        Grammar
      </Eyebrow>
      <Heading className="mb-4 text-center text-2xl">{concept.title}</Heading>

      <View
        className="mb-4 rounded-2xl p-5"
        style={{ backgroundColor: palette.ink700, borderWidth: 1, borderColor: withAlpha(palette.gold, 0.2) }}
      >
        {concept.explain.map((para, i) => (
          <Txt key={i} className={`text-[15px] leading-7 text-paper/85 ${i > 0 ? 'mt-3' : ''}`}>
            {para}
          </Txt>
        ))}
      </View>

      {concept.table && (
        <View className="mb-4 overflow-hidden rounded-2xl" style={{ backgroundColor: palette.paper }}>
          <View className="flex-row" style={{ backgroundColor: withAlpha(palette.ink, 0.08) }}>
            {concept.table.heading.map((h, i) => (
              <View key={i} className="flex-1 px-3 py-2">
                <Eyebrow style={{ color: withAlpha(palette.ink, 0.6), fontSize: 10 }}>{h}</Eyebrow>
              </View>
            ))}
          </View>
          {concept.table.rows.map((row, r) => (
            <View
              key={r}
              className="flex-row"
              style={{ borderTopWidth: 1, borderTopColor: withAlpha(palette.ink, 0.08) }}
            >
              {row.map((cell, c) => (
                <View key={c} className="flex-1 px-3 py-2.5">
                  {/[؀-ۿ]/.test(cell) ? (
                    <Urdu style={{ fontSize: 20, color: palette.ink, lineHeight: 34 }}>{cell}</Urdu>
                  ) : (
                    <Txt style={{ color: palette.ink }} className="text-[13px]">
                      {cell}
                    </Txt>
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>
      )}

      <View className="mb-5 gap-2.5">
        {concept.examples.map((ex, i) => (
          <View
            key={i}
            className="rounded-xl border-l-2 px-4 py-3"
            style={{ borderLeftColor: palette.jade, backgroundColor: withAlpha(palette.jade, 0.08) }}
          >
            <Urdu style={{ fontSize: 24, lineHeight: 40 }}>{ex.urdu}</Urdu>
            <Txt className="text-xs text-paper/55">{ex.roman}</Txt>
            <Txt className="mt-0.5 text-[13px] text-paper/80">{ex.meaning}</Txt>
          </View>
        ))}
      </View>

      {!read && <Button onPress={done}>Got it</Button>}
    </View>
  );
}

/** Fill-in-the-blank drill on a grammar point. */
export function GrammarDrillExercise({ exercise, showRoman, locked, onGraded }: ExerciseProps<DrillEx>) {
  const { drill } = exercise;
  const [picked, setPicked] = useState<string | null>(null);

  const choose = (opt: string) => {
    if (picked || locked) return;
    setPicked(opt);
    const correct = opt === drill.answer;
    correct ? feedback.correct() : feedback.incorrect();
    onGraded({ items: [], correct });
  };

  // show the sentence with the gap filled once answered
  const shown = picked ? drill.prompt.replace('___', picked) : drill.prompt;

  return (
    <View>
      <Question>Complete the sentence</Question>
      <View className="mb-4 items-center rounded-2xl bg-paper px-5 py-6">
        <Urdu style={{ fontSize: 30, color: palette.ink, lineHeight: 54, textAlign: 'center' }}>
          {shown}
        </Urdu>
        {showRoman ? (
          <Txt style={{ color: palette.ink }} className="mt-1 text-xs opacity-55">
            {drill.promptRoman}
          </Txt>
        ) : null}
        <Txt style={{ color: palette.ink }} className="mt-2 text-[13px] opacity-70">
          {drill.meaning}
        </Txt>
      </View>

      <View className="flex-row flex-wrap justify-between">
        {drill.options.map((o) => {
          const state =
            picked == null ? 'idle' : o === drill.answer ? 'correct' : o === picked ? 'wrong' : 'muted';
          return (
            <Choice
              key={o}
              state={state}
              disabled={picked != null || locked}
              onPress={() => choose(o)}
              className="mb-3 w-[48%]"
            >
              <Urdu style={{ fontSize: 26, color: palette.paper, lineHeight: 44 }}>{o}</Urdu>
            </Choice>
          );
        })}
      </View>

      {picked && (
        <View
          className="mt-1 rounded-xl border-l-2 px-4 py-3"
          style={{ borderLeftColor: palette.gold, backgroundColor: withAlpha(palette.gold, 0.1) }}
        >
          <Bold style={{ color: palette.gold }} className="mb-0.5 text-xs uppercase tracking-wider">
            Why
          </Bold>
          <Txt className="text-[13px] leading-5 text-paper/80">{drill.because}</Txt>
        </View>
      )}
    </View>
  );
}
