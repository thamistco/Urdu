import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Choice, Question, palette, withAlpha } from './common';
import { Urdu, Txt, Bold, Eyebrow, Heading, urduLine } from '../components/Text';
import { Button } from '../components/Button';
import { feedback } from '../lib/feedback';
import { romanOf } from '../lib/translit';
import type { ExerciseProps, Exercise } from './types';

type TeachEx = Extract<Exercise, { kind: 'grammarTeach' }>;
type DrillEx = Extract<Exercise, { kind: 'grammarDrill' }>;

/**
 * A teaching card. Not graded — the learner reads, then continues. Presenting
 * the rule *before* drilling it is what makes grammar stick rather than feeling
 * like guesswork.
 */
export function GrammarTeachExercise({ exercise, track, onGraded }: ExerciseProps<TeachEx>) {
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
        <View className="mb-4 overflow-hidden rounded-2xl" style={{ backgroundColor: palette.parchment }}>
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
              className="flex-row items-center"
              style={{ borderTopWidth: 1, borderTopColor: withAlpha(palette.ink, 0.08) }}
            >
              {row.map((cell, c) => {
                const isUrdu = /[؀-ۿ]/.test(cell);
                // Authored per cell rather than guessed, so a slash-joined
                // list of pronouns or a full example sentence still gets a
                // real romanization instead of falling back to raw script.
                const roman = concept.table!.rowsRoman?.[r]?.[c] || romanOf(cell);
                if (!isUrdu) {
                  return (
                    <View key={c} className="flex-1 px-3 py-2.5">
                      <Txt style={{ color: palette.ink }} className="text-[13px]">
                        {cell}
                      </Txt>
                    </View>
                  );
                }
                // On the Roman track the script itself is worthless to a
                // learner who asked not to be taught it, so only the
                // romanization shows. On Script/Both, a non-native reader
                // still needs the romanization, so it shows underneath the
                // Urdu rather than replacing it.
                return (
                  <View key={c} className="flex-1 px-3 py-2.5">
                    {track === 'roman' ? (
                      <Txt style={{ color: palette.ink }} className="font-body-bold text-[15px]">
                        {roman ?? cell}
                      </Txt>
                    ) : (
                      <>
                        <Urdu style={{ fontSize: 19, color: palette.ink, lineHeight: urduLine(19), textAlign: 'right' }}>
                          {cell}
                        </Urdu>
                        {roman && (
                          <Txt style={{ color: withAlpha(palette.ink, 0.55) }} className="mt-0.5 text-right text-[11px]">
                            {roman}
                          </Txt>
                        )}
                      </>
                    )}
                  </View>
                );
              })}
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
            {track === 'roman' ? (
              <Bold style={{ fontSize: 17 }}>{ex.roman}</Bold>
            ) : (
              <>
                <Urdu style={{ fontSize: 23, lineHeight: urduLine(23) }}>{ex.urdu}</Urdu>
                <Txt className="mt-1.5 text-xs text-paper/55">{ex.roman}</Txt>
              </>
            )}
            <Txt className="mt-0.5 text-[13px] text-paper/80">{ex.meaning}</Txt>
          </View>
        ))}
      </View>

      {!read && <Button onPress={done}>Got it</Button>}
    </View>
  );
}

/** Fill-in-the-blank drill on a grammar point. */
export function GrammarDrillExercise({ exercise, track, showRoman, locked, onGraded }: ExerciseProps<DrillEx>) {
  const { drill, romanOptions } = exercise;
  const [picked, setPicked] = useState<string | null>(null);

  const choose = (opt: string) => {
    if (picked || locked) return;
    setPicked(opt);
    const correct = opt === drill.answer;
    correct ? feedback.correct() : feedback.incorrect();
    onGraded({ items: [], correct });
  };

  // The Roman track drills the same grammar in transliteration: the point of
  // "which ending agrees here" survives the change of alphabet intact.
  const roman = track === 'roman' && !!romanOptions;
  const romanFor = (o: string) => romanOptions![drill.options.indexOf(o)];

  // show the sentence with the gap filled once answered
  const shown = picked ? drill.prompt.replace('___', picked) : drill.prompt;
  const shownRoman = picked ? drill.promptRoman.replace('___', romanFor(picked)) : drill.promptRoman;

  return (
    <View>
      <Question>Complete the sentence</Question>
      <View className="mb-4 items-center rounded-2xl bg-parchment px-5 py-6">
        {roman ? (
          <Bold style={{ color: palette.ink, fontSize: 21, textAlign: 'center' }}>{shownRoman}</Bold>
        ) : (
          <>
            <Urdu style={{ fontSize: 26, color: palette.ink, lineHeight: urduLine(26), textAlign: 'center' }}>
              {shown}
            </Urdu>
            {showRoman ? (
              <Txt style={{ color: palette.ink }} className="mt-2.5 text-xs opacity-55">
                {picked ? shownRoman : drill.promptRoman}
              </Txt>
            ) : null}
          </>
        )}
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
              {roman ? (
                <Bold style={{ fontSize: 20 }}>{romanFor(o)}</Bold>
              ) : (
                <Urdu style={{ fontSize: 24, color: palette.paper, lineHeight: urduLine(24) }}>{o}</Urdu>
              )}
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
