import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * URD-055: `useSessionGradeFlush`'s own ref/effect timing has a real,
 * mutation-tested suite (URD-044) — but only through a synthetic
 * `Harness` that always calls `record`/`flushNow` correctly by
 * construction. Nothing checks that `LessonScreen.tsx` itself actually
 * *calls* them: `recordItemGrade` inside `onGraded`, and the explicit
 * `flushPendingGrades()` inside `advance()` — the one whose own comment
 * explains it exists so closing the app from the results screen doesn't
 * silently lose SRS grading while keeping the rewards. Drop either call
 * and `check:all` stays green today; a learner's answers stop reaching
 * the scheduler, or a session's rewards persist without its grading, and
 * nothing says so.
 *
 * A full rendered `LessonScreen` test needs react-navigation/store/
 * native-module mocking disproportionate to one wiring fact, and cuts
 * against this project's own "two kinds of test, no overlap" rule —
 * neither bucket is "render one screen component" (see
 * `letterSpotGrading.test.ts`'s own doc comment for the same call made
 * on a different screen). The narrow seam that doesn't need any of that:
 * read the real, shipped source and confirm the call is textually
 * present *inside the specific function body* that must make it — not
 * merely present somewhere in the file, which a doc comment mentioning
 * the same name in prose would satisfy even after the real call site is
 * deleted. `extractBody` below is a plain brace-depth scan, not a full
 * parser — good enough for one file this project controls, not meant to
 * survive adversarial input.
 */

const SOURCE_PATH = path.join(__dirname, 'LessonScreen.tsx');
const source = fs.readFileSync(SOURCE_PATH, 'utf8');

/**
 * Blanks out `//` and `/* *\/` comments, keeping every character position
 * (and therefore every line/column) intact — the same trade `check-theme
 * .js`'s own `stripComments` makes, for the same reason: a naive delete
 * would shift every later offset, and this file's own `indexOf`-based
 * ordering check depends on offsets staying meaningful. Without this, a
 * call commented out rather than deleted (`// recordItemGrade(...)`)
 * still contains the literal substring `toContain` looks for and the
 * mutation this test exists to catch passes silently — caught by testing
 * exactly that mutation against this file before trusting it (see the
 * gauntlet ledger for URD-055).
 */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, (m) => ' '.repeat(m.length));
}
const code = stripComments(source);

/**
 * The `{ ... }` block starting at the first `{` at or after `searchFrom`,
 * matched by brace depth (not by any awareness of strings/comments — see
 * this file's own doc comment for why that is an acceptable trade here).
 * Throws with a message naming what was being looked for, rather than
 * returning an empty/wrong slice a caller's `toContain` could pass on by
 * accident.
 */
function extractBody(label: string, anchor: string, searchFrom = 0): string {
  const anchorAt = code.indexOf(anchor, searchFrom);
  if (anchorAt === -1) throw new Error(`${label}: anchor ${JSON.stringify(anchor)} not found in LessonScreen.tsx`);
  const openAt = code.indexOf('{', anchorAt);
  if (openAt === -1) throw new Error(`${label}: no '{' found after anchor`);
  let depth = 0;
  for (let i = openAt; i < code.length; i++) {
    if (code[i] === '{') depth++;
    else if (code[i] === '}') {
      depth--;
      if (depth === 0) return code.slice(openAt, i + 1);
    }
  }
  throw new Error(`${label}: braces never balanced back to 0 — extraction is broken, not the file`);
}

describe('LessonScreen wiring (URD-055)', () => {
  it('extractBody actually isolates the right function, not the whole file', () => {
    // Guards the test helper itself: if this ever matched from index 0 to
    // the end of the file, every assertion below would trivially pass no
    // matter what — this pins the extracted block to a sane size instead.
    const advanceBody = extractBody('advance', 'const advance = () =>');
    expect(advanceBody.length).toBeLessThan(1500);
    expect(advanceBody).toContain('invalidateSpeech');
  });

  it('advance() still calls flushPendingGrades() before finishing the lesson', () => {
    const advanceBody = extractBody('advance', 'const advance = () =>');
    expect(advanceBody).toContain('flushPendingGrades()');
    // And specifically before finishLesson, not merely present somewhere
    // in the block — a flush after the lesson already finished defeats
    // the whole point (the doc comment right above the real call names
    // this exact ordering as the reason it's there).
    expect(advanceBody.indexOf('flushPendingGrades()')).toBeLessThan(advanceBody.indexOf('finishLesson('));
  });

  it('onGraded records every graded item via recordItemGrade', () => {
    const onGradedBody = extractBody('onGraded', 'const onGraded = useCallback(');
    expect(onGradedBody.length).toBeLessThan(2500);
    expect(onGradedBody).toContain('recordItemGrade(');
  });

  // The two functions' names are destructured from `useSessionGradeFlush`
  // itself (`recordItemGrade`/`flushPendingGrades` are local aliases for
  // `record`/`flushNow`) — if that destructure ever drops one, the two
  // tests above would start matching a stale reference to nothing, not a
  // real call. Pinning the actual hook call's shape here means a broken
  // alias fails loudly instead of the tests above silently checking dead
  // text.
  it('recordItemGrade and flushPendingGrades really are useSessionGradeFlush’s record/flushNow', () => {
    expect(code).toMatch(
      /const\s*\{\s*record:\s*recordItemGrade\s*,\s*flushNow:\s*flushPendingGrades\s*\}\s*=\s*useSessionGradeFlush\(/
    );
  });
});
