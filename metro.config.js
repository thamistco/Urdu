/**
 * Metro's configuration.
 *
 * ## Why file access is throttled here
 *
 * The app ships every word as a recorded clip, and with a second voice that is
 * 5,786 audio files, each a statically-required module so the bundler
 * fingerprints and copies it. Metro reads them with a single `Promise.all` over
 * the whole set, so it asks the operating system to open all 5,786 at once. The
 * file-descriptor limit here is 4,096 — soft *and* hard — so the build died:
 *
 *     Error: EMFILE: too many open files, open 'assets/voice-m/w-gaari.mp3'
 *
 * `ulimit -n` cannot raise it past the hard limit, and a build that only works
 * on a machine configured a particular way is not a build. This is not a limit
 * to raise; it is concurrency to bound.
 *
 * `graceful-fs` is the usual answer and does not work here: `gracefulify`
 * patches the callback API, and Metro reads assets through `fs.promises`, which
 * it leaves alone. Patched with it, the build failed the same way one stage
 * earlier — during resolution rather than asset collection.
 *
 * So the promise API is wrapped directly, with a semaphore. Every call still
 * happens; at most LIMIT of them are in flight, and the rest wait. That is the
 * same bargain graceful-fs makes, applied where the reads actually are.
 *
 * The alternative was to stop bundling clips as modules and fetch them by URL.
 * That shrinks the module graph, and it also means the app stops knowing at
 * build time whether a clip exists — `check:voice` would move from a build
 * failure to a 404 in a learner's ear, which is the wrong direction for the one
 * failure this project keeps having.
 */

/**
 * Comfortably under the 4,096 limit, leaving room for the descriptors Metro,
 * its workers and Node itself already hold. Higher was not measurably faster:
 * the work is bounded by reading 48 MB of audio, not by how many reads are
 * queued at once.
 */
const LIMIT = 256;

function throttleFsPromises() {
  const fsp = require('fs').promises;
  let active = 0;
  const waiting = [];

  const next = () => {
    if (active >= LIMIT || !waiting.length) return;
    active++;
    waiting.shift()();
  };

  const wrap =
    (fn) =>
    (...args) =>
      new Promise((resolve, reject) => {
        waiting.push(() => {
          fn.apply(fsp, args)
            .then(resolve, reject)
            .finally(() => {
              active--;
              next();
            });
        });
        next();
      });

  // Only the calls that open a descriptor. `stat` and friends are cheap and
  // wrapping everything would add queueing overhead to the hot path for no gain.
  for (const name of ['readFile', 'open', 'readdir', 'copyFile', 'writeFile']) {
    const original = fsp[name];
    if (typeof original === 'function') fsp[name] = wrap(original);
  }
}

throttleFsPromises();

const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
