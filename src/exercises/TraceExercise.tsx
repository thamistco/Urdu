import { useMemo, useRef, useState } from 'react';
import { View, PanResponder, LayoutChangeEvent } from 'react-native';
import Svg, { Polyline, Rect } from 'react-native-svg';
import { Question, palette, withAlpha } from './common';
import { Urdu, Txt, Bold, Eyebrow } from '../components/Text';
import { Button } from '../components/Button';
import { feedback } from '../lib/feedback';
import { POSITIONS } from '../data/letters';
import { GLYPH_MASKS, MASK_GRID, FONT_ASCENT, FONT_DESCENT } from '../data/glyphMasks';
import type { ExerciseProps, Exercise } from './types';

type TraceEx = Extract<Exercise, { kind: 'letterTrace' }>;

/** How much of the letter must be covered, and how much of the drawing must
 *  land on it. The second number is what stops scribbling: ink covers roughly a
 *  quarter of the card, so filling the square scores about 0.25 for precision. */
const NEED_COVERAGE = 0.55;
const NEED_PRECISION = 0.4;

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Decode the packed mask. Written out rather than using atob, which React
 *  Native does not provide on every engine. */
function decodeMask(bits: string): Uint8Array {
  const cells = new Uint8Array(MASK_GRID * MASK_GRID);
  let bit = 0;
  for (let i = 0; i < bits.length; i += 4) {
    const n =
      (B64.indexOf(bits[i]) << 18) |
      (B64.indexOf(bits[i + 1]) << 12) |
      ((bits[i + 2] === '=' ? 0 : B64.indexOf(bits[i + 2])) << 6) |
      (bits[i + 3] === '=' ? 0 : B64.indexOf(bits[i + 3]));
    const bytes = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    for (const b of bytes) {
      for (let k = 0; k < 8; k++) {
        if (bit < cells.length) cells[bit++] = (b >> k) & 1;
      }
    }
  }
  return cells;
}

type Pt = { x: number; y: number };

/**
 * Trace the letter with a finger.
 *
 * This is the exercise the app's whole premise argues for: if the point is that
 * every letter has four faces, the learner should draw all four. It is also the
 * only exercise where the hand does the learning.
 *
 * The score is real, not a gesture at one. Each glyph ships with a bitmask of
 * where its ink actually is (see scripts/generate-glyph-masks.js), so we can
 * ask two honest questions: how much of the letter did the stroke cover, and
 * how much of the stroke was on the letter. The first alone would pass a
 * scribble; the second alone would pass a single confident line down the middle.
 */
export function TraceExercise({ exercise, locked, onGraded }: ExerciseProps<TraceEx>) {
  const { letter, position } = exercise;
  const entry = GLYPH_MASKS[`${letter.id}:${position}`];

  const [side, setSide] = useState(0);
  const [strokes, setStrokes] = useState<Pt[][]>([]);
  const [graded, setGraded] = useState<null | { pass: boolean; coverage: number }>(null);
  const current = useRef<Pt[]>([]);

  const mask = useMemo(() => (entry ? decodeMask(entry[0]) : null), [entry]);
  const inkCells = useMemo(() => (mask ? mask.reduce((n, v) => n + v, 0) : 0), [mask]);


  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => graded == null && !locked,
        onMoveShouldSetPanResponder: () => graded == null && !locked,
        onPanResponderGrant: (e) => {
          current.current = [{ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY }];
          setStrokes((s) => [...s, current.current]);
        },
        onPanResponderMove: (e) => {
          const p = { x: e.nativeEvent.locationX, y: e.nativeEvent.locationY };
          const last = current.current[current.current.length - 1];
          if (last && Math.hypot(p.x - last.x, p.y - last.y) < 2.5) return;
          current.current = [...current.current, p];
          setStrokes((s) => [...s.slice(0, -1), current.current]);
        },
      }),
    [graded, locked]
  );

  const check = () => {
    if (graded != null || locked || !mask || !side) return;

    // Walk every stroke, marking the cells it passes through. Interpolating
    // between samples matters: a fast drag reports points several cells apart.
    const cell = side / MASK_GRID;
    const touched = new Set<number>();
    const mark = (p: Pt) => {
      const gx = Math.floor(p.x / cell);
      const gy = Math.floor(p.y / cell);
      if (gx < 0 || gy < 0 || gx >= MASK_GRID || gy >= MASK_GRID) return;
      touched.add(gy * MASK_GRID + gx);
    };
    for (const stroke of strokes) {
      for (let i = 0; i < stroke.length; i++) {
        mark(stroke[i]);
        const next = stroke[i + 1];
        if (!next) continue;
        const steps = Math.ceil(Math.hypot(next.x - stroke[i].x, next.y - stroke[i].y) / (cell / 2));
        for (let s = 1; s < steps; s++) {
          mark({
            x: stroke[i].x + ((next.x - stroke[i].x) * s) / steps,
            y: stroke[i].y + ((next.y - stroke[i].y) * s) / steps,
          });
        }
      }
    }

    let onInk = 0;
    touched.forEach((i) => { if (mask[i]) onInk++; });
    const coverage = inkCells ? onInk / inkCells : 0;
    const precision = touched.size ? onInk / touched.size : 0;
    const pass = touched.size > 8 && coverage >= NEED_COVERAGE && precision >= NEED_PRECISION;

    setGraded({ pass, coverage });
    pass ? feedback.correctAnnounce(letter.id, letter.forms[position], letter.name) : feedback.incorrect();
    onGraded({ items: [{ id: letter.id, type: 'letter' }], correct: pass });
  };

  const clear = () => {
    if (graded != null) return;
    feedback.tap();
    current.current = [];
    setStrokes([]);
  };

  // The glyph is placed from the numbers the mask was generated with, so the
  // shape on screen is exactly the shape being scored.
  const fontSize = entry ? entry[1] * side : 0;
  const lineHeight = fontSize * 2.7;
  const baselineInBlock = (lineHeight - (FONT_ASCENT + FONT_DESCENT) * fontSize) / 2 + FONT_ASCENT * fontSize;
  const translateX = entry ? entry[2] * side - side / 2 : 0;
  const translateY = entry ? entry[3] * side - baselineInBlock : 0;

  const positionLabel = POSITIONS.find((p) => p.key === position)?.label ?? position;

  // The generator will not hand us a glyph without a mask, but if one ever went
  // missing the card would have nothing to score and both its buttons would be
  // disabled — a lesson the learner cannot leave. Show the letter instead.
  if (!entry) {
    return (
      <View>
        <Eyebrow style={{ color: palette.gold }} className="mb-2 text-center">
          {letter.name}
        </Eyebrow>
        <Question>Look at the shape</Question>
        <View
          className="mb-4 items-center justify-center rounded-2xl bg-paper py-10"
          style={{ borderWidth: 2, borderColor: palette.ink }}
        >
          <Urdu style={{ fontSize: 80, lineHeight: 216, color: palette.ink }}>
            {letter.forms[position]}
          </Urdu>
        </View>
        <Button onPress={() => onGraded({ items: [{ id: letter.id, type: 'letter' }], correct: true })}>
          Got it
        </Button>
      </View>
    );
  }


  return (
    <View>
      <Eyebrow style={{ color: palette.gold }} className="mb-2 text-center">
        {letter.name} · {positionLabel.toLowerCase()}
      </Eyebrow>
      <Question>Trace the letter</Question>

      <View
        className="mb-4 self-center overflow-hidden rounded-2xl bg-paper"
        style={{ width: '100%', aspectRatio: 1, borderWidth: 2, borderColor: palette.ink }}
        onLayout={(e: LayoutChangeEvent) => setSide(e.nativeEvent.layout.width)}
        {...responder.panHandlers}
      >
        {side > 0 && entry && (
          <>
            <Urdu
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                fontSize,
                lineHeight,
                textAlign: 'center',
                color: withAlpha(palette.ink, graded ? 0.3 : 0.14),
                transform: [{ translateX }, { translateY }],
              }}
            >
              {letter.forms[position]}
            </Urdu>

            <Svg width={side} height={side} style={{ position: 'absolute' }}>
              <Rect width={side} height={side} fill="transparent" />
              {strokes.map((stroke, i) =>
                stroke.length > 1 ? (
                  <Polyline
                    key={i}
                    points={stroke.map((p) => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke={graded == null ? palette.ink : graded.pass ? palette.jadeDark : palette.roseDark}
                    strokeWidth={Math.max(8, side * 0.045)}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : null
              )}
            </Svg>
          </>
        )}

        {strokes.length === 0 && graded == null && (
          // sits at the foot of the card so it never covers the letter itself
          <View className="absolute inset-x-0 bottom-3 items-center" pointerEvents="none">
            <Txt style={{ color: withAlpha(palette.ink, 0.4) }} className="text-xs">
              draw over the grey letter
            </Txt>
          </View>
        )}
      </View>

      {graded == null ? (
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button variant="ghost" onPress={clear} disabled={strokes.length === 0}>
              Clear
            </Button>
          </View>
          <View className="flex-[2]">
            <Button variant="primary" onPress={check} disabled={strokes.length === 0}>
              Check
            </Button>
          </View>
        </View>
      ) : (
        <View className="items-center">
          <Bold style={{ color: graded.pass ? palette.jade : palette.rose }}>
            {graded.pass ? 'That is the shape ✓' : 'Follow the grey letter more closely'}
          </Bold>
          <Txt className="mt-1 text-xs text-paper/50">
            {Math.round(graded.coverage * 100)}% of the letter covered
          </Txt>
        </View>
      )}
    </View>
  );
}
