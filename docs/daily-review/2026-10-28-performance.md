# 2026-10-28 · Performance and reliability (area 9): offline, for launch bar R6

Reviewed by `qaaf-design` (18 tool calls, about 6 minutes, read-only) on the
dd991087 build, Chromium. The live site's headers could not be fetched (the
proxy refused), so nothing here is from Pages itself.

## Findings

1. **Chrome still offered to install an app that showed the offline
   dinosaur.**
   - The manifest says `display: standalone`, and Chrome reported no
     installability errors at 390 or 320.
   - No service worker was registered.
   - Opening the start address offline gave `ERR_INTERNET_DISCONNECTED`, and
     reloading an open lesson did the same.
   - Nothing had changed since 24 October.
2. **P-111 worked on that build without a rebuild.** Design served a scratch
   worker and registration. Offline:
   - l-1 reloaded to its first card, with Nastaliq drawn;
   - the start address opened Home with its scenery;
   - 20 files were precached, about 2.3 MB on the wire.
3. **First load was about the same as on 24 October.**

   | Profile                                    | Front door usable                  | Transferred when usable | Largest JS (gzipped) |
   | ------------------------------------------ | ---------------------------------- | ----------------------- | -------------------- |
   | Chromium "Slow 4G", CPU slowed 4x          | 10.85 and 10.88 s (24 Oct: 10.3 s) | 1,316 KB                | 885 KB               |
   | 150 ms, 1.6 Mbps ("3G Fast" in Lighthouse) | 9.67 and 9.50 s                    | 1,319 KB                | 885 KB               |

   The 3.70 MB raw script is still one chunk. The 0.5 s rise is within this
   machine's noise.

## Built, second-checked, held: P-111, the service worker

Design chose path (a), installable and working offline, with (b), no longer
claiming installability, as the fallback if (a) failed its check.

**What was built:**

- **Precache.** `web:meta` writes `dist/sw.js` and registers it, on export
  only. It precaches the shell, the CSS and JS, seven fonts, five sounds and
  two scenery images: 20 files, 2,080 KB gzipped.
- **Caching.**
  - Pages: network first, then the kept shell.
  - Hashed files: cache first.
  - Voice clips: kept as they are played, at most 300.
- **Updates.** Only this app's own `qaaf-` caches are deleted.
- **Kill switch:** `scripts/sw-kill.js`.
- **`check:offline`:** passed, and failed when broken two ways.

**Second check** (`qaaf-critic`, reliability over time, the fetch handler, a
learner's phone): **HOLD.** It stopped the server for real; the simple case
works. Two blockers and a risk remain.

1. **A stale shell after a deploy.** `cache.addAll` reads through the
   browser's HTTP cache, and Pages caches for ten minutes. So a learner who
   opens the app around a deploy can have the old page stored, naming a
   bundle that was just deleted. The app then opens blank offline until the
   next deploy. Reproduced with `max-age=600` added. Fix: precache with
   `cache: 'reload'`.
2. **`check:offline` could not fail on the cached page.** Playwright's
   offline switch does not cut the worker's own fetches. The server logged
   the worker fetching l-1 "offline", so a broken offline fallback would
   still pass. Fix: cut the network by closing the server. This is also why
   `check:stability`'s offline "Hear" test failed with the worker: it fetched
   the clip from the network.
3. **Safari and audio (untested here).** The worker answers media range
   requests with the whole file (200, not 206). Chromium plays it. Safari
   requests the first two bytes and expects a 206 (WebKit bug 184447). If
   Safari refuses, every clip on an iPhone goes silent. Fix: build a 206 from
   the cached file.

The critic also noted:

- Home at `/Urdu` lies outside the worker's scope. That is a router fix.
- The kill switch reinstalls on each visit while the registration tag
  remains.
- `index.html` is outside the version hash.
- There is no navigation preload.
- The audio cache drops the oldest stored clip, not the least recently
  played.
- The privacy page should say a copy of the app, and up to 300 played clips,
  is kept on the device.

**Held** as `held/P-111-service-worker-2026-10-28.patch`, with the fixes
above to make before its next check.

## Shipped instead: no longer claiming to be installable

The manifest now asks for a browser tab (`display: browser`):

- Chrome reports `manifest-display-not-supported` and no longer offers to
  install.
- "Add to Home screen" still names the shortcut from the manifest, and opens
  a tab.
- Lost until P-111 ships: full screen, a task-switcher entry, the Android
  install.

`check:installable` holds it: with no service worker in the build, `display`
must be `browser`. The check failed with `standalone` put back. Its second
check is in the agents report.

## What this is not evidence for

- Real phones, iOS or Safari, or an installed standalone window.
- Pages' own caching.
- An update across a real deploy.
- Audio offline beyond the clips already played.
- Timings beyond two runs each.
