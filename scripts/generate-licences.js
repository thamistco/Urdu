/* eslint-disable */
/**
 * Write the licence notices for everything the app ships that someone else
 * made: every npm package in the bundle, and every font.
 *
 * MIT, BSD and the SIL Open Font License each allow commercial use on one
 * condition: their copyright notice and licence text go with every copy. The
 * web bundle is minified, and measured, it carries zero licence comments, so
 * until this existed the app shipped 87 packages and three typefaces with none
 * of the notices they are licensed on. That is survivable for a free preview
 * and not for an app people pay for.
 *
 * The list is read from the bundle, not from package.json. `dependencies` in
 * the lockfile names 993 packages, most of them the Expo CLI and the build
 * toolchain, and some of those are MPL or CC-BY. None of them reach a learner.
 * So this exports the app with source maps and takes every `node_modules/…`
 * path the maps name. That is the set that ships, and it is the set that needs
 * notices.
 *
 * Each package's own LICENSE file is copied verbatim when it has one. Twenty
 * don't (the Expo packages, Metro's runtime, React Native's polyfills). For
 * those the notice is the standard text of the licence their package.json
 * declares, with the copyright holder taken from the package's author or, for
 * packages with no author, the owner of the repository it names. A package
 * with none of that fails the run rather than getting a guessed notice.
 *
 * Fonts: the copyright line is read from each shipped font file's own name
 * table, so it is what the file itself says, and the licence is OFL 1.1.
 *
 *   node scripts/generate-licences.js           rewrite src/data/licences.json
 *   node scripts/generate-licences.js --check   fail if it is out of date
 *
 * `--check` runs in CI as check:licences. A dependency added or removed
 * without regenerating fails the deploy.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'src/data/licences.json');
const TEXTS = path.join(__dirname, 'lib/licence-texts');
const check = process.argv.includes('--check');

/** Repository owners whose packages name no author, and who they are. */
const REPO_OWNERS = {
  facebook: 'Meta Platforms, Inc. and affiliates.',
  expo: '650 Industries, Inc. (aka Expo)',
};

/** Packages in the bundle, from the source maps of a real export. */
function bundledPackages() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'harf-licences-'));
  try {
    execSync(`npx expo export --platform web --source-maps --output-dir ${dir}`, { cwd: ROOT, stdio: 'pipe' });
    const js = path.join(dir, '_expo/static/js/web');
    const names = new Set();
    for (const f of fs.readdirSync(js).filter((f) => f.endsWith('.map'))) {
      for (const src of JSON.parse(fs.readFileSync(path.join(js, f), 'utf8')).sources) {
        const all = src.match(/node_modules\/((?:@[^/]+\/)?[^/]+)/g);
        // The innermost node_modules is the package the file belongs to.
        if (all) names.add(all[all.length - 1].replace('node_modules/', ''));
      }
    }
    // Fonts are assets rather than modules, so the maps do not name them.
    const fonts = [];
    const walk = (d) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.(ttf|otf)$/i.test(e.name)) fonts.push(p);
      }
    };
    walk(dir);
    // Read while the export still exists; it is deleted on the way out.
    return { names: [...names].sort(), fonts: fonts.map(fontNotice) };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/** Copyright (0), family (1, 16) and licence (13, 14) from a TrueType name table. */
function fontNames(file) {
  const b = fs.readFileSync(file);
  const tables = b.readUInt16BE(4);
  for (let i = 0; i < tables; i++) {
    const rec = 12 + 16 * i;
    if (b.toString('ascii', rec, rec + 4) !== 'name') continue;
    const off = b.readUInt32BE(rec + 8);
    const count = b.readUInt16BE(off + 2);
    const strings = off + b.readUInt16BE(off + 4);
    const out = {};
    for (let j = 0; j < count; j++) {
      const e = off + 6 + 12 * j;
      const platform = b.readUInt16BE(e);
      const id = b.readUInt16BE(e + 6);
      if (platform !== 3 || out[id]) continue; // Windows records are UTF-16BE
      const len = b.readUInt16BE(e + 8);
      const start = strings + b.readUInt16BE(e + 10);
      let s = '';
      for (let k = 0; k < len; k += 2) s += String.fromCharCode(b.readUInt16BE(start + k));
      out[id] = s;
    }
    return out;
  }
  throw new Error(`${file} has no name table`);
}

const template = (spdx) => {
  const f = path.join(TEXTS, `${spdx}.txt`);
  if (!fs.existsSync(f)) throw new Error(`No standard text for ${spdx} in ${TEXTS}`);
  return fs.readFileSync(f, 'utf8');
};

function packageNotice(name) {
  const dir = path.join(ROOT, 'node_modules', name);
  const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  const license = pkg.license || (pkg.licenses && pkg.licenses.map((l) => l.type).join(' OR '));
  if (!license) throw new Error(`${name} declares no licence`);
  const file = fs.readdirSync(dir).find((f) => /^(licen[cs]e|copying)(\.|$)/i.test(f));
  if (file) return { name, version: pkg.version, license, text: fs.readFileSync(path.join(dir, file), 'utf8').trim() };

  const author = typeof pkg.author === 'string' ? pkg.author : pkg.author && pkg.author.name;
  const repo = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository && pkg.repository.url;
  const owner = repo && (/github\.com[/:]([^/]+)\//.exec(repo) || [])[1];
  const holder = (author && author.replace(/\s*<[^>]*>/, '').trim()) || REPO_OWNERS[owner];
  if (!holder) throw new Error(`${name} has no licence file, no author and no known repository owner`);
  const body = template(license).replace(/^Copyright .*$/m, `Copyright (c) ${holder}`);
  return { name, version: pkg.version, license, text: body.trim() };
}

function fontNotice(file) {
  const names = fontNames(file);
  // The typographic family (16) when a font has one, since the plain family
  // (1) names the weight too: "Fraunces Thin". Otherwise 1: "Public Sans".
  const family = names[16] || names[1];
  if (!/Open Font License/i.test(`${names[13]} ${names[14]}`))
    throw new Error(`${path.basename(file)} does not declare the Open Font License; check its terms by hand`);
  return { family, copyright: names[0] };
}

function build() {
  const { names, fonts } = bundledPackages();
  const entries = names.map(packageNotice);

  // One entry per typeface, not per weight: every weight of a family carries
  // the same copyright line and licence.
  const families = new Map();
  for (const n of fonts) if (!families.has(n.family)) families.set(n.family, n.copyright);
  const ofl = template('OFL-1.1').trim();
  for (const [family, copyright] of [...families].sort()) {
    entries.push({ name: `${family} (typeface)`, version: '', license: 'OFL-1.1', text: `${copyright}\n\n${ofl}` });
  }

  // Identical texts stored once. Many Expo packages share a file word for word.
  const texts = [];
  const index = new Map();
  const out = entries.map(({ text, ...rest }) => {
    if (!index.has(text)) {
      index.set(text, texts.length);
      texts.push(text);
    }
    return { ...rest, text: index.get(text) };
  });
  return JSON.stringify({ packages: out, texts }, null, 1) + '\n';
}

const fresh = build();
if (check) {
  const committed = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  const parse = (s) => (s ? JSON.parse(s).packages.map((p) => `${p.name}@${p.version}`) : []);
  if (committed !== fresh) {
    const was = new Set(parse(committed));
    const now = new Set(parse(fresh));
    console.error('check:licences — src/data/licences.json does not match what the app ships.');
    for (const p of now) if (!was.has(p)) console.error(`  shipped but not listed: ${p}`);
    for (const p of was) if (!now.has(p)) console.error(`  listed but not shipped: ${p}`);
    console.error('\nRun `node scripts/generate-licences.js` and commit the result.');
    process.exit(1);
  }
  const { packages, texts } = JSON.parse(fresh);
  console.log(
    `check:licences — ${packages.length} notices (${texts.length} distinct texts) match what the bundle ships.`
  );
} else {
  fs.writeFileSync(OUT, fresh);
  const { packages, texts } = JSON.parse(fresh);
  console.log(`Wrote ${packages.length} notices (${texts.length} distinct texts) to ${path.relative(ROOT, OUT)}.`);
}
