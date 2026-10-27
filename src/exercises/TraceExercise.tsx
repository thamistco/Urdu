import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Platform, Pressable, View } from 'react-native';
import { Question, SPOKEN_ONLY, palette } from './common';
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
      {!scored && !locked ? (
        <CantTraceNow onPress={() => onGraded({ items: [], correct: true, skipped: true })} />
      ) : null}
    </View>
  );
}

/**
 * A way past a trace for a learner who cannot draw it: a screen-reader user
 * meets a drawing area with nothing to act on, and Check stays off until there
 * is a stroke, so l-1 could not be finished past its second step (design
 * review, 2026-10-26, R4). It grades nothing; the lesson leaves it out of the
 * score.
 *
 * Only for the learners who need it, so it cannot tempt anyone else to skip the
 * one exercise that trains the hand (the owner, 2026-10-26). On a phone it shows
 * while VoiceOver or TalkBack is on. On the web, where react-native-web reports
 * a screen reader as always on, it is in the page but out of sight, reached by
 * a screen reader, and shown when a keyboard user tabs to it.
 */
function CantTraceNow({ onPress }: { onPress: () => void }) {
  const web = Platform.OS === 'web';
  const [screenReader, setScreenReader] = useState(false);
  const [focused, setFocused] = useState(false);
  const ref = useRef<View>(null);
  useEffect(() => {
    if (web) return;
    AccessibilityInfo.isScreenReaderEnabled().then(setScreenReader, () => {});
    const sub = AccessibilityInfo.addEventListener('screenReaderChanged', setScreenReader);
    return () => sub.remove();
  }, [web]);
  // Hidden, the button is a pixel at the column's top left, which is where the
  // browser scrolls on focus. At 200% zoom or on a short screen the full-size
  // button below Check was then off screen and focus seemed to vanish, so
  // bring it into view once it has its real size.
  useEffect(() => {
    if (!web || !focused) return;
    const frame = requestAnimationFrame(() => {
      const node = ref.current as unknown as { scrollIntoView?: (o: { block: 'nearest' }) => void } | null;
      node?.scrollIntoView?.({ block: 'nearest' });
    });
    return () => cancelAnimationFrame(frame);
  }, [web, focused]);
  if (!web && !screenReader) return null;
  const seen = !web || focused;
  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={
        seen ? { minHeight: 44, alignSelf: 'center', justifyContent: 'center', paddingHorizontal: 12 } : SPOKEN_ONLY
      }
      className={seen ? 'mt-1' : undefined}
    >
      <Txt className="text-sm text-paper/60">Can’t trace now</Txt>
    </Pressable>
  );
}
