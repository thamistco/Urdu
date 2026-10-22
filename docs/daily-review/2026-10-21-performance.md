# 2026-10-21 · Performance and reliability (area 9): the first screen's fonts, and offline

Reviewed by `qaaf-design` (30 tool calls, read-only) in Chromium with the CPU
slowed 4x, a cold context and one run per cell, at 390x844. Chromium's "Fast
3G" and "Slow 4G" presets are the same profile (562.5 ms, 1.44 Mbps), so the
second condition was Fast 4G (165 ms, 8.1 Mbps). `serveDist` sends no gzip, so
timings come from a gzip server built on the same asset resolver.

## The first screen's Nastaliq (P-096): the premise was wrong

The front door's قاف wordmark is set in **Nastaliq bold** (`<Urdu>` defaults
to bold), but it is the regular weight that is preloaded, and nothing on the
door uses it. The bold loads after the first paint, so the logo shows a thin
fallback face until it arrives.

| Slow 4G / Fast 4G      | First paint  | Door usable  | Wordmark in Nastaliq | KB at door / +12s |
| ---------------------- | ------------ | ------------ | -------------------- | ----------------- |
| (a) as built           | 10.0 / 2.9 s | 10.5 / 3.2 s | 15.9 / 4.8 s         | 1,316 / 2,203     |
| (b) bold preloaded too | 10.7 / 3.1 s | 11.1 / 3.5 s | at the door          | 1,564 / 2,324     |
| (c) bold blocked       | 9.9 / 2.9 s  | 10.2 / 3.3 s | never                | 1,316 / 2,075     |

In (a) the fallback shows for 5.4 s on Slow 4G and 1.6 s on Fast 4G. A fourth
arrangement (bold preloaded, regular not) gave an unexplained Slow 4G result
in one run and is inconclusive.

**Decided tonight:** no change to loading, only the comment in `App.tsx` that
said the bold sets "only the numerals on a few cards", which was false.
Preloading bold costs about 0.6 s of first paint on a slow connection to fix
a logo that is right 5 seconds later. The better fix is to draw the wordmark
as an outline (SVG), so the door needs no Nastaliq at all and both font
preloads can leave the critical path. **Against that:** a second rendering of
the name to keep in step, and lesson Urdu still needs bold within seconds.
Recorded in P-096.

## Offline

- **"Hear" offline played nothing and said nothing.** Fixed tonight: a notice,
  "The sound didn't load. Check your connection.", for four seconds, only when
  the device reports being offline (a first version also fired online, where
  a browser can decline to autoplay). `check:stability` requires it offline
  and its absence online.
- **Reloading offline shows the browser's own "No internet" page.** There is no
  service worker, yet the manifest says `display: standalone`, so a learner
  who installed Qaaf to the home screen and opens it on a train sees no app
  and no reason (P-111).
- **These work offline once loaded:** the Review tab, opening a lesson,
  teaching cards, tracing, Check and Continue.

## The bundle

The JavaScript is 3,620 KB raw, 885 KB gzipped. Four Nastaliq font files of
about 530 KB each are deployed; the 500 and 600 weights are never fetched by
anyone. Fetched on the front door and not used there: the regular Nastaliq
(248 KB gzipped), five reward sounds (508 KB), and two preloaded faces whose
FontFace stays unloaded (about 73 KB).

## Proposals

- **P-096 (revised):** the wordmark as an outline, then both Nastaliq weights
  off the critical path. Against: as above.
- **P-111:** a minimal service worker caching the app shell and fonts, so an
  installed app opens offline. **Against:** stale deploys on Pages, and cache
  invalidation becomes a new way for a deploy to fail. Needs its second check.
- Defer the reward sounds and the unused preloads off the front door
  (P-096's list).

## What this is not evidence for

One run per cell, on a desktop CPU slowed 4x and a local server; gzip on .ttf
is assumed of Pages. Nothing about real phones, Safari or iOS, or audio heard.
320x568 offline was not tried.
