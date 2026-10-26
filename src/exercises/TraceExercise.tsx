import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Question, palette } from './common';
import { Eyebrow, Txt } from '../components/Text';
import { TracePad, tracePadKey } from '../components/TracePad';
import { POSITIONS } from '../data/letters';
import type { ExerciseProps, Exercise } from './types';

type TraceEx = Extract<Exercise, { kind: 'letterTrace' }>;

/**
 * Trace the letter with a finger.
 *
 * This is the exercise the app's whole premise argues for: if the point is that
 * every letter has four faces, the learner should draw all four. It is also the
 * only exercise where the hand does the learning.
 *
 * The drawing and the scoring live in `TracePad`, which the Letter Lab shares;
 * all this adds is the framing and the consequence.
 */
export function TraceExercise({ exercise, locked, onGraded }: ExerciseProps<TraceEx>) {
  const { letter, position } = exercise;
  const positionLabel = POSITIONS.find((p) => p.key === position)?.label ?? position;
  const [scored, setScored] = useState(false);

  return (
    <View>
      <Eyebrow style={{ color: palette.gold }} className="mb-2 text-center">
        {letter.name} · {positionLabel.toLowerCase()}
      </Eyebrow>
      <Question>Trace the letter</Question>
      <TracePad
        key={tracePadKey(letter.id, position)}
        letter={letter}
        position={position}
        locked={locked}
        quietPass
        onScored={({ pass }) => {
          setScored(true);
          onGraded({ items: [{ id: letter.id, type: 'letter' }], correct: pass });
        }}
      />
      {/* A way past a trace for anyone who cannot draw now: a screen-reader
          user meets a drawing area with nothing to act on, and Check stays
          off until there is a stroke, so l-1 could not be finished past its
          second step (design review, 2026-10-26, R4). Shown to everyone:
          react-native-web always reports a screen reader as on, so it cannot
          be offered to screen-reader users alone. It grades nothing. */}
      {/* Small and muted, not a button the size of Check: before the first
          stroke it was the only control that looked live, and a beginner
          would take it (second check, 2026-10-26). 44px tall to tap. */}
      {!scored && !locked ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => onGraded({ items: [], correct: true, skipped: true })}
          style={{ minHeight: 44, alignSelf: 'center', justifyContent: 'center', paddingHorizontal: 12 }}
          className="mt-1"
        >
          <Txt className="text-sm text-paper/60">Can’t trace now</Txt>
        </Pressable>
      ) : null}
    </View>
  );
}
