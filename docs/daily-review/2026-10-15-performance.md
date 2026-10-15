# 2026-10-15 · Performance and reliability (area 9)

`qaaf-design`, 32 tool calls, 8.5 minutes, read-only. The deploy-shaped
build served locally with gzip under /Urdu; Chromium, slow 4G (150 ms,
1.6 Mbps), 4x CPU, cold cache, fresh profile, three runs each at 390x844 and
320x568.

## Findings

- **The layout shift QA measured (CLS 0.145) is one bug**, a loop on the
  sign-in screen: `onLayout` measured the band whose `minHeight` it set from
  that measurement, so it grew 24 px a pass and the controls slid 270 px up
  the first screen, in 12 shifts over about 370 ms. **Fixed tonight**
  (61df810): the content inside the band is measured. Measured after, on a
  cold load: CLS 0 at 390x844 (was 0.145, 12 shifts), 0.01 at 320x568 (was
  0.124). The controls settle lower, where the layout always meant them to.
- **Where the first screen's time goes** (the agent's runs): the 895 KB of JS
  downloads alongside the six preloaded fonts; main-thread evaluation is one
  long task of 1.45–1.77 s; about 0.45 s more to first text; the reward
  sounds (507 KB) and the evening picture follow and hold the line for 5 s.
- **6,693 of 6,695 modules run before the first screen.** The voice clip index
  (5,500 path modules plus the manifest) is 188 KB gzipped, 21% of the bundle,
  and the first screen needs none of it (P-045).

## The font preloads: two measurements disagree

The agent measured first paint about 1.8 s _later_ with the fonts preloaded
(11.1 s against 9.3 s) and proposed dropping Noto Nastaliq from the preload.
Re-measured tonight with the harness from 13 October, same throttling, three
cold runs each on this build:

| Preloaded        | Usable at     |
| ---------------- | ------------- |
| All six (today)  | 8.54–8.57 s   |
| None             | 9.53–9.66 s   |
| All but Nastaliq | 10.76–10.85 s |

Kept as they are. The agent's server sent `no-store`, and it saw three fonts
fetched twice, which doubles the font traffic on a shared line and would
explain the opposite result. Neither is a phone on GitHub Pages; the honest
test is a real slow phone.

## Proposals

- **P-045** (already queued) the voice index as data: about 188 KB gzipped and
  5,500 fewer module evaluations. Against: per-clip hashes go, and native still
  needs `require`.

## What this is not evidence for

A desktop CPU, local serving, no returning learner (no hydration figure), and
no split of evaluation time by module.
