import { View } from 'react-native';
import { Question, palette } from './common';
import { Eyebrow } from '../components/Text';
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
        onScored={({ pass }) => onGraded({ items: [{ id: letter.id, type: 'letter' }], correct: pass })}
      />
    </View>
  );
}
