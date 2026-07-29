/* eslint-disable */
/**
 * Can every bundled clip actually be heard?
 *
 * A learner reported that one word — ہوا — was "barely audible and too short".
 * It was neither quiet nor clipped: the file was 0.34 seconds of near-silence at
 * −42 dB, against a median clip of 1.5 seconds at −3 dB. Google's TTS had
 * answered the request with HTTP 200 and a well-formed MP3 containing nothing,
 * and the generator, which only checked the status code, wrote it to disk and
 * recorded it as done.
 *
 * Measuring all 2,893 found twenty-nine more of them — including seven of the
 * forty alphabet letters, in a course whose spine is the alphabet, and ہاں,
 * بھائی and بیٹا from the first lessons. One report, thirty broken clips. So the
 * bundled set gets measured rather than trusted.
 *
 * Run with:  npm run check:voice
 */

const fs = require('fs');
const path = require('path');
const { findProblems, ffmpegAvailable } = require('./lib/audio');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets', 'voice');

if (!fs.existsSync(OUT_DIR)) {
  console.log('No assets/voice directory — nothing to check.');
  process.exit(0);
}

const clips = fs
  .readdirSync(OUT_DIR)
  .filter((f) => f.endsWith('.mp3'))
  .sort();

if (!clips.length) {
  console.log('No clips on disk — the app will fall back to device speech.');
  process.exit(0);
}

if (!ffmpegAvailable())
  console.log('ffmpeg not found — checking length only, which catches this failure but not a long silence.\n');

(async () => {
const found = await findProblems(clips.map((f) => path.join(OUT_DIR, f)));
const broken = found
  .map(({ file, problem }) => `${path.basename(file, '.mp3')}: ${problem}`)
  .sort();

// The manifest is what the app actually loads, so a clip on disk that is not in
// it is dead weight, and an id in it with no file is a crash waiting to happen.
const manifest = fs.readFileSync(path.join(ROOT, 'src', 'lib', 'voiceManifest.ts'), 'utf8');
const listed = new Set([...manifest.matchAll(/^\s*'([^']+)':/gm)].map((m) => m[1]));
const onDisk = new Set(clips.map((f) => f.replace(/\.mp3$/, '')));
for (const id of listed) if (!onDisk.has(id)) broken.push(`${id}: in the manifest but not on disk`);

console.log(`${clips.length} clips checked · ${listed.size} in the manifest`);

if (broken.length) {
  console.log(`\n${broken.length} unusable:`);
  for (const b of broken.slice(0, 40)) console.log('  •', b);
  if (broken.length > 40) console.log(`  … and ${broken.length - 40} more`);
  console.log('\nRe-run `npm run gen:voice` with a key set; silent responses are now retried.');
  process.exit(1);
}
console.log('every clip is audible');
})();
