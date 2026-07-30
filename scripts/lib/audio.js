/* eslint-disable */
/**
 * Is this clip actually audible?
 *
 * Google's TTS occasionally answers a perfectly valid request with HTTP 200 and
 * a fragment of near-silence. Nothing about the response says so — the status is
 * 200, the body is a well-formed MP3, and it decodes. Twenty-nine of the
 * course's 2,893 clips were like that, including seven of the forty alphabet
 * letters and ہاں, بھائی and بیٹا from the first lessons, and the only reason
 * anyone found out was a learner reporting that one word was "barely audible".
 *
 * Every one of them succeeds on a plain retry, so this is a transient fault with
 * a trivial fix — but only if something looks at what came back. That is what
 * this is for: the generator checks each clip before writing it, and
 * check-voice.js checks the whole bundled set.
 */

const { execFileSync, execFile, spawnSync } = require('child_process');
const fs = require('fs');

/**
 * A real clip peaks around −3 dB; a failed one sits below −38 dB, and the two
 * groups do not overlap anywhere near this line. Set generously — the cost of a
 * false positive is one wasted retry, and the cost of a false negative is a word
 * the learner cannot hear.
 */
const MIN_PEAK_DB = -25;

/**
 * Every genuine clip in the course is at least 0.48s; every failed one is at
 * most 0.34s. Used on its own only when ffmpeg is unavailable, since at a
 * constant 32 kbps the file size *is* the duration and nothing else can be
 * measured without a decoder.
 */
const MIN_SECONDS = 0.45;
const BYTES_PER_SECOND = 4000; // 32 kbps CBR, as the API returns it

let ffmpegChecked = false;
let haveFfmpeg = false;

/** Is ffmpeg on this machine? Probed once; absence is not an error. */
function ffmpegAvailable() {
  if (!ffmpegChecked) {
    ffmpegChecked = true;
    try {
      execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });
      haveFfmpeg = true;
    } catch {
      haveFfmpeg = false;
    }
  }
  return haveFfmpeg;
}

/**
 * Peak amplitude in dB, or null if it cannot be measured. `volumedetect`
 * reports on stderr and writes no output file.
 */
function peakDb(file) {
  if (!ffmpegAvailable()) return null;
  // spawnSync, not execFileSync: volumedetect reports on stderr, and
  // execFileSync only hands back stdout. Reading the wrong stream made this
  // return null for every clip, which sent the caller down its no-ffmpeg
  // fallback and had it blame a missing ffmpeg that was installed all along.
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', 'volumedetect', '-f', 'null', '-'], {
    encoding: 'utf8',
  });
  return parse(`${r.stderr || ''}`);
}

function parse(text) {
  const m = /max_volume:\s*(-?[\d.]+) dB/.exec(text);
  return m ? Number(m[1]) : null;
}

/**
 * Why this clip is unusable, or null if it is fine.
 *
 * @param {string} file path to an .mp3
 * @returns {string|null}
 */
function clipProblem(file) {
  let bytes;
  try {
    bytes = fs.statSync(file).size;
  } catch {
    return 'missing';
  }
  if (bytes === 0) return 'empty file';

  const seconds = bytes / BYTES_PER_SECOND;
  const peak = peakDb(file);
  if (peak === null) {
    // No decoder: fall back to length alone, which separates the two groups
    // here but would not catch a long silence.
    const why = ffmpegAvailable() ? 'level unreadable' : 'ffmpeg unavailable';
    return seconds < MIN_SECONDS ? `only ${seconds.toFixed(2)}s (${why}, length checked alone)` : null;
  }
  if (peak < MIN_PEAK_DB) return `silent — peaks at ${peak.toFixed(1)} dB over ${seconds.toFixed(2)}s`;
  return null;
}

/** Same test against a buffer that has not been written yet. */
function bufferProblem(buffer, tmpPath) {
  if (!buffer || !buffer.length) return 'empty response';
  fs.writeFileSync(tmpPath, buffer);
  try {
    return clipProblem(tmpPath);
  } finally {
    try {
      fs.unlinkSync(tmpPath);
    } catch {
      // ignore
    }
  }
}

/**
 * The same check across many files at once.
 *
 * ffmpeg costs about a fifth of a second per clip, and there are nearly three
 * thousand of them, so doing this one at a time takes ten minutes and no CI job
 * would keep it. Eight at a time takes under one.
 */
async function findProblems(files, concurrency = 8) {
  const results = [];
  let next = 0;
  const worker = async () => {
    while (next < files.length) {
      const file = files[next++];
      const problem = await clipProblemAsync(file);
      if (problem) results.push({ file, problem });
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, files.length) }, worker));
  return results;
}

function clipProblemAsync(file) {
  return new Promise((resolve) => {
    let bytes;
    try {
      bytes = fs.statSync(file).size;
    } catch {
      return resolve('missing');
    }
    if (bytes === 0) return resolve('empty file');
    const seconds = bytes / BYTES_PER_SECOND;
    if (!ffmpegAvailable())
      return resolve(
        seconds < MIN_SECONDS ? `only ${seconds.toFixed(2)}s (ffmpeg unavailable, length checked alone)` : null
      );
    execFile(
      'ffmpeg',
      ['-hide_banner', '-nostats', '-i', file, '-af', 'volumedetect', '-f', 'null', '-'],
      (err, _stdout, stderr) => {
        const peak = parse(`${stderr || ''}`);
        if (peak === null) return resolve(`unreadable${err ? `: ${err.message.split('\n')[0]}` : ''}`);
        resolve(peak < MIN_PEAK_DB ? `silent — peaks at ${peak.toFixed(1)} dB over ${seconds.toFixed(2)}s` : null);
      }
    );
  });
}

module.exports = { clipProblem, bufferProblem, findProblems, ffmpegAvailable, MIN_PEAK_DB, MIN_SECONDS };
