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

// ------------------------------------------------------------------ report

if (problems.length) {
  console.error(`check:theme — ${problems.length} problem${problems.length === 1 ? '' : 's'}\n`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log(
  `check:theme — ${tokens.length} palette tokens, all spent, tailwind.config.js agrees with all of them, no raw hex outside the theme.`
);
