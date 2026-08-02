import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { BuildDirection, Choice, Question, SpeakerButton, palette, withAlpha } from './common';
import { Urdu, Txt, Bold, Eyebrow, urduLine } from '../components/Text';
import { Button } from '../components/Button';
import { feedback } from '../lib/feedback';
import { announce } from '../lib/speech';
import { withRegister } from '../data/sentences';
import type { ExerciseProps, Exercise } from './types';

type BuildEx = Extract<Exercise, { kind: 'sentenceBuild' }>;
type ReadEx = Extract<Exercise, { kind: 'reading' }>;

/**
 * Assemble a sentence from shuffled word tiles. Because Urdu is written
 * right-to-left and puts the verb last, physically ordering the words teaches
 * word order far better than a rule ever could.
 */
export function SentenceBuildExercise({ exercise, track, showRoman, locked, onGraded }: ExerciseProps<BuildEx>) {
  const { sentence, tiles, romanTiles } = exercise;
  const [placed, setPlaced] = useState<number[]>([]);
  const [graded, setGraded] = useState<boolean | null>(null);

  // What the voice should say, which is not always what is written: اس is
  // spelled the same whether it is read `us` or `is`, so the sentences that
  // contain one carry a diacritic-marked reading for the audio to follow.
  const spoken = sentence.pronounce ?? sentence.words.join(' ');

  // On the Roman track the tiles read left-to-right like the Latin alphabet
  // they are written in; on the others they lay out right-to-left like the
  // Urdu they are. Grading is unaffected — the placed order is the answer
  // either way — but a tray that fills away from where the eye starts is the
  // single most confusing thing this exercise can do.
  const roman = track === 'roman' && !!romanTiles;
  const label = (i: number) => (roman ? romanTiles![i] : tiles[i]);

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
    correct
      ? feedback.correctAnnounce(sentence.id, spoken, sentence.roman)
      : feedback.incorrectAnnounce(sentence.id, spoken, sentence.roman);
    onGraded({ items: [], correct });
  };

  return (
    <View>
      <Question>Build the sentence</Question>
      <View className="mb-4 items-center rounded-2xl bg-parchment px-5 py-4">
        <Txt style={{ color: palette.ink }} className="text-center text-[15px] font-semibold">
          {/* تم (casual) and آپ (polite) both mean "you", and a learner has no
              way to tell them apart from the English alone — the distinction
              was explained once, in the pronouns grammar concept, and never
              attached to an actual sentence that used it. */}
          {withRegister(sentence.meaning, sentence.words)}
        </Txt>
        {/* The transliteration is the answer spelled out, so it is held back
            until the sentence has been attempted. */}
        {showRoman && graded != null ? (
          <Txt style={{ color: palette.ink }} className="mt-1 text-center text-xs opacity-55">
            {sentence.roman}
          </Txt>
        ) : null}
        <View className="mt-3">
          <SpeakerButton label="Hear the sentence" onPress={() => announce(sentence.id, spoken, sentence.roman)} />
        </View>
      </View>

      {/* assembly line — laid out in the direction the tiles are read */}
      <View
        className={`mb-2 min-h-[76px] flex-wrap items-center justify-center rounded-2xl border-2 border-dashed px-3 py-3 ${
          roman ? 'flex-row' : 'flex-row-reverse'
        }`}
        style={{
          borderColor: graded == null ? withAlpha(palette.paper, 0.25) : graded ? palette.jade : palette.rose,
        }}
      >
        {placed.length === 0 ? (
          <Txt className="text-sm text-paper/30">Tap the words below…</Txt>
        ) : (
          placed.map((i, order) => (
            <Pressable
              key={`${i}-${order}`}
              onPress={() => unplace(i)}
              hitSlop={4}
              accessibilityRole="button"
              accessibilityLabel={`Word ${order + 1} of the sentence. Tap to take it back.`}
            >
              <View
                className="mx-1 my-1 rounded-xl px-3 py-1.5"
                style={{ backgroundColor: withAlpha(palette.gold, 0.18) }}
              >
                {roman ? (
                  <Bold style={{ fontSize: 18 }}>{label(i)}</Bold>
                ) : (
                  <Urdu style={{ fontSize: 22, lineHeight: urduLine(22) }}>{label(i)}</Urdu>
                )}
              </View>
            </Pressable>
          ))
        )}
      </View>
      <BuildDirection roman={roman} />

      <View className="mb-5 flex-row flex-wrap justify-center">
        {available.map((i) => (
          <Pressable
            key={i}
            onPress={() => place(i)}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel="Word tile. Tap to add it to the sentence."
          >
            <View className="m-1.5 rounded-xl border border-white/10 bg-ink-700 px-4 py-2">
              {roman ? (
                <Bold style={{ fontSize: 18 }}>{label(i)}</Bold>
              ) : (
                <Urdu style={{ fontSize: 22, lineHeight: urduLine(22) }}>{label(i)}</Urdu>
              )}
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
          {roman ? (
            <Bold style={{ fontSize: 19, textAlign: 'center' }}>{sentence.roman}</Bold>
          ) : (
            <Urdu style={{ fontSize: 24, lineHeight: urduLine(24), textAlign: 'center' }}>
              {sentence.words.join(' ')}
            </Urdu>
          )}
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
export function ReadingExercise({ exercise, track, showRoman, locked, onGraded }: ExerciseProps<ReadEx>) {
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

      <View className="mb-4 rounded-2xl bg-parchment px-5 py-4">
        {passage.lines.map((l, i) => (
          // Nastaliq descends a long way below its baseline, so each line needs
          // real breathing room before the transliteration underneath it.
          <View key={i} className={`flex-row items-start justify-between ${i > 0 ? 'mt-5' : ''}`}>
            <View className="flex-1">
              {/* The Roman track reads the passage in transliteration — the
                  point of the exercise is comprehension, not decoding. */}
              {track === 'roman' ? (
                <Txt style={{ color: palette.ink, fontSize: 17 }} className="font-body-bold leading-6">
                  {l.roman}
                </Txt>
              ) : (
                <>
                  <Urdu style={{ fontSize: 23, color: palette.ink, lineHeight: urduLine(23), textAlign: 'right' }}>
                    {l.urdu}
                  </Urdu>
                  {showRoman ? (
                    <Txt style={{ color: palette.ink }} className="mt-2 text-[11px] leading-4 opacity-50">
                      {l.roman}
                    </Txt>
                  ) : null}
                </>
              )}
              {stage === 'answer' ? (
                <Txt style={{ color: palette.ink }} className="mt-1 text-xs leading-4 opacity-70">
                  {withRegister(l.meaning, l.urdu)}
                </Txt>
              ) : null}
            </View>
            <View className="ml-2 mt-0.5">
              <SpeakerButton
                size={26}
                label="Hear this line"
                onPress={() => announce(`${passage.id}-${i}`, l.urdu, l.roman)}
              />
            </View>
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
                picked == null ? 'idle' : o === passage.question.answer ? 'correct' : o === picked ? 'wrong' : 'muted';
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
