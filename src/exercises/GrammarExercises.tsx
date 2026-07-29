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
 *
 * Revealed a stage at a time. Every concept carries three paragraphs of prose
 * (450 characters on average), a table of up to seven rows, and three worked
 * examples, and showing all of it at once made the card a wall of text — the
 * learner's own report, and the reason nobody reads the third paragraph.
 *
 * The stages *accumulate* rather than replace one another: by the time the
 * examples are on screen the rule is still above them, which is the whole point
 * of an example. Paging would have hidden the rule at the moment it was needed.
 */
type Stage = 'rule' | 'table' | 'examples';

export function GrammarTeachExercise({ exercise, track, onGraded, onExpand }: ExerciseProps<TeachEx>) {
  const { concept } = exercise;
  const [read, setRead] = useState(false);

  // Only the stages this concept actually has: eight of the twenty-five have no
  // table, and an empty stage would be a tap that changes nothing.
  //
  // Three, not one per paragraph. Splitting the prose finer was tried and left
  // a single short paragraph alone on the screen with a button under it, which
  // reads as unfinished rather than calm — the prose is one argument and belongs
  // together. What made the card a wall was the prose *and* a seven-row table
  // *and* three worked examples arriving at once.
  const stages: Stage[] = [
    'rule',
    ...(concept.table ? (['table'] as Stage[]) : []),
    ...(concept.examples.length ? (['examples'] as Stage[]) : []),
  ];
  const [shown, setShown] = useState(1);
  const allShown = shown >= stages.length;
  const visible = new Set(stages.slice(0, shown));

  const next = () => {
    feedback.tap();
    setShown((n) => n + 1);
    // The revealed block pushes the button for the *following* stage off the
    // bottom of the screen, which reads as the lesson having stalled. Wait for
    // the layout, then bring the foot of the card back into view.
    setTimeout(() => onExpand?.(), 120);
  };

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

      {/* how far through the card the learner is */}
      {stages.length > 1 && (
        <View className="mb-4 flex-row items-center justify-center gap-1.5">
          {stages.map((st, i) => (
            <View
              key={st}
              style={{
                width: i < shown ? 18 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i < shown ? palette.gold : withAlpha(palette.paper, 0.2),
              }}
            />
          ))}
        </View>
      )}

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

      {concept.table && visible.has('table') && (
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

      {visible.has('examples') && (
      <View className="mb-5 gap-2.5">
        <Eyebrow style={{ color: palette.jade }} className="mb-0.5">
          In use
        </Eyebrow>
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
      )}

      {allShown ? (
        !read && <Button onPress={done}>Got it</Button>
      ) : (
        <Button onPress={next}>
          {stages[shown] === 'table' ? 'Show the pattern' : 'Show examples'}
        </Button>
      )}
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
