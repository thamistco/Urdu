# 2026-10-31 · Tester, persona 8: offline on a train

Played by `qaaf-tester` (34 tool calls, about 14 minutes) on the 204ff5aa build, Both track, sound on. The network was cut with `setOffline` partway through a lesson.

## Where they would give up

Reloading offline partway through First words, at step 12 of 49, showed the browser's own "no internet" page, with nothing from Qaaf. A phone that throws away a background tab does the same. This is expected while P-111 (the service worker) is held.

**Nothing was lost.** Back online, the reload opened straight onto 12 of 49 with "Picking up where you left off · Start over". Completed lessons, XP and the streak were all kept. The review count went from 8 to 9 across the reload, so the grade written as the page closed was saved. Q-038 holds up offline.

## Other problems, worst first

1. **"Which one did you hear?" offline: no sound, and no way past (Q-160).** It came up at steps 6, 15 and 27 of 45, with only Close, Hear and four meanings. Tracing has "Can't trace now"; listening has no equivalent. Without headphones it happens even with a connection. In Unit 1 it costs nothing; past Unit 1 a wrong guess costs a heart (read in the code, not run).
2. **"The sound didn't load" on 44 of 45 steps and on the results screen (Q-161).** There is no single, steady "you're offline" line.
3. **Home's Continue card does not say a lesson is partway (Q-162).** It reads "Continue: First words" whether the lesson was left at 8 of 49 or never started.

## What went well

- Meet the letters finished offline: all 42 steps, the re-asks, the results. XP, gems, the streak and the achievement were kept.
- Leaving with ✕ offline gave the "picks up where you left off" dialog, and reopening landed on 8 of 49. Grades were kept on leaving (reviews 6 to 8).
- Offline, the Review tab, Daily review, Letter Lab and Profile all worked. Tapping Hear showed the notice instead of failing silently.

## What this run is not evidence for

- A script playing a persona is not a person.
- Headless Chromium is not a phone throwing away a tab, and the case where the page reloads when the network returns was not tried.
- The device voice fallback cannot be heard headless.
- Answers were random and the run stayed inside Unit 1, where hearts are free.
- The matching board was not answered.
- The Roman track was not run.
- The live site was not checked.
