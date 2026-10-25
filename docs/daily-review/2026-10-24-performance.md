# 2026-10-24 · Performance and reliability (area 9): is offline honest?

Reviewed by `qaaf-design` (32 tool calls, about 6 minutes, read-only) on the
0736a24 build in Chromium 153, for launch-bar row R6: "an installed app opens
offline, or does not claim to be installable".

## Findings

1. **Chrome offers to install an app that cannot open offline.** The manifest
   says `display: standalone`, scope and start URL `/Urdu/`, one 1024px icon;
   `Page.getInstallabilityErrors` returns none at 390 and 320 wide, so Chrome's
   menu offers "Install app" (since Chrome 108 on mobile, 112 on desktop, no
   service worker is needed for that). There is no service worker. After one
   visit, with the cache past its lifetime, opening the app offline shows the
   browser's dinosaur, and so does reloading an open lesson. Within the cache
   lifetime (Pages is said to send `max-age=600`, second hand: the live
   headers could not be fetched from here) it opens to Home. So offline works
   for about ten minutes after a visit, and not after.
2. **What a first lesson needs to work offline: about 2.3 MB,** not the 46 MB
   of voice clips. The shell is 1.56 MB gzipped (JS 885 KB, seven fonts 671
   KB, CSS and HTML), the five reward sounds 508 KB (uncompressed WAV), Home's
   two scenery images 176 KB, and l-1's letter clips 6 KB each, fetched as
   they play. Every file but `index.html` and the manifest carries a content
   hash in its name, which is what makes stale deploys avoidable.
3. **First load on Slow 4G is unchanged:** the front door usable at 10.3 s
   (10.5 s on 21 October), and, newly measured, a seeded learner opening l-1
   cold reaches "A new letter" at 10.2 to 10.3 s.
4. **33 of the 40 deployed font files were never fetched,** 3.26 MB raw, not
   only Nastaliq's two unused weights (Q-083): App.tsx imported each family
   from its package's index, which requires every weight.

## Fixed tonight

- **Only the seven fonts the app loads are shipped** (Q-083): each weight is
  imported by its own file. An export ships 7 font files, 1.4 MB, the same
  files by content hash as before.

## Proposal, for a second check on another night

**P-111, shaped for GitHub Pages:** pages network-first, falling back to the
cached shell; hashed files cache-first, since a new deploy gets new names;
an explicit precache list of the ~2.3 MB above, keyed by the bundle hash,
never a glob of `assets/`; old caches deleted on activate; `skipWaiting` and
`clients.claim` (safe with network-first pages, since an online open always
gets the new deploy); a kill-switch `sw.js`; and a browser check that cuts the
network and opens the app. Against: a broken worker survives deploys and is a
new way for a deploy to fail.

The other honest answer, `display: "browser"`, is one line
(`scripts/inject-web-meta.js`) and loses the full screen, the app's own entry
in the task switcher and the Android install. Recommended: P-111.

## What this is not evidence for

Real phones, iOS or Safari, an actual installed window (headless Chromium
cannot render one), the live Pages headers, or l-1 offline beyond its first
card.
