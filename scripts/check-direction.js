/**
 * URD-008: physical left/right stays physical through any future direction
 * change; logical start/end does not.
 *
 * This app's own UI chrome never actually flips to RTL today — English text
 * is deliberately pinned `writingDirection: 'ltr'` even next to Urdu
 * (`HomeScreen.tsx`, `PracticeScreen.tsx`), and nothing anywhere sets
 * `I18nManager`'s RTL flag or a container `direction: 'rtl'`. So today,
 * `marginLeft` and `marginStart` render identically. The difference is
 * whether that stays true by construction or by nobody having tried — a
 * margin, padding or border written as `-left`/`-right` (or the Tailwind
 * `ml-`/`mr-`/`pl-`/`pr-`/`border-l`/`border-r` classes that compile to the
 * same thing) is pinned to a screen side; written as `-start`/`-end` (or
 * `ms-`/`me-`/`ps-`/`pe-`/`border-s`/`border-e`), it is pinned to a position
 * in reading order instead, and both this app's own NativeWind version and
 * React Native itself resolve that against direction correctly either way.
 *
 * Scoped to margin, padding and border (width/color/corner-radius) — the
 * box-model properties `marginLeft`/`paddingRight`/`ml-`/`pr-` exemplify —
 * inside `src/components/`, `src/screens/` and `src/exercises/`, the same
 * three directories `check:theme` and `check:writing` already hold to a
 * source-wide property. Two adjacent things are deliberately NOT in scope,
 * so a reader doesn't wonder why this check let them through:
 *
 *  - **`left`/`right`/`top`/`bottom` positioning** (`position: 'absolute'`
 *    offsets, `-right-1`/`-top-1` badge corners). A different style domain
 *    from the box-model properties this item names, and at least one real
 *    use in this app (a notification badge pinned to a corner) may be a
 *    deliberate design choice rather than a bug — changing it needs a
 *    design decision this check cannot make, not a mechanical swap.
 *  - **`textAlign: 'left'`/`'right'` and the Tailwind `text-left`/
 *    `text-right` classes it compiles from.** React Native's own
 *    `textAlign` style has no `'start'`/`'end'` value to swap to — only
 *    `'auto' | 'left' | 'right' | 'center' | 'justify'` — and `'auto'` is
 *    not a like-for-like substitute: it aligns by each Text's own detected
 *    content direction, which is exactly what the `writingDirection: 'ltr'`
 *    pairing exists to override for English copy sitting near Urdu script.
 *
 * A line legitimately staying physical marks itself `check:direction-ok`,
 * the same escape hatch `check:theme` uses for depicted colour — visible at
 * the site rather than hidden in a list inside this file.
 *
 * Run with: npm run check:direction
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SCOPE = ['components', 'screens', 'exercises'].map((d) => path.join(ROOT, 'src', d));

const problems = [];
const bad = (file, line, msg) => problems.push(`${path.relative(ROOT, file)}:${line}  ${msg}`);

/** Blank comments out but keep their newlines, so line numbers still point at
 *  the code they came from. See check-theme.js — same shape, same reason. */
function stripComments(src) {
  const blankOut = (m) => m.replace(/[^\n]/g, ' ');
  return src.replace(/\/\*[\s\S]*?\*\//g, blankOut).replace(/\/\/[^\n]*/g, blankOut);
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(entry.name)) out.push(p);
  }
  return out;
}

// Tailwind utility classes that compile to a physical margin, padding or
// border property. `(?=[-"'\`\s]|$)` requires a delimiter or end right after,
// so `border-l` cannot match inside some future unrelated `border-lg-ish`
// token — none exists today, but the check should not depend on that.
const TAILWIND_PHYSICAL = /\b(?:ml|mr|pl|pr)-\S|\bborder-[lr](?=[-"'`\s]|$)/g;

// The inline-style equivalents, matched as object keys — in the three shapes
// a property can actually appear as one, not just `name: value`.
//
// THE CRITIC reviewing this found the `name\s*:` shape alone lets a real
// reintroduction through silently: object shorthand (`{ marginLeft }`, no
// colon at all) is a live idiom in this very codebase for other props
// (`{ color }` in `Stats.tsx`, `LessonComplete.tsx`) and was reproduced —
// adding `{ marginLeft }` to a scoped file left `check:direction` reporting
// clean. A quoted key (`{ 'marginLeft': 4 }`) has the same gap. Both are
// covered below; a fully computed key
// (`{ [cond ? 'marginLeft' : 'marginRight']: 4 }`) is covered too, not
// because the pattern parses the computation, but because the quoted-name
// alternative below matches the string literal itself wherever it appears —
// the intent is still visible to a plain scan even when the key it becomes
// is not.
const NAMES =
  'marginLeft|marginRight|paddingLeft|paddingRight|borderLeftWidth|borderRightWidth|borderLeftColor|borderRightColor|borderTopLeftRadius|borderTopRightRadius|borderBottomLeftRadius|borderBottomRightRadius';
const STYLE_PHYSICAL = new RegExp(
  `\\b(${NAMES})\\s*:` + // explicit key: value
    `|['"](${NAMES})['"]` + // a quoted key, or a quoted string used to build a computed one
    `|\\b(${NAMES})\\b(?=\\s*[,}])`, // object shorthand — no colon, so bounded by what ends an object entry instead
  'g'
);

const files = SCOPE.flatMap((d) => walk(d));

for (const file of files) {
  const raw = fs.readFileSync(file, 'utf8');
  const code = stripComments(raw).split('\n');
  const comments = raw.split('\n'); // the marker lives in a comment, so read that unstripped

  code.forEach((line, i) => {
    if (comments[i].includes('check:direction-ok')) return;
    for (const m of line.matchAll(TAILWIND_PHYSICAL)) {
      bad(
        file,
        i + 1,
        `physical Tailwind class near \`${m[0]}\` — this directory can render Urdu; use the ms-/me-/ps-/pe-/border-s/border-e logical equivalent`
      );
    }
    for (const m of line.matchAll(STYLE_PHYSICAL)) {
      const name = m[1] || m[2] || m[3];
      bad(
        file,
        i + 1,
        `physical style property \`${name}\` — this directory can render Urdu; use its Start/End logical equivalent`
      );
    }
  });
}

if (problems.length) {
  console.error(
    `check:direction — ${problems.length} physical direction propert${problems.length === 1 ? 'y' : 'ies'} in src/components, src/screens or src/exercises:\n`
  );
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log(
  `check:direction — no physical margin/padding/border-left/right property in src/components, src/screens or src/exercises.`
);
