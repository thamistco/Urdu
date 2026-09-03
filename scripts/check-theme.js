/* eslint-disable */
/**
 * Hold the theme to the promise it makes.
 *
 * `src/theme/colors.ts` says every colour in the app goes through it, so that
 * re-theming is one file. Three things quietly break that promise, and none of
 * them shows up in a typecheck or, crucially, on screen — the app just becomes
 * two themes at once and nothing looks broken.
 *
 *  1. **tailwind.config.js drifting from colors.ts.** NativeWind resolves
 *     `bg-ink-700` against the config, not against the `palette` object, so the
 *     two are separate sources of truth kept in step by hand. They have already
 *     come apart once: across two full re-themes the config still held the
 *     original "comic" indigo and yellow, so every className colour kept the old
 *     look while every inline `palette.x` moved. This compares them token by
 *     token, in both directions.
 *
 *  2. **A colour written as raw hex inside a component.** The palette stops
 *     being where colour lives, and the next person tuning the scenery has to go
 *     looking inside an SVG. (Which is how the whole sky ramp ended up
 *     hard-coded in `LatticeBackground`.)
 *
 *  3. **A token nothing uses.** The most invisible of the three. `skyHorizon`
 *     and `mossNear` survived a scenery rewrite that stopped needing them and
 *     sat in the palette looking like available choices, while really being
 *     scraps of a picture that no longer existed.
 *
 * **Depicted colour is exempt, and says so at the site.** A red word has to be
 * red through any re-theme, or a learner is shown the interface accent and
 * asked to name it "red"; a silver league that re-themes to orange is just a
 * wrong silver. Those literals mark themselves — `check:theme-ok` on a line, or
 * `check:theme-off` … `check:theme-on` around a region — so the exemption is
 * visible where the code is instead of hidden in a list inside this file.
 *
 * Exits non-zero on any of the three. `npm run check:theme`.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const COLORS = path.join(SRC, 'theme', 'colors.ts');
const TAILWIND = path.join(ROOT, 'tailwind.config.js');

const problems = [];
const bad = (file, line, msg) => problems.push(`${path.relative(ROOT, file)}${line ? `:${line}` : ''}  ${msg}`);

/** Blank comments out but keep their newlines, so line numbers still point at
 *  the code they came from. Deleting them outright shifts every later line and
 *  makes the report accuse innocent code — which it has done before. */
function stripComments(src) {
  const blankOut = (m) => m.replace(/[^\n]/g, ' ');
  return src.replace(/\/\*[\s\S]*?\*\//g, blankOut).replace(/\/\/[^\n]*/g, blankOut);
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(p);
  }
  return out;
}

const HEX = /'(#[0-9A-Fa-f]{3,8})'|"(#[0-9A-Fa-f]{3,8})"/g;

// ---------------------------------------------------------------- the tokens

const colorsSrc = fs.readFileSync(COLORS, 'utf8');
const paletteBody = colorsSrc.slice(
  colorsSrc.indexOf('export const palette'),
  colorsSrc.indexOf('export const withAlpha')
);

const tokens = [];
for (const m of stripComments(paletteBody).matchAll(/^\s{2}([a-zA-Z]\w*)\s*:\s*'(#[0-9A-Fa-f]{3,8})'/gm)) {
  tokens.push({ name: m[1], hex: m[2].toUpperCase() });
}
if (tokens.length < 20) {
  console.error(`Only parsed ${tokens.length} palette tokens — this check is broken, not the theme.`);
  process.exit(1);
}
const byName = new Map(tokens.map((t) => [t.name, t]));

// ------------------------------------------- 1. tailwind mirrors the palette

/**
 * Tailwind nests (`ink: { DEFAULT, 800 }`) where the palette is flat
 * (`ink`, `ink800`), so the two names have to be brought together before they
 * can be compared. `DEFAULT` is the bare token; anything else is appended,
 * with a leading capital for word suffixes (`paper.soft` → `paperSoft`) and
 * plain for numeric ones (`ink.800` → `ink800`).
 */
const flatName = (group, key) =>
  key === 'DEFAULT' ? group : /^\d+$/.test(key) ? `${group}${key}` : `${group}${key[0].toUpperCase()}${key.slice(1)}`;

const twSrc = stripComments(fs.readFileSync(TAILWIND, 'utf8'));
const twBody = twSrc.slice(twSrc.indexOf('colors: {'), twSrc.indexOf('fontFamily:'));
const tw = new Map();
{
  let group = null;
  for (const line of twBody.split('\n')) {
    const open = line.match(/^\s{8}([a-zA-Z]\w*):\s*\{\s*$/);
    if (open) {
      group = open[1];
      continue;
    }
    if (/^\s{8}\},?\s*$/.test(line)) {
      group = null;
      continue;
    }
    const flat = line.match(/^\s{8}([a-zA-Z]\w*):\s*'(#[0-9A-Fa-f]{3,8})'/);
    if (flat) {
      tw.set(flat[1], flat[2].toUpperCase());
      continue;
    }
    const nested = line.match(/^\s{10}(DEFAULT|[a-zA-Z]\w*|\d+):\s*'(#[0-9A-Fa-f]{3,8})'/);
    if (nested && group) tw.set(flatName(group, nested[1]), nested[2].toUpperCase());
  }
}
if (tw.size < 15) {
  console.error(`Only parsed ${tw.size} tailwind colours — this check is broken, not the config.`);
  process.exit(1);
}

for (const [name, hex] of tw) {
  const t = byName.get(name);
  if (!t)
    bad(
      TAILWIND,
      null,
      `\`${name}\` (${hex}) is not in the palette — a class name resolving to a colour colors.ts has never heard of`
    );
  else if (t.hex !== hex)
    bad(
      TAILWIND,
      null,
      `\`${name}\` is ${hex} here and ${t.hex} in colors.ts — the two have drifted; className and inline styles are showing different colours`
    );
}
for (const t of tokens) {
  if (!tw.has(t.name))
    bad(
      TAILWIND,
      null,
      `\`${t.name}\` (${t.hex}) is in the palette but has no class name here — inline styles can reach it, \`className\` cannot`
    );
}

// ---------------------------------------------- 2. raw hex outside the theme

const files = walk(SRC);

for (const file of files) {
  if (file.startsWith(path.join(SRC, 'theme'))) continue;
  const raw = fs.readFileSync(file, 'utf8');
  const code = stripComments(raw).split('\n');
  const comments = raw.split('\n'); // markers live in comments, so read those unstripped
  let off = false;
  code.forEach((line, i) => {
    const marker = comments[i];
    if (marker.includes('check:theme-off')) off = true;
    if (marker.includes('check:theme-on')) {
      off = false;
      return;
    }
    if (off || marker.includes('check:theme-ok')) return;
    for (const m of line.matchAll(HEX)) {
      const hex = (m[1] || m[2]).toUpperCase();
      const known = tokens.find(
        (t) =>
          t.hex === hex || (hex.length === 4 && t.hex === `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`)
      );
      bad(
        file,
        i + 1,
        known
          ? `raw hex ${hex} — that is \`palette.${known.name}\`; use the name so re-theming stays one file`
          : `raw hex ${hex} outside the theme — add it to src/theme/colors.ts, or mark it \`check:theme-ok\` if it is depicted colour rather than interface colour`
      );
    }
  });
  if (off) bad(file, null, 'a `check:theme-off` region is never closed — add `check:theme-on`');
}

// --------------------------------------------------------- 3. unused tokens

const consumers = files
  .filter((f) => f !== COLORS)
  .map((f) => fs.readFileSync(f, 'utf8'))
  .join('\n');
// A token can be spent two ways: `palette.x` at runtime, or a Tailwind class
// name in a `className` string. Both count.
const classNames = new Set();
for (const m of consumers.matchAll(
  /(?:bg|text|border|from|via|to|fill|stroke|ring|shadow|decoration|caret|divide|outline|accent|placeholder)-([a-z]+)(?:-([a-z0-9]+))?/g
)) {
  classNames.add(flatName(m[1], m[2] === undefined ? 'DEFAULT' : m[2]));
}
// colors.ts may forward a token into the `theme` object; that is a use too.
const forwarded = stripComments(colorsSrc.slice(colorsSrc.indexOf('export const theme')));

for (const t of tokens) {
  if (new RegExp(`\\bpalette\\.${t.name}\\b`).test(consumers)) continue;
  if (classNames.has(t.name)) continue;
  if (new RegExp(`palette\\.${t.name}\\b`).test(forwarded)) continue;
  bad(COLORS, null, `\`${t.name}\` (${t.hex}) is defined but nothing uses it — spend it or delete it`);
}

// ---------------------------------------------------- 4. text you can read
//
/**
 * Faded text has a floor, and it is 55%.
 *
 * `text-paper/40` is a designer's way of saying "quieter", and quieter is a
 * legitimate thing to want. The trouble is that opacity is not a volume knob:
 * below a certain point the text is not quiet, it is failing WCAG AA, and
 * nothing in the app said where that point was.
 *
 * Measured against the three grounds text actually sits on in this app, at the
 * paper colour body copy is set in:
 *
 *   ground            /40     /50     /55     /60
 *   ink               3.51✗   4.74✓   5.47✓   6.27✓
 *   card ink800       3.43✗   4.57✓   5.23✓   5.94✓
 *   card ink700       3.24✗   4.21✗   4.76✓   5.36✓
 *
 * Re-measured after the card surfaces were rotated onto the background
 * photograph's hue: the rotation was solved to hold each token's luminance, and
 * the whole table moved by at most a hundredth. That is what "luminance matched"
 * buys — the colour of the app changed and none of its legibility did.
 *
 * 55 is the lowest step that clears 4.5:1 on all three, so it is the floor. It
 * was set by finding 57 strings below it, in seventeen files, every one of them
 * illegible on at least one surface it was drawn on. The steps underneath were
 * never a hierarchy, they were five degrees of unreadable.
 *
 * This is a class-name rule rather than a rendered measurement, which makes it
 * cheap and slightly conservative: it cannot see that a given line happens to
 * sit on a darker card. That is the right way round for a floor.
 *
 * URD-052: `text-paper/40` is not the only way to write this colour. A
 * component's `style` prop can build the identical faded paper with
 * `withAlpha(palette.paper, 0.4)` directly — same hex, same alpha, same
 * pixel on screen — and until this fix that spelling was invisible here:
 * this rule pattern-matched the Tailwind className in file *text*, so a
 * `withAlpha` call read as ordinary code, not as a colour to hold to the
 * floor. Found live: `Button.tsx`'s disabled-label fix first read
 * `withAlpha(palette.paper, 0.4)` — 3.24:1 against `ink700`, the exact
 * worst-case value the table above measured and named the reason 55% is
 * the floor — and `check:theme` reported clean.
 *
 * Matched only for `palette.paper` specifically, not `withAlpha` in
 * general — this floor is about the one colour body text is set in on
 * this app's own grounds (the table above), not a claim about every token
 * `withAlpha` ever fades. A different token's own legibility is a
 * different measurement this rule does not make.
 *
 * Matched only when it is assigned to a *text* colour prop — `color:` (a
 * style object's own text colour) or `placeholderTextColor=` (a
 * `TextInput`'s placeholder, which is text too) — not `withAlpha
 * (palette.paper, …)` wherever it appears. The same faded paper is also a
 * legitimate, unrelated `borderColor`/`backgroundColor` in this app (a
 * disabled button's border, a step-indicator dot, a drop-zone's dashed
 * outline) — none of those put paper-coloured *text* on screen, so none of
 * them are a WCAG text-contrast question at all, and a rule this specific
 * would report three false positives for every real one it caught if it
 * matched the token everywhere. `color`/`Color` is deliberately
 * case-sensitive here — `borderColor`/`backgroundColor` are a different
 * identifier, not a substring match away from `color`.
 *
 * THE CRITIC, reviewing this item: this only catches the value written
 * *inline* — `color: withAlpha(palette.paper, 0.4)` — on one physical
 * line. Two gaps were found and fixed in URD-065 and URD-066:
 *   • URD-065: a variable holding `withAlpha(...)` and used in a text-colour
 *     prop (`const text = disabled ? withAlpha(...) : ...; style={{ color: text }}`)
 *   • URD-066: a ternary whose `withAlpha` call sits on a different line
 *     after Prettier wraps it (multi-line expressions where the expression value
 *     spans multiple lines in the source)
 * These are now caught by `checkVariableWithAlpha()` and
 * `checkInlineWithAlphaMultiline()` below.
 */
const PAPER_FLOOR = 55;
const WITH_ALPHA_PAPER =
  /\b(?:color|placeholderTextColor)\s*[:=]\s*\{?\s*[^\n{}]*?withAlpha\(\s*palette\.paper\s*,\s*([\d.]+)\s*\)/g;

/**
 * URD-066: for inline `color:` or `placeholderTextColor=` with multi-line
 * ternary expressions wrapped by Prettier.
 *
 * Finds patterns like:
 *   color: active
 *     ? palette.gold
 *     : withAlpha(palette.paper, 0.4),
 *
 * By looking for `color:` or `placeholderTextColor=` followed by lines
 * containing `withAlpha(palette.paper, N)`, stopping at the next property
 * key (indicated by a line starting with spaces and a property name).
 *
 * This is a conservative check: it only matches when `withAlpha` appears
 * on a different line than the property key, to complement the single-line
 * regex and avoid false positives from sibling properties.
 */
function checkInlineWithAlphaMultiline(src, file, lineAt) {
  const lines = src.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Look for `color:` or `placeholderTextColor=`
    const keyMatch = line.match(/\b(?:color|placeholderTextColor)\s*[:=]/);
    if (!keyMatch) continue;

    const keyIndex = line.indexOf(keyMatch[0]);

    // Check if the value is on the same line
    const afterKey = line.slice(keyIndex + keyMatch[0].length);
    if (afterKey.match(/withAlpha\s*\(\s*palette\.paper\s*,\s*([\d.]+)\s*\)/)) {
      // Single-line case — already handled by WITH_ALPHA_PAPER regex
      continue;
    }

    // Multi-line case: look at the following lines until we hit another property
    // or a closing brace/paren
    let foundWithAlpha = null;
    for (let j = i + 1; j < lines.length; j++) {
      const nextLine = lines[j];

      // Stop if we hit another property definition (typically starts with spaces, then identifier, then `:` or `=`)
      if (nextLine.match(/^\s+[a-zA-Z_$]\w*\s*[:=]/)) {
        break;
      }

      // Stop if we hit a closing brace or paren at the start
      if (nextLine.match(/^\s*[}\)]/)) {
        break;
      }

      // Look for withAlpha call
      const alphaMatch = nextLine.match(/withAlpha\s*\(\s*palette\.paper\s*,\s*([\d.]+)\s*\)/);
      if (alphaMatch) {
        foundWithAlpha = alphaMatch[1];
        // Report the violation at the line where withAlpha appears
        const pct = Math.round(Number(foundWithAlpha) * 100);
        if (pct < PAPER_FLOOR) {
          bad(
            file,
            j + 1,
            `\`withAlpha(palette.paper, ${foundWithAlpha})\` is under the ${PAPER_FLOOR}% legibility floor — it fails WCAG AA on every ground in this app`
          );
        }
        break;
      }
    }
  }
}

/**
 * URD-065: forward data-flow trace for `withAlpha(palette.paper, N)` assigned
 * to a local variable and then used in a text-colour prop.
 *
 * Finds `const X = ... withAlpha(palette.paper, N) ...` patterns and tracks
 * uses of that variable name in `color:` or `placeholderTextColor=` assignments
 * after the declaration.
 *
 * This cannot see through function calls or more complex indirection (would
 * need an AST walk), but catches the pattern Button.tsx and similar files use:
 * `const text = disabled ? withAlpha(...) : OTHER_COLOUR` followed by
 * `style={{ color: text }}`.
 */
function checkVariableWithAlpha(src, file, lineAt) {
  // Find all `const/let/var X = ... withAlpha(palette.paper, N) ...`
  // declarations in the entire file.
  const varDeclPattern =
    /(?:const|let|var)\s+(\w+)\s*=\s*([^;]*?withAlpha\s*\(\s*palette\.paper\s*,\s*([\d.]+)\s*\)[^;]*);/g;

  let varMatch;
  while ((varMatch = varDeclPattern.exec(src)) !== null) {
    const varName = varMatch[1];
    const varDeclIndex = varMatch.index;
    const alpha = varMatch[3];
    const pct = Math.round(Number(alpha) * 100);

    // If the variable's alpha is already at or above the floor, skip it.
    if (pct >= PAPER_FLOOR) continue;

    // Find the next closing brace or end of file to define the scope.
    // Look for closing brace at the same indentation level as the var declaration.
    let scopeEnd = src.length;
    let braceCount = 0;
    let parenCount = 0;

    for (let pos = varDeclIndex; pos < src.length; pos++) {
      const char = src[pos];
      if (char === '{') braceCount++;
      else if (char === '}') {
        braceCount--;
        if (braceCount < 0) {
          scopeEnd = pos;
          break;
        }
      } else if (char === '(') parenCount++;
      else if (char === ')') parenCount--;
    }

    const scope = src.slice(varDeclIndex, scopeEnd);

    // Now search for uses of this variable in text-colour props within
    // this scope. Look for patterns like:
    // - `color: varName`
    // - `color={varName}`
    // - `placeholderTextColor={varName}`
    // - `placeholderTextColor=varName`
    const usePattern = new RegExp(`\\b(?:color|placeholderTextColor)\\s*[:=]\\s*\\{?\\s*${varName}\\b`, 'g');

    let useMatch;
    while ((useMatch = usePattern.exec(scope)) !== null) {
      const useIndex = varDeclIndex + useMatch.index;
      bad(
        file,
        lineAt(useIndex),
        `variable \`${varName}\` containing \`withAlpha(palette.paper, ${alpha})\` (${pct}%) is used in a text-colour prop — under the ${PAPER_FLOOR}% legibility floor`
      );
    }
  }
}

for (const file of files) {
  const src = stripComments(fs.readFileSync(file, 'utf8'));
  const lineAt = (index) => src.slice(0, index).split('\n').length;
  for (const m of src.matchAll(/text-paper\/(\d+)/g)) {
    const pct = Number(m[1]);
    if (pct >= PAPER_FLOOR) continue;
    bad(
      file,
      lineAt(m.index),
      `\`text-paper/${pct}\` is under the ${PAPER_FLOOR}% legibility floor — it fails WCAG AA on every ground in this app`
    );
  }
  for (const m of src.matchAll(WITH_ALPHA_PAPER)) {
    // `withAlpha` takes a 0-1 fraction (see its own definition in
    // colors.ts) where `text-paper/N` names a 0-100 percentage — rounded
    // rather than compared as a float, so 0.55 (which is not exactly
    // representable in binary) reads as the floor itself, not one hair
    // under it.
    const pct = Math.round(Number(m[1]) * 100);
    if (pct >= PAPER_FLOOR) continue;
    bad(
      file,
      lineAt(m.index),
      `\`withAlpha(palette.paper, ${m[1]})\` is under the ${PAPER_FLOOR}% legibility floor — it fails WCAG AA on every ground in this app`
    );
  }
  // URD-065: Check for withAlpha calls assigned to variables and then used
  // in text-colour props.
  checkVariableWithAlpha(src, file, lineAt);
  // URD-066: Check for inline withAlpha calls in multi-line ternaries.
  checkInlineWithAlphaMultiline(src, file, lineAt);
}

// ------------------------------------------------------------------ report

if (problems.length) {
  console.error(`check:theme — ${problems.length} problem${problems.length === 1 ? '' : 's'}\n`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log(
  `check:theme — ${tokens.length} palette tokens, all spent, tailwind.config.js agrees with all of them, no raw hex outside the theme, no faded text under the legibility floor.`
);
