# P-137 test-out: learning specialist (2026-10-31)

## Findings (measured by loading the generator and data directly, no build)

- **Real learner (graded on every earlier unit): 0 own items asked in Units 2 to 41**, so 7 of 242 item-bearing lessons can be skipped, and all 7 are in Unit 1. With an empty schedule it is 175 of 242. Unit 2 asks v-family-more-p2 2 items, and it needs 3.
- 67 lessons teach no word or letter (grammar, sentences, readings). A review can never mark them known. Judgement: correct, a word quiz cannot certify grammar.
- Units have 1 to 10 item-bearing lessons. Reviews are 22 to 31 questions.
- **False passes, binomial model, 4-option pick, measured.** Take a learner who knows half of a lesson. With 3 asked (3/3 needed) they pass 24% of the time. With 4 asked (4/4) they pass 15%. With 5 asked (4/5) they pass 38%. A learner who knows the lesson but slips 5% of the time passes 81% at 4/4. Short mastery tests misclassify (Wilcox 1976; Huynh 1980).

## Viewpoints

- **Heritage speaker who cannot read:** this is who test-out is for. Drilling material they already know harms experts (expertise reversal: Kalyuga et al. 2003). On Both, passing means they can _read_ it, which is the course's aim.
- **Beginner:** must never meet a test-out by accident. Today it opens on "1 of 22" with no explanation.
- **Roman track:** letter lessons are already excluded, so the design needs nothing extra.
- **Teacher:** a lesson passed on 4 items leaves its other 1 to 8 items unscheduled. Asking them anyway is the honest way to test before teaching. A missed pretest still helps learning later (Richland, Kornell & Kao 2009), so wrong answers should cost nothing.
- **Against:** remove it, or offer "I know this". Self-assessment is loosely tied to real skill (Li & Zhang 2021 meta-analysis: r = .466; Ross 1998 reports "considerable variation"). That makes a manual skip all false passes. Onboarding placement (P-005) already serves speakers. Duolingo learners say Jump here "cannot be undone", and failing sends them back. Qaaf's skips stay open, which lowers the stakes. Judgement: keep it, because removing it abandons heritage speakers who are mid-course.

## Proposal (one, buildable in a day)

1. **Tell a test-out from a review:** it is a unit review opened while any item-bearing lesson of its unit on this track is neither done nor skipped. Add `testOutLessons(unitLessons, reviewId, done, romanTrack)` in `src/lib/unitSkip.ts`. LessonScreen computes it once at open and keeps it in the resume snapshot.
2. **Items:** `TEST_OUT_PER_LESSON = 4`, taken from each of those lessons' `taughtByLesson` items with a seeded shuffle keyed on `visit`, so a retake asks different ones. Add `testOutRefs` in `src/lib/review.ts`. `buildLessonExercises` (generator.ts) takes an optional `testOut` list. Graded or due items fill only what is left of the review's normal size. Length is max(size, 4 × lessons), at most 40, or 6 minutes at BENCHMARKS' 9 s each, inside its 3 to 8 minute target.
3. **Pass per lesson:** 4 of 4 right first time. Drop the unit-wide 80% gate, since partial credit is what Duolingo's placement moved to. Change the floor to min(10, 4 × lessons) in `lessonsToSkip`.
4. **Hearts:** none lost and no hearts wall. Guard `loseHeart` and the wall at LessonScreen.tsx:352/596. Against: it becomes free practice when hearts run out. Accept, and award review gems only.
5. **What the learner sees:** Home's review node gets the label "Test out of {unit}: skip what you know". Its first screen is an ungraded card: "4 questions on each of the {L} lessons you haven't done (~{m} min). All 4 right and that lesson is marked known; you can still open it. No hearts." It has "Start" and "First lesson instead". The eyebrow says "Test out". LessonComplete lists the lessons not passed.
6. **check:srs:** the invariant is unchanged when `testOut` is absent. Add checks that a test-out asks exactly 4 of each listed lesson's items and nothing else ungraded, and that a review reached in order is not a test-out. Break each on purpose.

**Verify:** `unitSkip.test.ts` covers 4/4 pass, 3/4 fail, a unit with one lesson, and the Roman track. Rerun measure.js with prior-known learners: 242 of 242 reachable on a perfect run, up from 7. Rerun tester route 3, including the end screen it never reached.

**Risks and unsure:** the guessing rate depends on how many sampled items are recognition questions. Asking one typed or built question per lesson would lower it, but I have not measured that. Whether item ids repeat across lessons is unchecked. The 15% false-pass rate is the price of a 4-question sample. A follow-up could put a passed lesson's unasked items into the schedule. Track switching after a skip is not handled.

Sources: [Richland et al. 2009](https://learninglab.uchicago.edu/Pre-Testing_files/RichlandKornellKao.pdf); [Kalyuga et al. 2003](https://ro.uow.edu.au/edupapers/136); [Li & Zhang 2021](https://sage.figshare.com/collections/A_meta-analysis_of_self-assessment_and_language_performance_in_language_testing_and_assessment/5021492); [Ross 1998, cited](https://www.kansai-u.ac.jp/fl/publication/pdf_education/17/00_yoshizawa_65.pdf); [Huynh 1980](https://link.springer.com/doi/10.1007/BF02294075); [Duolingo partial credit](https://blog.duolingo.com/partial-credit-improvements-to-duolingos-placement-test/); [Reddit, Jump here](https://lr.us.psf.lt/r/duolingo/comments/163onv4/updates_to_danish_too/jy5w36o/?context=3); [Duoplanet, hearts](https://newsletter.duoplanet.com/posts/why-duolingo-binned-this-feature). Blocked: lingoly.io and lr.us.psf.lt did not resolve, so learner voices come from search snippets only. Wilcox 1976 is cited from a search result and was not read.
