/* eslint-disable */
/**
 * Load the app's TypeScript content modules from a plain Node script.
 *
 * The content lives in `.ts` files that import each other, and the checks are
 * CommonJS scripts run straight by `node`. Transpiling on the fly is how the
 * content audit has always read them; this is that loader, lifted out so every
 * check reads the same content the app does rather than re-parsing the source
 * with regexes and slowly drifting from it.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const ts = require(path.join(ROOT, 'node_modules', 'typescript'));
const cache = new Map();

function load(rel) {
  const resolved = [rel, rel + '.ts', path.join(rel, 'index.ts')]
    .map((p) => path.join(ROOT, p))
    .find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
  if (!resolved) throw new Error(`cannot resolve ${rel}`);
  if (cache.has(resolved)) return cache.get(resolved);

  const js = ts.transpileModule(fs.readFileSync(resolved, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
  }).outputText;
  const mod = { exports: {} };
  cache.set(resolved, mod.exports);
  const here = path.relative(ROOT, path.dirname(resolved));
  new Function('exports', 'module', 'require', js)(mod.exports, mod, (id) =>
    id.startsWith('.') ? load(path.join(here, id)) : require(id)
  );
  cache.set(resolved, mod.exports);
  return mod.exports;
}

/** The content every check tends to want, loaded once. */
function loadData() {
  const words = load('src/data/words');
  const letters = load('src/data/letters');
  const sentences = load('src/data/sentences');
  return {
    WORDS: words.WORDS,
    LETTERS: letters.LETTERS,
    SENTENCES: sentences.SENTENCES,
    PASSAGES: sentences.PASSAGES,
    DIALOGUES: sentences.DIALOGUES,
  };
}

module.exports = { load, loadData, ROOT };
