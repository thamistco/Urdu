# 2026-11-10 · The owner's QA feedback, worked through

The owner sent two QA passes on the live app and the repo. They found nothing broken and listed five things to fix. All five were worked by the manager, in the daytime, with the nightly review still paused. No agents were dispatched, so nothing here had a second check from another viewpoint. All five are bug fixes or a check, which ship at once under the project's rule.

The doc's guards were kept. The capital-T "Te" is untouched. No licence file changed. The audio architecture is unchanged, and the text-to-speech key was not used: the one content fix changed an English gloss, not Urdu, so no clip changed.

## What was done

| Finding                                                                    | What changed                                                                                                                                                                                                                                                             | Commit   | How it was checked                                                                                                                                                                                                                                                                                                                                      |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| کبھی کبھار glossed "rarely" (Q-185)                                        | Now "occasionally". The content review of 18 October had named it; it was never fixed.                                                                                                                                                                                   | 3fbf4639 | check:all, which runs the content checks                                                                                                                                                                                                                                                                                                                |
| Say it back silent when the microphone cannot be opened (Q-188)            | A new state: "Microphone unavailable" under the button, "Couldn't reach the microphone." announced, and the button labelled to try again.                                                                                                                                | 07f51ba8 | In Chromium, with the microphone allowed but recording made to fail: the build of 2 November tapped to nothing, as QA saw; this build shows and announces the message. Not tried on a real device or with a real missing microphone.                                                                                                                    |
| The playtest's deep-resume runs stopped on a false memory collapse (Q-189) | The harness no longer learns the step counter, the header's review labels, the hearts badge or a letter-spotting answer's "tile from the right" as words, and it recognises the typing prompt reworded on 27 October. The self-test holds each to the app's own wording. | a77a0fb4 | Each new self-test was seen failing with its fix removed. Seed 40044, three lessons each: from the start, after lesson 100 and after lesson 175, every lesson finished and no tripwire fired. Before: after 3 answers at 100 and 175, and in lesson 1 from the start, where the unchanged harness also stopped (so the start-of-course stop was older). |
| Deep links answered with the status 404 (Q-186)                            | The deploy writes a page for each of the 13 fixed addresses in the router's config, which GitHub Pages serves with 200. check-deployed now fails the deploy if any of them is not 200 with this commit.                                                                  | 9cefedd0 | Against a local server that answers as Pages does (an address is `name.html`, otherwise 404.html with 404): it failed with all 13 at 404 without the pages and passed with them. Whether Pages itself serves them is proven only by the deploy's own check (below).                                                                                     |
| One heavy web bundle (Q-187)                                               | Recorded, not changed. The web build is the preview; the store apps load the bundle from the device. P-045 (the clip index, about 150 KB gzipped) remains the first step if it is taken up.                                                                              | none     | Not measured again; the figures are QA's                                                                                                                                                                                                                                                                                                                |

## What this is not evidence for

- **The microphone fix on a phone.** The browser test made recording fail on purpose. A real phone with no microphone, or with one held by another app, was not tried.
- **Lesson and letter addresses.** True that morning: only the 13 fixed addresses answered 200. Later the same day every lesson and letter got a page too; see below.
- **Playtest findings.** Three lessons per run, one seed. The harness now produces evidence again at depth; nothing about the course is concluded from these short runs.
- **A second viewpoint.** True that morning: no agent had re-checked this work. `qaaf-critic` did later the same day; see below.

## Later the same day: "Fix everything, make it stable for the future"

The owner's next message. Read as: finish what the morning left open, harden whatever could break quietly later, and have someone else check the work. It was not read as the whole backlog, which holds 120 open items, most of them waiting on the owner, a native speaker, a real phone or a design decision.

### What was done

| What                                             | Commit             | How it was checked                                                                                                                                                                              |
| ------------------------------------------------ | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Every lesson and letter address answers 200      | 54d98c88, 125d2fcc | 403 pages and a list of them. The live check was run against a server that answers as Pages does: it passed complete, and failed with no pages, with no list, and with a list missing /privacy. |
| The deploy proves the share picture is served    | a3f9e69a           | Passed with the card; failed with it missing and with a web page under its name (Q-129).                                                                                                        |
| Privacy, Terms, Credits, Licences: Back is there | eeba3889, e6481e32 | check:links opens each cold, signed out and as a learner. Against the build of 2 November it fails on every page tried (Q-177).                                                                 |
| The legal pages' date cannot break mid-date      | 465f28c8           | Read on the page at 320px by the second check: one line (Q-121).                                                                                                                                |
| CI runs Node 22 and the current actions          | 77f65634           | check:all here already runs on Node 22. The v5 actions are proven only by the deploy itself.                                                                                                    |
| CI runs the playtest's self-test                 | 84cf4603, 3e6355bc | 126 assertions then, more now; each new one was seen failing with its wording changed.                                                                                                          |
| The offline sound check measures itself          | 34efd402           | Each of its three failure messages was made to happen. It saw a clip play offline for the first time, 27ms after the tap (Q-174).                                                               |
| Say it back names the right trouble              | e121bb69           | At 320px, no microphone, a refusal and a failed recorder each show their own words; the button column is 32 to 42px wide, from 110.                                                             |
| کبھی کبھار: "sometimes / occasionally"           | 92cdb9f4           | Shares a sense with کبھی, so the generator's own rule keeps them out of one question.                                                                                                           |

### The second check

`qaaf-critic`, told to take three viewpoints: a stranger arriving from a store listing or a shared link, the maintainer in six months, and the case against. It drove its own copy of the build. 21 tool calls, 15.5 minutes, 126,573 tokens.

**Verdict: HOLD**, on one finding. The commit that instrumented the offline sound check failed Lint (a function 49 lines long against a limit of 45). The manager had run no lint after it. Fixed in 34efd402 by lifting the helper out, not by silencing the rule.

Its other findings, and what was done:

- **A computer with no microphone still saw "not allowed".** Fixed (e121bb69). The morning's fix only reached a recorder that failed after permission.
- **"Microphone unavailable" widened a reading line's button column to 110px at 320px.** Fixed (e121bb69).
- **/letters is both a page and a folder, and nobody has seen how Pages answers that.** Made safe either way (125d2fcc). Still unseen until the deploy.
- **A shared lesson link, opened signed out, lands on sign-in and the lesson is forgotten.** Recorded as Q-191. Older than today, and a design question.
- **The privacy page says who runs Qaaf "will be added before launch".** The owner's (Q-035, O-11). It gates a store listing, not this push.
- **Minor, fixed:** no fetch timeout; retries refetched all 403 pages; the share-picture check failed where the site could not be reached; a second failed microphone tap was not announced; an earlier take was hidden after a failure; "Start over" and the counter's id were not held to the app; nothing tied the dropped labels to the course; the printed milliseconds included the harness; "occasionally" could sit beside "sometimes / ever"; a wrong count in a commit message; check:links held Back only signed out.
- **Minor, recorded as Q-192:** a trailing slash or wrong case still answers 404; the live check takes the list of lessons from the build's own file; the pages are written after the browser checks.

No agent has re-checked the fixes made in answer to it. They were checked by the manager and by check:all.

### What this is not evidence for

- **GitHub Pages itself.** Every status-code claim above was tested against a small server written to answer as Pages does. Only the deploy's own check sees the real thing.
- **A real phone.** The microphone cases were made to happen in a desktop browser.
- **The bundle.** Still one file of about 1 MB compressed (Q-187), left alone on purpose: splitting it changes how the app starts, which is what blanked the page during the SDK 54 upgrade.
- **The backlog.** 120 items stay open. Four are before launch, and all four wait on the owner.
