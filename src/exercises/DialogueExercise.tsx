import { useState } from 'react';
import { View } from 'react-native';
import { Choice, Question, SpeakerButton, palette } from './common';
import { Urdu, Txt, Bold, Eyebrow, urduLine } from '../components/Text';
import { Button } from '../components/Button';
import { feedback } from '../lib/feedback';
import { announce } from '../lib/speech';
import { withRegister } from '../data/sentences';
import type { ExerciseProps, Exercise } from './types';

type DialogueEx = Extract<Exercise, { kind: 'dialogue' }>;

/**
 * A two-speaker exchange, read then answered.
 *
 * Laid out as speech turns rather than a block of prose: each speaker keeps a
 * side and a colour, so the shape of the conversation is visible before a word
 * is read. That matters more in Urdu than it looks — the polite forms only make
 * sense once you can see who is speaking to whom.
 *
 * Same two stages as a reading passage: read it in Urdu, then the English
 * appears alongside the question, so the first pass is never a translation.
 */
export function DialogueExercise({ exercise, track, showRoman, locked, onGraded }: ExerciseProps<DialogueEx>) {
  const { dialogue } = exercise;
  const [stage, setStage] = useState<'read' | 'answer'>('read');
  const [picked, setPicked] = useState<string | null>(null);

  const choose = (opt: string) => {
    if (picked || locked) return;
    setPicked(opt);
    const correct = opt === dialogue.question.answer;
    correct ? feedback.correct() : feedback.incorrect();
    onGraded({ items: [], correct });
  };

  return (
    <View>
      <Eyebrow style={{ color: palette.gold }} className="mb-1 text-center">
        Conversation · {dialogue.title}
      </Eyebrow>
      <Txt className="mb-4 text-center text-xs text-paper/55">{dialogue.setting}</Txt>

      <View className="mb-4 gap-3">
        {dialogue.lines.map((l, i) => {
          const isA = l.speaker === 'A';
          const tint = isA ? palette.gold : palette.jadeLight;
          return (
            <View key={i} className={isA ? 'items-start' : 'items-end'}>
              <Eyebrow style={{ color: tint, fontSize: 9 }} className="mb-1 px-1">
                {l.name}
              </Eyebrow>
              <View
                className="max-w-[88%] rounded-2xl px-4 py-3"
                style={{
                  backgroundColor: palette.parchment,
                  borderWidth: 2,
                  borderColor: palette.ink,
                  // a speech bubble squares off the corner nearest its speaker
                  borderTopLeftRadius: isA ? 4 : 16,
                  borderTopRightRadius: isA ? 16 : 4,
                }}
              >
                {/* The Roman track hears the conversation in transliteration;
                    what is being taught is the exchange, not the alphabet. */}
                {track === 'roman' ? (
                  <Txt style={{ color: palette.ink, fontSize: 16 }} className="font-body-bold leading-6">
                    {l.roman}
                  </Txt>
                ) : (
                  <>
                    <Urdu
                      style={{
                        fontSize: 22,
                        color: palette.ink,
                        lineHeight: urduLine(22),
                        textAlign: 'right',
                      }}
                    >
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
                  <Txt style={{ color: palette.ink }} className="mt-1 text-xs leading-4 opacity-75">
                    {withRegister(l.meaning, l.urdu)}
                  </Txt>
                ) : null}
                <View className={`mt-2 flex-row ${isA ? 'justify-start' : 'justify-end'}`}>
                  <SpeakerButton
                    size={24}
                    label="Hear this line"
                    onPress={() => announce(`${dialogue.id}-${i}`, l.urdu, l.roman)}
                  />
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {stage === 'read' ? (
        <Button
          onPress={() => {
            feedback.tap();
            setStage('answer');
          }}
        >
          I’ve read it
        </Button>
      ) : (
        <>
          <Question>{dialogue.question.ask}</Question>
          <View className="gap-3">
            {dialogue.question.options.map((o) => {
              const state =
                picked == null ? 'idle' : o === dialogue.question.answer ? 'correct' : o === picked ? 'wrong' : 'muted';
              return (
                <Choice key={o} state={state} disabled={picked != null || locked} onPress={() => choose(o)}>
                  <Bold className="text-center text-[15px]">{o}</Bold>
                </Choice>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}
