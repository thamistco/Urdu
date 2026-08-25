import { describe, it, expect } from 'vitest';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { useSessionGradeFlush, type ApplyGrade } from './useSessionGradeFlush';
import type { Exercise } from '../exercises/types';

/**
 * URD-044: `sessionGrading.test.ts` already covers `recordSighting`/
 * `flushSessionGrades` in complete isolation from React — this covers the
 * ref/effect *wiring* `useSessionGradeFlush` (extracted from `LessonScreen`)
 * builds around them, the integration URD-019's real bug actually lived in
 * and that had zero automated coverage anywhere in `check:all` before this.
 *
 * `react-test-renderer` runs real React hooks with no DOM and no
 * `react-native` view primitives at all — the hook under test is plain
 * React, so this stays a unit test of one hook's real effect timing, not a
 * rendered screen. No JSX: `React.createElement` directly, so this file can
 * stay a plain `.test.ts` (see `vitest.config.ts`'s own comment on why).
 *
 * `exercises` only ever matters to the hook as an *identity* to key the
 * per-visit `Map` on — never read for content — so a bare object stand-in
 * is a faithful substitute for a real `Exercise[]`, the same way other tests
 * in this codebase use minimal doubles for values only compared, not read.
 */
const exercisesA = [{}] as unknown as readonly Exercise[];
const exercisesB = [{}, {}] as unknown as readonly Exercise[];

function Harness({
  exercises,
  applyGrade,
  onApi,
}: {
  exercises: readonly Exercise[];
  applyGrade: ApplyGrade;
  onApi: (api: ReturnType<typeof useSessionGradeFlush>) => void;
}) {
  onApi(useSessionGradeFlush(exercises, applyGrade));
  return null;
}

/** A stand-in for `useProgressStore`'s `gradeItem`, recording every call in order. */
function fakeApplyGrade() {
  const applied: Array<[string, string, string]> = [];
  const applyGrade: ApplyGrade = (id, type, grade) => applied.push([id, type, grade]);
  return { applied, applyGrade };
}

describe('useSessionGradeFlush', () => {
  it('applies the last sighting of a repeatedly-seen item, not the first, when flushed', () => {
    // The exact property URD-019 fixed: a learner wrong, then right twice, on
    // the same item this visit is graded on the right answer, not the wrong
    // one — `sessionGrading.ts`'s own `finalGradeOf` requires the last *two*
    // sightings to agree (its guess-through guard), so this records three,
    // not two, to land on a final pair that agrees without changing what the
    // test demonstrates: the first sighting recorded is not the one trusted.
    const { applied, applyGrade } = fakeApplyGrade();
    let api!: ReturnType<typeof useSessionGradeFlush>;
    act(() => {
      TestRenderer.create(React.createElement(Harness, { exercises: exercisesA, applyGrade, onApi: (a) => (api = a) }));
    });
    act(() => api.record({ id: 'w-1', type: 'word' }, 'again'));
    act(() => api.record({ id: 'w-1', type: 'word' }, 'good'));
    act(() => api.record({ id: 'w-1', type: 'word' }, 'good'));
    act(() => api.flushNow());
    expect(applied).toEqual([['w-1', 'word', 'good']]);
  });

  it('a second flush right after the first is a harmless no-op, not a duplicate grade', () => {
    // `advance()` flushes explicitly on finishing a lesson; the effect's own
    // unmount-time flush fires moments later regardless. `flushSessionGrades`
    // clears `pending` after applying, so the second call must find nothing
    // left — not re-apply the same grade a second time.
    const { applied, applyGrade } = fakeApplyGrade();
    let api!: ReturnType<typeof useSessionGradeFlush>;
    act(() => {
      TestRenderer.create(React.createElement(Harness, { exercises: exercisesA, applyGrade, onApi: (a) => (api = a) }));
    });
    act(() => api.record({ id: 'w-1', type: 'word' }, 'good'));
    act(() => api.flushNow());
    act(() => api.flushNow());
    expect(applied).toEqual([['w-1', 'word', 'good']]);
  });

  it('unmounting after an explicit flush applies nothing further', () => {
    const { applied, applyGrade } = fakeApplyGrade();
    let api!: ReturnType<typeof useSessionGradeFlush>;
    let renderer!: ReturnType<typeof TestRenderer.create>;
    act(() => {
      renderer = TestRenderer.create(
        React.createElement(Harness, { exercises: exercisesA, applyGrade, onApi: (a) => (api = a) })
      );
    });
    act(() => api.record({ id: 'w-1', type: 'word' }, 'good'));
    act(() => api.flushNow());
    act(() => renderer.unmount());
    expect(applied).toEqual([['w-1', 'word', 'good']]);
  });

  it("a new lesson visit (exercises identity changes) flushes the PREVIOUS visit's pending grades before starting a fresh one", () => {
    // The property no test of sessionGrading.ts's own pure functions can
    // check at all: that LessonScreen's effect cleanup actually fires, and
    // fires with the *right* Map, when a learner reopens a lesson or the
    // path hands them a new one without this component ever unmounting.
    const { applied, applyGrade } = fakeApplyGrade();
    let api!: ReturnType<typeof useSessionGradeFlush>;
    const capture = (a: typeof api) => (api = a);
    let renderer!: ReturnType<typeof TestRenderer.create>;
    act(() => {
      renderer = TestRenderer.create(
        React.createElement(Harness, { exercises: exercisesA, applyGrade, onApi: capture })
      );
    });
    act(() => api.record({ id: 'w-1', type: 'word' }, 'good'));
    expect(applied, 'not flushed yet — still visit A').toEqual([]);

    act(() => {
      renderer.update(React.createElement(Harness, { exercises: exercisesB, applyGrade, onApi: capture }));
    });
    expect(applied, "visit A's pending grade flushed on the visit change").toEqual([['w-1', 'word', 'good']]);

    // The fresh visit-B map starts empty — recording an item there and
    // flushing must not somehow re-apply anything left over from visit A.
    act(() => api.record({ id: 'w-2', type: 'word' }, 'easy'));
    act(() => api.flushNow());
    expect(applied).toEqual([
      ['w-1', 'word', 'good'],
      ['w-2', 'word', 'easy'],
    ]);
  });
});
