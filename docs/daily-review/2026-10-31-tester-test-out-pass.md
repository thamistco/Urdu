# 2026-10-31 · Tester, route 3 again: testing out of Unit 2, and a beginner who taps ahead

Played by `qaaf-tester` (about 25 minutes over two sittings, cut by a usage limit). The first sitting ran on the 204ff5aa build; the second on 52cbebbf, the build with the question asked before a test-out. Both track for the heritage speaker; Roman track for the beginner. This is P-137's second check, from the learner's side. The first was the critic's.

## The heritage speaker passes

- **Before tapping:** the review row on Home says "Unit review · Test out early".
- **The opening:** "Already know this unit? 22 questions on the 5 lessons … about 3 minutes. Get every question on a lesson right first time and it's marked known … No hearts." Three buttons: Start the test, First lesson instead, Not now. They found it clear.
- **The test:** 20 of 22 questions were on Unit 2. There were 4 letters, then family words asked as "how do you say it", "which did you hear", "type it" and "what does it mean".
- **The result:** answered 22 of 22 right. "5 lessons marked as known: The jeem family, Family 1, Family 2, More family 1, More family 2." skippedLessons held all five. No hearts were charged, and Home's Continue moved on to Unit 3.

On the earlier build, question 3 was a trace. It failed when drawn with a mouse, and that left the letters lesson to take. Test-outs no longer ask traces (4393cf80).

## The beginner who taps Unit 3's review by mistake

- The opening was understandable, and "Not now" went back to Home.
- **"First lesson instead" opened Unit 3's first lesson,** past all of Unit 1. Fixed in 776b6569: "My next lesson instead" opens what Home's Continue would.
- **"No hearts" at the opening, then "Free until Unit 1 is done" on the badge inside.** Fixed in 776b6569: the badge says "Free this lesson".
- **Leaving said what was answered "still counts towards your reviews",** which a test-out does not do. Fixed in 776b6569.
- **The opening counted the questions wrong.** It said 22 on the 5 lessons, and 2 of them were Unit 1 words. Fixed in 776b6569: a test-out asks only its own items.

## Recorded, not fixed

- Every node ahead on the path shows a padlock, the review included, though a tap jumps ahead. Only the label says so (Q-164).
- The results screen right after a passed test-out says "Hearts are on from here … a wrong answer costs one". After a test that cost nothing, this reads like a penalty (Q-165).
- On the Roman track, numbers show as Eastern Arabic numerals (۱۰, ۸), and "Type the Urdu for this" is the prompt even though Roman spelling is accepted (Q-166).
- Skipped lessons show a small fast-forward badge with no word beside it. Their label says "Skipped as already known" (Q-164).

## What this run is not evidence for

- A script picked the answers from the course data, the audio file name and a rule for letter positions. It is not a person who hears and reads.
- On the new build: one full pass, three steps of the beginner case, and the two ways out. No near pass, no fail, and no trace.
- The trace failure on the old build came from scripted mouse strokes, not a hand or a touchscreen.
- One phone size, English, dark theme, no screen reader.
