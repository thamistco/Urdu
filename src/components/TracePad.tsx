import { useMemo, useRef, useState } from 'react';
import { View, PanResponder, LayoutChangeEvent } from 'react-native';
import Svg, { Polyline, Rect } from 'react-native-svg';
import { Urdu, Txt, Bold } from './Text';
import { Button } from './Button';
import { palette, withAlpha } from '../theme';
import { feedback } from '../lib/feedback';
import { POSITIONS, type Letter, type PositionKey } from '../data/letters';
import { GLYPH_MASKS, MASK_GRID, FONT_ASCENT, FONT_DESCENT } from '../data/glyphMasks';
import { decodeMask, traceTargets, scoreTrace, type Pt } from '../lib/trace';

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

  const targets = useMemo(
    () => (entry ? traceTargets(decodeMask(entry[0], MASK_GRID), MASK_GRID) : null),
    [entry]
  );

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
    if (result != null || locked || !targets || !side) return;

    const { coverage, precision, pass } = scoreTrace(
      strokes,
      side,
      MASK_GRID,
      targets.reachable,
      targets.tolerant
    );
    void precision;

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
