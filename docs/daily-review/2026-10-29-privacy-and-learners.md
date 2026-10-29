# 2026-10-29 · Analytics, feedback and privacy (area 14); what learners say (area 15)

Two agents ran tonight, both read-only:

- **`qaaf-growth`** (22 tool calls, about 2 minutes) covered area 14. ico.org.uk did not resolve, so its points on the Children's code come from law-firm summaries. It is not legal advice.
- **`qaaf-learner-voice`** (22 tool calls, about 2 minutes) covered area 15. Every source is a search summary; none was opened.

## Area 14

### Built and shipped: P-128 and P-127, the privacy and terms text

**P-128, privacy.** It now says:

- there is no analytics;
- guests, children included, send nothing about themselves to us;
- what signing in sends;
- under-13s should not sign in without a parent or carer.

**P-127, terms.** They now:

- leave a stated placeholder for who runs Qaaf (O-11);
- say where progress is kept and what loses it;
- allow family and classroom use;
- drop "continuing to use means you accept".

**Second check** (`qaaf-critic`: a parent of a ten-year-old, legal accuracy against the code, the case against): **HOLD on both**, no blocking findings.

- **Privacy:** "nothing anyone does in Qaaf leaves the device" was false on the website, because GitHub Pages logs every request, including each clip played.
- **Privacy:** the list of what signing in sends left out:
  - the name and picture Google shares;
  - the starting answers;
  - sign-in records.
- **Privacy:** Delete account only works on the child's device, while signed in as them.
- **Terms:** "stored only on this device" was false for a signed-in learner.
- **Terms:** the list of what loses progress missed Safari deleting a site's storage after about a week unopened.

All were fixed, and the re-check passed both: **SHIP**. Its three minor points were also fixed:

- the Safari week names Safari and browsers on an iPhone, not the iPhone app;
- sign-in records are counted as a record of use;
- the device voice also reads the English meaning when that setting is on.

The critic checked against the code and found:

- no analytics, telemetry or beacon of any kind;
- no network call for a guest;
- the league is made up, and Say it back never uploads.

### Recorded for the owner, not raised as a question

- **COPPA (United States).** Naming classroom use, alongside an open invitation to children, moves Qaaf towards being "directed to children". "Please don't sign in" is not verifiable parental consent. A lawyer should see this before launch.
- **Safari storage.** Safari's deletion of stored data after about a week unopened is a real bug, not just wording: a guest on an iPhone who takes a two-week break loses everything. It is already Q-069, before launch.

### Decided, not built

- **P-130, "Something wrong?"** The spec is ready:
  - a row in Settings › Data and a link on Lesson complete;
  - the note is kept on the phone, the last 20 of them;
  - the note and its context are shown before Copy;
  - a new `qaaf-reports` key, which is a new store, not a rename;
  - `expo-clipboard`, with a fallback where WebKit refuses.

  It needs a privacy-page section and a second check, so it waits for a night of its own.

- **Q-005, measuring retention: option A, do not measure before launch.**
  - The numbers would be tiny.
  - Paid ads are already held.
  - Any request would end "nothing leaves the device".

  A `firstDay` field would make option B possible later. It is not added tonight: the owner decides whether B ever runs.

## Area 15: what brings learners back on day 2 and day 7

**Benchmarks** (vendor pages, so weak): education apps keep about 14 to 15% of users on day 1 and 2 to 8% on day 30.

**What helps:**

- **Showing the goal and the streak separately.** Duolingo's own blog reports 3.3% better day-14 retention. Qaaf already does this.
- **Choosing a commitment, even an unenforced one.** This is secondhand.
- **One missed day hardly harms a habit** (Lally).

**Qaaf's gap:** the welcome back needs a broken streak of 3 or more. A learner who did one or two days and returns on day 5, the typical week-one dropout, sees a bare 0.

**Proposals:**

- **P-074 strengthened**, not new.
- **P-138, a quiet return card for broken streaks of 1 to 2.** It shows no number, says what was learned, and names the next lesson.
  - Against: P-011's second check rejected "1-day streak" as hollow praise.
- **P-139, gain wording on day 2 only:** "One more today makes a 2-day streak".
  - Against: Duolingo uses loss framing on purpose, and there is no direct evidence either way.
- **P-140, a finite letter milestone on the script track** ("14 of 38 letters"). Check Home and Profile first.

## What this is not evidence for

- No Qaaf learner data, and no Urdu learner's own account of week one.
- No primary benchmarks.
- No primary ICO, PECR or COPPA text.
- No lawyer's reading.
