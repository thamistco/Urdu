# 2026-10-11 · Performance and reliability: a long session (area 9)

A `qaaf-qa` agent measured what the 10-08 run left inconclusive, memory over a
long session, on the deploy-shaped build in headless Chromium (30 tool calls,
15.8 minutes). Heap figures are V8's after forced garbage collection.

## Fixed tonight: every lesson ever opened stayed in memory (914b96a)

Opening a lesson from Home and closing it, ten times over, added almost
exactly the same each round, with no ceiling: about +6.2 MB of heap, +1,756
page elements and +200 event listeners a lesson, two more history entries, and
one more hidden lesson left in the page each time. Lessons opened slower as they
piled up (108 to 170 ms at first, 242 to 289 ms after ten). Three lessons
played back to back showed the same growth (heap 22.4, 29.5, 36.2 MB).

The cause: every way out of a lesson called `navigate('Main')`, which in React
Navigation 7 pushes a new Home over the old one rather than going back to it.
They now pop back to Home.

| Six lessons opened and closed | Before           | After           |
| ----------------------------- | ---------------- | --------------- |
| Heap                          | 13.8 to 52.3 MB  | 13.8 to 15.2 MB |
| Page elements                 | 2,022 to 14,300  | flat at 2,138   |
| Lessons left mounted          | 6                | 0               |
| Time to open a lesson         | rising to 221 ms | 72 to 98 ms     |

`check:controls` now opens and closes three lessons and fails if any is left
in the page; against the old build it fails with all three still there.

## The bundle

The main bundle is 3.67 MB raw, 902 KB gzipped (899 KB on 10-08).

- **The course data** (22 modules, 591 KB raw) is 131 KB gzipped, about 15% of
  the bundle; words 24 KB, sentences 20 KB, grammar 14 KB, glyph masks 10 KB.
  `licences.json` adds 10 KB gzipped and is needed only on the Licences
  screen (Q-036).
- **The voice clip index is bigger than all the course data:** the manifest is
  46 KB gzipped, plus 5,502 one-line modules each holding one hashed mp3 path
  (150 KB), together 196 KB, 22% of the bundle. Proposal P-045: on the web,
  write a plain list of clip names and one base path instead of one `require`
  per clip (an estimated 150 KB or more, not measured). Against: the per-clip
  cache-busting hashes go, and native still needs `require`.

## Not evidence for

A desktop CPU in a shared container is not a phone, and after-GC heap is not
the browser's total memory. Three full lessons plus ten open-and-close rounds:
where memory would have levelled off, or whether a phone's browser would have
crashed, was not measured. Gzip sizes are local; GitHub Pages' compression was
not measured. Not covered: 320x568 and the Roman track.
