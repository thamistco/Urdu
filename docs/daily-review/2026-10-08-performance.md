# 2026-10-08 · Performance and reliability (area 9)

First review of this area. A `qaaf-qa` agent measured the deploy-shaped build
served locally, in headless Chromium on a 4-core container. "Low-end" below
means Chrome's CPU slowed 4x plus 1.6 Mbps down and 150 ms latency.

## What a first visit costs

| Measured                             | Value                                                                        |
| ------------------------------------ | ---------------------------------------------------------------------------- |
| dist/ on disk                        | 41.8 MB: 5,508 mp3 (32.7 MB), 40 fonts (4.64 MB), one JS bundle (3.66 MB)    |
| Downloaded to reach the sign-in door | 16 to 17 requests, 5.47 MB: JS 3.66 MB, 7 fonts 1.39 MB, 5 WAV sounds 520 KB |
| Door, unthrottled, cold              | 0.60, 1.70, 1.75 s                                                           |
| First lesson card, unthrottled, cold | 0.95 to 1.18 s                                                               |
| Door, low-end, cold                  | 22.8, 22.8, 23.2 s (the JS alone needs at least 18.3 s at that speed)        |
| First lesson card, low-end, cold     | 25.6, 25.8 s                                                                 |
| First word's sound, play to playing  | 31 to 50 ms unthrottled; 2.10 and 2.37 s low-end                             |

The JS bundle is 899 KB at gzip level 6; whether GitHub Pages serves it
compressed could not be measured from here (the proxy refuses the site).

## Fixed tonight

**A word whose sound failed to load stayed silent for good.** Block the
clips, open a lesson, and the speaker button never asked the network again,
even once it was back, until a reload. The failed Sound stayed in the cache.
It is now let go, so the next tap fetches the clip again. Measured both ways
with every mp3 blocked then allowed: before, one play() in total and no sound;
after, every tap retries and the clip plays once the network does.
`check:controls` now proves it, and fails against the old build. Commits
5b773e9, b3d73c5.

## Found and not fixed

- **Offline, the app shows only the browser's "no internet" page.** There is
  no service worker, so a reload with no network, or an installed home-screen
  copy opened offline, shows nothing of Qaaf. Proposal below.
- **Memory over a long session was inconclusive:** the agent's script
  finished no lesson, so one partial lesson (heap 13.9 to 15.6 MB) says
  nothing either way about a leak.

## Proposals, not built

1. **A service worker that keeps the app shell and the clips already heard**
   (P-016). Reloads and the installed app work offline; repeat visits skip
   the network. Against: a stale service worker can strand learners on an old
   bundle, Expo web has none built in, and caching 5.5 MB up front is heavy on
   a metered phone. M.
2. **Load the four reward sounds after the first tap, not at start**
   (P-017). They are 507 KB of WAV fetched alongside the fonts and the first
   clips. Against, and why it was not built tonight: the only evidence that
   they delay the first word is the agent's own unisolated guess, and there is
   no gain on a normal connection. Worth measuring before building.
3. **Split the 3.66 MB bundle.** On a slow phone the sign-in screen waits on
   it. Against: Metro web makes splitting hard, and it would make offline
   worse without the service worker. L.

## Not evidence for

A desktop CPU slowed 4x is not a phone. Local uncompressed serving is not
GitHub Pages and its CDN. Two or three runs per number, some while another
probe shared the CPU. A headless "playing" event does not prove anyone could
hear it.
