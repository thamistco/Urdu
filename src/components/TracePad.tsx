import { useMemo, useRef, useState } from 'react';
import { View, PanResponder, LayoutChangeEvent } from 'react-native';
import Svg, { Polyline, Rect } from 'react-native-svg';
import { Urdu, Txt, Bold } from './Text';
import { Button } from './Button';
import { palette, withAlpha } from '../theme';
import { feedback } from '../lib/feedback';
import { POSITIONS, type Letter, type PositionKey } from '../data/letters';
import { GLYPH_MASKS, MASK_GRID, FONT_ASCENT, FONT_DESCENT } from '../data/glyphMasks';

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
    for (const b of [(n >> 16) & 255, (n >> 8) & 255, n & 255]) {
      for (let k = 0; k < 8; k++) if (bit < cells.length) cells[bit++] = (b >> k) & 1;
    }
  }
  return cells;
}

type Pt = { x: number; y: number };
export type TraceResult = { pass: boolean; coverage: number };

/**
 * The tracing surface: a sheet of paper with the letter faint beneath it, and
 * whatever the learner draws on top.
 *
 * Shared by the lesson exercise and the Letter Lab, which want the same
 * drawing and the same scoring but different consequences — one costs a heart,
 * the other is somewhere to practise.
 *
 * The score is real, not a gesture at one. Each glyph ships with a bitmask of
 * where its ink actually is (see scripts/generate-glyph-masks.js), so we can
 * ask two honest questions: how much of the letter did the stroke cover, and
 * how much of the stroke was on the letter. The first alone would pass a
 * scribble; the second alone would pass one confident line down the middle.
 */
export function TracePad({
  letter,
  position,
  locked = false,
  onScored,
}: {
  letter: Letter;
  position: PositionKey;
  locked?: boolean;
  onScored?: (result: TraceResult) => void;
}) {
  const entry = GLYPH_MASKS[`${letter.id}:${position}`];

  const [side, setSide] = useState(0);
  const [strokes, setStrokes] = useState<Pt[][]>([]);
  const [result, setResult] = useState<TraceResult | null>(null);
  const current = useRef<Pt[]>([]);

  const mask = useMemo(() => (entry ? decodeMask(entry[0]) : null), [entry]);
  const inkCells = useMemo(() => (mask ? mask.reduce((n, v) => n + v, 0) : 0), [mask]);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => result == null && !locked,
        onMoveShouldSetPanResponder: () => result == null && !locked,
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
    [result, locked]
  );

  const check = () => {
    if (result != null || locked || !mask || !side) return;

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

    const r = { pass, coverage };
    setResult(r);
    pass ? feedback.correctAnnounce(letter.id, letter.forms[position], letter.name) : feedback.incorrect();
    onScored?.(r);
  };

  const reset = () => {
    feedback.tap();
    current.current = [];
    setStrokes([]);
    setResult(null);
  };

  // The glyph is placed from the numbers the mask was generated with, so the
  // shape on screen is exactly the shape being scored.
  const fontSize = entry ? entry[1] * side : 0;
  const lineHeight = fontSize * 2.7;
  const baselineInBlock = (lineHeight - (FONT_ASCENT + FONT_DESCENT) * fontSize) / 2 + FONT_ASCENT * fontSize;
  const translateX = entry ? entry[2] * side - side / 2 : 0;
  const translateY = entry ? entry[3] * side - baselineInBlock : 0;
  const positionLabel = POSITIONS.find((p) => p.key === position)?.label ?? position;

  // No mask means nothing to score against; showing the card anyway would leave
  // both buttons disabled and the learner stuck. Show the letter plainly.
  if (!entry) {
    return (
      <View
        className="items-center justify-center rounded-2xl bg-paper py-10"
        style={{ borderWidth: 2, borderColor: palette.ink }}
      >
        <Urdu style={{ fontSize: 80, lineHeight: 216, color: palette.ink }}>{letter.forms[position]}</Urdu>
      </View>
    );
  }

  return (
    <View>
      <View
        className="mb-4 self-center overflow-hidden rounded-2xl bg-paper"
        style={{ width: '100%', aspectRatio: 1, borderWidth: 2, borderColor: palette.ink }}
        onLayout={(e: LayoutChangeEvent) => setSide(e.nativeEvent.layout.width)}
        // A drawing surface cannot be operated without a pointer, but it should
        // at least announce itself rather than being a silent rectangle.
        accessible
        accessibilityLabel={`Drawing area. Trace ${letter.name} in its ${positionLabel.toLowerCase()} form over the faint model.`}
        {...responder.panHandlers}
      >
        {side > 0 && (
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
                color: withAlpha(palette.ink, result ? 0.3 : 0.14),
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
                    stroke={result == null ? palette.ink : result.pass ? palette.jadeDark : palette.roseDark}
                    strokeWidth={Math.max(8, side * 0.045)}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : null
              )}
            </Svg>
          </>
        )}

        {strokes.length === 0 && result == null && (
          // sits at the foot of the card so it never covers the letter itself
          <View className="absolute inset-x-0 bottom-3 items-center" pointerEvents="none">
            <Txt style={{ color: withAlpha(palette.ink, 0.4) }} className="text-xs">
              draw over the grey letter
            </Txt>
          </View>
        )}
      </View>

      {result == null ? (
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button variant="ghost" onPress={reset} disabled={strokes.length === 0}>
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
          <Bold style={{ color: result.pass ? palette.jade : palette.rose }}>
            {result.pass ? 'That is the shape ✓' : 'Follow the grey letter more closely'}
          </Bold>
          <Txt className="mt-1 text-xs text-paper/50">
            {Math.round(result.coverage * 100)}% of the letter covered
          </Txt>
        </View>
      )}
    </View>
  );
}

/** Reset handle for callers that reuse one pad across several letters. */
export function tracePadKey(letterId: string, position: string) {
  return `${letterId}:${position}`;
}
