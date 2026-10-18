# 2026-10-18 · Performance and reliability (area 9)

Measured by `qaaf-design` (16 tool calls, about 30 minutes, read-only) on its
own GitHub-Pages-like server: gzip on html, js, json, svg and ttf (gzipping
fonts is an assumption about Pages), ETag and 304s, `Cache-Control:
max-age=600`, real 404s. Throttled in Chromium: 150ms latency, 1.6 Mbps down,
750 kbps up, CPU 4x slower, cold profile, one run per size.

## Measured

|                                                | 390x844           | 320x568           |
| ---------------------------------------------- | ----------------- | ----------------- |
| Cold: first text, first button                 | 8.65 s, 8.65 s    | 8.55 s, 8.55 s    |
| Cold: the door tapped until the screen changes | 0.70 s            | 0.63 s            |
| Cold: long tasks (count, total, longest)       | 4, 2.97 s, 1.45 s | 4, 2.81 s, 1.36 s |
| Second visit within max-age: first text        | 1.23 s            | 0.96 s            |
| Cold deep link to a lesson: first step         | 8.81 s            | 8.98 s            |

- First load: 20 requests, 2,248 KB on the wire; a second visit inside 10
  minutes, 0 KB from the network. After 10 minutes Pages revalidates with
  304s, not measured.
- Largest files, gzipped: the bundle 884 KB; NotoNastaliqUrdu regular 248 KB
  and **bold 246 KB**; levelup.wav 207 KB; evening.jpg 120 KB; correct.wav
  116 KB; streak.wav 105 KB; incorrect.wav 67 KB.
- **Nastaliq bold is fetched on the cold first screen and not preloaded**, a
  246 KB font the 15 October table never counted. With honest caching no font
  was fetched twice, which supports that night's explanation of the
  disagreement (the agent's server sent no-store).
- **2,000 review cards** in storage (synthetic ids): storage 272 KB, first
  text 2.35 s against 1.92 s empty (+0.42 s), first long task 903 ms against
  741 ms; no freeze on load. Saving after each answer was not measured.

## Not measured (the agent's driver stuck on a tracing step)

Memory and DOM over three lessons, piling timers, a clip that 404s
mid-lesson, backgrounding mid-lesson (a 4-second freeze on a trace step left
no error: weak evidence), and the room on a wrong-answer banner at 200% text,
which is what P-020's "Report" needs next. The probe for that is ready
(`/tmp/design-1018/run2.js`); it needs the trace stroke `check:stability`
already uses.

## Proposals (first check)

- **P-096**: preload Nastaliq bold, or stop it loading on the first screen.
  Against: 15 October measured preloading as changing timing in ways no one
  expected, and 246 KB more at the front could delay the bundle on 1.6 Mbps;
  measure both before choosing.
- **P-017 (revisited)**: load the four reward sounds (495 KB together) when a
  lesson opens, not on the first screen, or re-encode them. Against: the first
  right answer might be silent.

## What this is not evidence for

One run per size on a desktop CPU slowed 4x, served locally; Chromium's
latency model; synthetic review ids; nothing about long sessions, 404s,
banners or text size.
