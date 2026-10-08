/* eslint-disable */
/**
 * What the app says about itself, checked against what it can actually do.
 *
 * Three things live here because they fail the same way — the screen looks
 * finished, every render test passes, and the only person who finds out is a
 * learner: a control that leads nowhere, a control that never says it is one,
 * and a number printed over the wrong bar.
 *
 * Settings used to show a **Sign in** button to a guest. It called
 * `signOut()`, which clears guest mode and returns the learner to the front
 * door — exactly right when that door offers Google and Apple. When no
 * backend is configured the door has a single "Start learning" button, so the
 * round trip ejected someone from the app and handed them back precisely
 * where they were. Nothing was lost, and nothing could be gained: a control
 * that promised something the build cannot do.
 *
 * `LoginScreen` had already been taught to hide its providers on
 * `authConfigured`; Settings had not, and no check noticed, because a button
 * that navigates somewhere real-looking is invisible to every test that only
 * asks whether screens render.
 *
 * This drives the real built bundle to Settings as a guest and reads what is
 * on offer. It is deliberately the *shipped* build rather than the source:
 * the defect was a screen rendering a live button, and only a rendered screen
 * can show that.
 *
 * Needs a web build in dist/ (npx expo export --platform web --output-dir dist).
 *
 * Run with:  npm run check:controls
 */

const path = require('path');
const fs = require('fs');
const { serveDist, findChromium, enterAsGuest, openTheDoor } = require('./lib/serve-dist');
const { load } = require('./lib/load-ts');

const DIST = path.join(__dirname, '..', 'dist');
const PORT = 8332;

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('No web build found in dist/. Run: npx expo export --platform web --output-dir dist');
  process.exit(1);
}

/**
 * The same test `src/lib/supabase.ts` makes, spelled out rather than imported.
 *
 * Importing it would drag `@supabase/supabase-js` and the react-native URL
 * polyfill into a plain node script for the sake of two `process.env` reads.
 * The cost of restating it is that the two could drift; the guard against
 * that is that this check asserts nothing at all when the keys *are* present,
 * so a drift makes the check quiet rather than wrong.
 */
const AUTH_CONFIGURED = !!(process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

/**
 * Every control on the mounted screen, by the words on it.
 *
 * Not filtered to the viewport: a screen taller than the window is the normal
 * case here, and a dead button two scrolls down is still a dead button.
 */
function controlsOnScreen() {
  return Array.from(document.querySelectorAll('[role="button"], [tabindex]')).flatMap((n) => {
    const r = n.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) return [];
    const label = (n.getAttribute('aria-label') || n.textContent || '').trim();
    return label ? [label] : [];
  });
}

/**
 * Anything the app made focusable that never says what it is.
 *
 * react-native-web gives a `Pressable` `tabindex="0"`, and adds
 * `role="button"` only when the component asks for it with
 * `accessibilityRole`. The shared `Button` never did, so twenty-six call
 * sites — including the single control on the sign-in screen — rendered as
 * focusable text with nothing to say they could be pressed. A focusable
 * element with no role is exactly that defect, and it is visible in the DOM,
 * so this reads it rather than counting `accessibilityRole` in the source
 * (which cannot see a component that forwards props it never sets).
 */
function rolelessControls() {
  return Array.from(document.querySelectorAll('[tabindex]:not([role])')).flatMap((n) => {
    // Inputs carry their own semantics from the tag itself.
    if (/^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(n.tagName)) return [];
    const r = n.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) return [];
    return [(n.textContent || '').trim().slice(0, 48) || `<${n.tagName.toLowerCase()} with no text>`];
  });
}

/**
 * Tap the first thing whose visible text or label matches.
 *
 * Leaves only, unless the element names itself with an aria-label. Matching
 * any element meant the outermost wrapper won — a screen whose whole
 * `textContent` happens to begin "← Back" matches `/^Back/`, and clicking the
 * middle of a full-screen div does nothing at all. That failed as a silent
 * no-op, which then looked like the next screen simply not being reachable.
 */
async function tapByText(page, re) {
  const box = await page.evaluate((src) => {
    const r = new RegExp(src, 'i');
    for (const n of document.querySelectorAll('div,span,p,[role="button"]')) {
      const label = n.getAttribute('aria-label');
      if (!label && n.children.length) continue;
      const t = (label || n.textContent || '').trim();
      if (!r.test(t)) continue;
      if (n.getBoundingClientRect().width < 8 || n.getBoundingClientRect().height < 8) continue;
      // Scrolled into view first, as a learner would. This clicked wherever
      // the element sat, so anything below the 900px window was a click on
      // nothing: when a streak-freeze card made Profile taller, the league row
      // and the Settings link fell below it and four assertions failed while
      // reading a screen the check had never left.
      n.scrollIntoView({ block: 'center' });
      const b = n.getBoundingClientRect();
      return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
    }
    return null;
  }, re.source);
  if (!box) return false;
  await page.mouse.click(box.x, box.y);
  return true;
}

async function main() {
  if (AUTH_CONFIGURED) {
    console.log('check:controls — Supabase keys are configured, so Settings offering sign-in is correct. Skipping.');
    return;
  }

  const server = await serveDist(DIST, PORT);
  const { chromium } = require('playwright-core');
  const problems = [];
  let browser;

  try {
    browser = await chromium.launch({ executablePath: findChromium() || undefined });
    const page = await browser.newPage({ viewport: { width: 412, height: 900 } });

    /** Nothing focusable anywhere may be silent about what it is. */
    const auditRoles = async (where) => {
      const silent = await page.evaluate(rolelessControls);
      if (silent.length) {
        problems.push(
          `${where}: ${silent.length} focusable thing${silent.length === 1 ? '' : 's'} with no role — ` +
            `a screen reader announces ${silent.length === 1 ? 'it' : 'them'} as text: ${silent.slice(0, 4).join(' · ')}`
        );
      }
    };

    // The sign-in screen first, before guest mode skips it. It is one control
    // and a paragraph, which is what made it the clearest case of the defect.
    await page.goto(`http://localhost:${PORT}/Urdu/`);
    await page.waitForTimeout(2200);
    await auditRoles('sign-in');
    const signInButtons = await page.evaluate(() => document.querySelectorAll('[role="button"]').length);
    if (signInButtons === 0) {
      problems.push('The sign-in screen exposes no button at all — its only control is unreachable by role.');
    }

    /**
     * The wordmark builds its glow by stacking the name under itself, once per
     * bloom layer plus the core. Nothing marked the copies as decoration, so
     * the first thing anyone heard on opening the app was its name, eight
     * times. Counted here in the tree a screen reader actually walks: text
     * outside any aria-hidden subtree.
     */
    const spoken = await page.evaluate(() => {
      // The Urdu face emits a right-to-left mark before the word so it sits
      // correctly beside Latin; that is invisible on screen and would make an
      // exact match silently count zero, which reads as "fixed".
      const bare = (s) => (s || '').replace(/[‎‏؜]/g, '').trim();
      const say = (word) =>
        Array.from(document.querySelectorAll('div,span,p')).filter(
          (n) => !n.children.length && bare(n.textContent) === word && !n.closest('[aria-hidden="true"]')
        ).length;
      return { latin: say('Qaaf'), urdu: say('قاف') };
    });
    for (const [which, n] of Object.entries(spoken)) {
      if (n > 1) problems.push(`The wordmark announces its ${which} name ${n} times — the glow copies are not hidden.`);
      if (n === 0) problems.push(`The wordmark's ${which} name is not announced at all — every copy is hidden.`);
    }

    await enterAsGuest(page, `http://localhost:${PORT}/Urdu/`, { xp: 640, streak: 3 });
    await page.waitForTimeout(1200);
    await auditRoles('home');

    /**
     * The level card stacks two bars measuring different things. Its only
     * number used to be "0/30 XP today", sitting above the *level* bar, which
     * counts XP for the whole course; the daily bar below got a bare "0%" and
     * a sparkle. Both bars were unidentifiable and the one label was on the
     * wrong one.
     */
    const home = await page.evaluate(() => document.body.innerText);
    if (!/XP to level \d+/.test(home)) {
      problems.push('The level bar on Home carries no label saying it measures progress to the next level.');
    }
    if (!/Today/.test(home)) {
      problems.push('The daily-goal bar on Home carries no label saying it measures today.');
    }
    if (/XP today/.test(home)) {
      problems.push('Home still prints "XP today" above the level bar, which is not what that bar measures.');
    }

    /**
     * The Letter Lab is the best reference screen in the app and was reached
     * through a tile with no accessible name, labelled in 9px type broken
     * across two lines. Asserted as: it names itself to assistive tech, and
     * the words on it are laid out as words rather than wrapped to fit.
     */
    const lab = await page.evaluate(() => {
      const el = [...document.querySelectorAll('[role="button"]')].find((n) =>
        /^Letter Lab\b/.test(n.getAttribute('aria-label') || '')
      );
      if (!el) return null;
      const box = el.getBoundingClientRect();
      const lines = [...el.querySelectorAll('div,span,p')]
        .filter((n) => !n.children.length && (n.textContent || '').trim())
        .map((n) => {
          const r = n.getBoundingClientRect();
          return { text: n.textContent.trim(), width: Math.round(r.width), height: Math.round(r.height) };
        });
      return { width: Math.round(box.width), lines };
    });
    if (!lab) {
      problems.push('Home has no control that names itself as the Letter Lab.');
    } else {
      const name = lab.lines.find((l) => /^Letter Lab$/.test(l.text));
      if (!name) {
        problems.push(
          `The Letter Lab tile does not spell its name on one line: ${lab.lines.map((l) => l.text).join(' / ')}`
        );
      } else if (name.height > 24) {
        problems.push(`"Letter Lab" wraps inside a ${lab.width}px tile — it is rendering ${name.height}px tall.`);
      }
    }

    /**
     * A teaching card cannot be got wrong, so it ends the moment it is
     * acknowledged. It used to take "Got it", then a banner reading "Keep that
     * in mind", then "Continue" — a second tap on 2,362 of the course's 12,061
     * exercises to confirm the button the learner had just pressed.
     */
    if (!(await tapByText(page, /Start this lesson$/))) {
      problems.push('Could not open the first lesson from Home — the teaching-card assertion proves nothing.');
    } else {
      await page.waitForTimeout(2200);
      const before = await page.evaluate(() => document.body.innerText);
      if (!/got it/i.test(before)) {
        problems.push(
          `The first lesson does not open on a teaching card: ${before.replace(/\n/g, ' / ').slice(0, 90)}`
        );
      } else {
        await tapByText(page, /^Got it$/);
        await page.waitForTimeout(1400);
        const after = await page.evaluate(() => document.body.innerText);
        if (/keep that in mind/i.test(after)) {
          problems.push('Acknowledging a teaching card still opens a banner asking to be acknowledged again.');
        }
        if (after === before) {
          problems.push('Acknowledging a teaching card did not move the lesson on.');
        }

        /**
         * Thumb reach. Measured across four consecutive exercises, the lesson
         * body ended at 490px of 844 and every tappable option sat in the top
         * 58% of the screen, with the bottom 42% empty until the footer filled
         * it — which happens only after the answer, when the learner has
         * stopped reaching for anything.
         *
         * 0.7 is taken from the two measurements rather than picked to feel
         * safe: the same screen reaches 60-61% of the viewport top-aligned and
         * 78-79% centred, at 390x844 and at 412x900 alike. A threshold between
         * them discriminates. The first version of this used 55%, which passed
         * either way — a check that could not fail.
         */
        const reach = await page.evaluate(() => {
          const rects = [...document.querySelectorAll('[role="button"]')]
            .map((n) => n.getBoundingClientRect())
            .filter((r) => r.height > 20 && r.width > 40);
          if (!rects.length) return null;
          return { lowest: Math.round(Math.max(...rects.map((r) => r.bottom))), viewport: window.innerHeight };
        });
        if (!reach) {
          problems.push('No tappable option on the lesson screen after the teaching card.');
        } else if (reach.lowest < reach.viewport * 0.7) {
          problems.push(
            `Everything tappable in a lesson stops at ${reach.lowest}px of ${reach.viewport} — the bottom ` +
              `${Math.round((1 - reach.lowest / reach.viewport) * 100)}% of the screen, nearest the thumb, is empty.`
          );
        }
      }
      /**
       * Tap targets, measured as the browser lays them out. The close button
       * was 20x32 and the play button 30x30, under hitSlops written to make
       * them 44: react-native-web ignores hitSlop, so on the web it was never
       * there (daily review 2026-10-07). src/lib/reach.ts is the fix.
       */
      const small = await page.evaluate(() =>
        [...document.querySelectorAll('[aria-label="Close lesson"], [aria-label^="Play"], [aria-label^="Hear"]')]
          .map((n) => ({ name: n.getAttribute('aria-label'), r: n.getBoundingClientRect() }))
          .filter(({ r }) => r.width > 0 && (r.width < 43.5 || r.height < 43.5))
          .map(({ name, r }) => `"${name}" ${Math.round(r.width)}x${Math.round(r.height)}`)
      );
      if (small.length) problems.push(`Lesson controls under the 44pt minimum: ${small.join(', ')}.`);
      const named = await page.locator('[aria-label="Close lesson"]').count();
      if (!named) problems.push('No "Close lesson" button found, so its tap target was never measured.');

      // Leave the lesson the way a learner would, so the checks below start
      // from Home rather than from wherever this ended up.
      await tapByText(page, /^✕$/);
      await page.waitForTimeout(1200);
    }

    if (!(await tapByText(page, /^Profile$/))) {
      problems.push('Could not find the Profile tab — the route to Settings is gone, so this check proves nothing.');
    } else {
      await page.waitForTimeout(900);
      await auditRoles('profile');

      /**
       * The league table is fourteen generated names and generated XP,
       * presented exactly like real competitors. The code was always honest
       * about it and the screen was not, which made it the one place the app
       * told a learner something untrue.
       */
      // The row is named for the learner's current league, e.g. "Clay League".
      if (!(await tapByText(page, /^\w+ League$/))) {
        problems.push('Could not open the League from Profile — the cohort assertion below proves nothing.');
      } else {
        await page.waitForTimeout(1000);
        const board = await page.evaluate(() => document.body.innerText);
        // Reaching the screen is asserted separately from what it says, so a
        // navigation that silently failed cannot pass as a clean board.
        if (!/League/.test(board) || !/\bXP\b/.test(board)) {
          problems.push(`The League screen did not open: ${board.replace(/\n/g, ' / ').slice(0, 90)}`);
        } else if (!/not real people/i.test(board)) {
          problems.push('The league table shows a generated cohort with nothing on screen saying it is not real.');
        }
        await tapByText(page, /^(←|Back)/);
        await page.waitForTimeout(800);
      }

      if (!(await tapByText(page, /^Settings$/))) {
        problems.push('Could not open Settings from Profile — this check proves nothing.');
      } else {
        await page.waitForTimeout(1000);
        await auditRoles('settings');
        const controls = await page.evaluate(controlsOnScreen);
        const body = await page.evaluate(() => document.body.innerText);
        // The Account card is the part under test, so prove we are looking at
        // the screen that holds it rather than at whatever else rendered.
        const onSettings = /Settings/.test(body) && /Account/i.test(body);
        if (!onSettings) {
          problems.push(`Settings did not open — what is on screen is: ${controls.slice(0, 8).join(' · ')}`);
        }
        const signIn = controls.filter((c) => /^sign in$/i.test(c));
        if (signIn.length) {
          problems.push(
            'Settings offers "Sign in" to a guest while no backend is configured. It calls signOut(), which drops ' +
              'the learner on a sign-in screen whose only button puts them back where they were.'
          );
        }
        // The card itself must still say where progress lives — removing the
        // button must not also remove the answer to "am I signed in".
        if (!/progress is saved on this device/i.test(body)) {
          problems.push('Settings no longer tells a guest where their progress is saved.');
        }
        /**
         * Which daily goal is set was shown only by a gold border. The first fix
         * used accessibilityState={{ selected }}, typechecked, passed every
         * gate, and put nothing in the DOM: react-native-web 0.19 reads
         * accessibilityState for `disabled` and nothing else. So this reads the
         * attribute a screen reader reads, on the built page: the four goals
         * are radios, and exactly one of them is checked.
         */
        const goals = await page.evaluate(() =>
          [...document.querySelectorAll('[role="radiogroup"][aria-label="Daily goal"] [role="radio"]')].map((n) =>
            n.getAttribute('aria-checked')
          )
        );
        if (goals.length !== 4 || goals.filter((c) => c === 'true').length !== 1 || goals.some((c) => c == null)) {
          problems.push(
            `Settings' daily goals do not tell a screen reader which one is set: expected 4 radios in a "Daily goal" ` +
              `group with exactly one aria-checked="true", found ${JSON.stringify(goals)}.`
          );
        }
      }
    }
    /**
     * A streak that will break today is the one thing this app can say to a
     * learner without a server to send it from and no native build to receive
     * it on -- see the note on `atRiskStreak` in HomeScreen.tsx. In its own
     * page and its own seeded session, since every route above shares one
     * `enterAsGuest` call and this needs a state none of them set up:
     * `lastActiveDay` a real calendar day behind "now", read with the app's
     * own `dayKey` rather than reimplemented here, so a change to what "a day"
     * means moves this check with it instead of past it.
     */
    /**
     * Polls rather than sleeping a fixed interval, per check:waits -- Home
     * staggers its cards in on Reveal delays, so a constant here would be
     * exactly the guess-at-a-machine's-speed pattern that check exists to
     * catch, and did: the first version of this slept a flat 1.2 seconds instead.
     */
    const settledText = async (p, timeoutMs = 8000) => {
      let last = null;
      const until = Date.now() + timeoutMs;
      while (Date.now() < until) {
        const now = await p.evaluate(() => document.body.innerText).catch(() => null);
        if (now && now === last) return now;
        last = now;
        await p.waitForTimeout(150);
      }
      return last;
    };

    const { dayKey } = load('src/lib/date.ts');
    const yesterday = dayKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
    const riskPage = await browser.newPage({ viewport: { width: 412, height: 900 } });
    await enterAsGuest(riskPage, `http://localhost:${PORT}/Urdu/`, { streak: 6, lastActiveDay: yesterday });
    const riskBody = await settledText(riskPage);
    await riskPage.close();
    if (!/play today to keep your 6-day streak/i.test(riskBody || '')) {
      problems.push(
        'A learner one day from losing a 6-day streak is not told so on Home: ' +
          `${(riskBody || '').replace(/\n/g, ' / ').slice(0, 140)}`
      );
    }

    const safePage = await browser.newPage({ viewport: { width: 412, height: 900 } });
    const today = dayKey(new Date());
    await enterAsGuest(safePage, `http://localhost:${PORT}/Urdu/`, { streak: 6, lastActiveDay: today });
    const safeBody = await settledText(safePage);
    await safePage.close();
    if (/keep your \d+-day streak/i.test(safeBody || '')) {
      problems.push('A learner who already played today still sees the streak-at-risk line on Home.');
    }

    /**
     * The streak used to be recomputed only when a lesson finished, so a
     * learner back after five days saw their old 12-day streak on Home until a
     * lesson quietly dropped it to 1. `rolloverStreak` now runs when saved
     * progress loads. The rules are unit-tested in lib/streak.test.ts; this
     * is the wiring, read from what the built app saves after opening.
     */
    const daysAgo = (n) => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      return dayKey(d);
    };
    const afterOpening = async (seed) => {
      const p = await browser.newPage({ viewport: { width: 412, height: 900 } });
      await enterAsGuest(p, `http://localhost:${PORT}/Urdu/`, seed);
      const body = await settledText(p);
      const saved = await p.evaluate(() => JSON.parse(localStorage.getItem('qaaf-progress') || '{}').state || {});
      await p.close();
      return { body: body || '', saved };
    };
    const lapsed = await afterOpening({ streak: 12, freezes: 1, lastActiveDay: daysAgo(5) });
    if (lapsed.saved.streak !== 0 || lapsed.saved.freezes !== 1) {
      problems.push(
        `A learner back after 5 days still has streak ${lapsed.saved.streak} (and ${lapsed.saved.freezes} freezes) ` +
          'on opening the app. It should read 0 until a lesson starts a new one, with no freeze spent on it.'
      );
    }
    const frozen = await afterOpening({ streak: 12, freezes: 1, lastActiveDay: daysAgo(2) });
    if (frozen.saved.streak !== 12 || frozen.saved.freezes !== 0 || frozen.saved.lastActiveDay !== daysAgo(1)) {
      problems.push(
        `A learner who missed one day with a freeze opened to streak ${frozen.saved.streak}, ` +
          `${frozen.saved.freezes} freezes, last active ${frozen.saved.lastActiveDay}. The freeze should cover ` +
          'yesterday: streak 12, no freezes left, last active yesterday.'
      );
    }
    // Two missed days, three freezes held: one freeze each (P-008), and the
    // count kept for the lesson to report.
    const twoDays = await afterOpening({ streak: 12, freezes: 3, lastActiveDay: daysAgo(3) });
    if (
      twoDays.saved.streak !== 12 ||
      twoDays.saved.freezes !== 1 ||
      twoDays.saved.freezesOnHold !== 2 ||
      twoDays.saved.lastActiveDay !== daysAgo(1)
    ) {
      problems.push(
        `A learner who missed two days holding 3 freezes opened to streak ${twoDays.saved.streak}, ` +
          `${twoDays.saved.freezes} freezes (${twoDays.saved.freezesOnHold} on hold), last active ` +
          `${twoDays.saved.lastActiveDay}. Each missed day should spend one: streak 12, 1 left, 2 on hold, ` +
          'last active yesterday.'
      );
    }
    if (!/keep your 12-day streak/i.test(frozen.body)) {
      problems.push('After a freeze covers yesterday, Home does not say today is still needed to keep the streak.');
    }

    /**
     * Onboarding's main button stays within a thumb's reach.
     *
     * "You're all set" did not scroll, so for a speaker who read every script
     * question (the level card, the moved-ahead card and the alphabet choice,
     * all at once) "Start learning" sat below the bottom of the phone with no
     * way to reach it. The owner found it on a real phone (2026-10-07).
     *
     * Driven from a cold start at the smallest screen the app supports, as
     * that speaker, because theirs is the longest version of the screen. The
     * button is brought up with the mouse wheel, the way a thumb scrolls, not
     * with scrollIntoView: a script can scroll a container a person cannot,
     * and that is exactly the bug. The right answers come from the quiz's own
     * data, so a reworded question cannot quietly stop this reaching the end.
     */
    {
      const { placementFor } = load('src/data/placement.ts');
      const answers = placementFor('both').map((q) => q.options.find((o) => o.c).label);
      const W = 320;
      const H = 568;
      const p = await browser.newPage({ viewport: { width: W, height: H } });
      const exact = (t) => new RegExp(`^${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
      const said = () => p.evaluate(() => document.body.innerText);
      // Waits on what each tap is for, never on a number of milliseconds.
      const until = (fn, arg, ms = 10000) =>
        p.waitForFunction(fn, arg, { timeout: ms }).then(
          () => true,
          () => false
        );
      const shows = (src) => until((r) => new RegExp(r, 'i').test(document.body.innerText), src);
      const chosen = (src) =>
        until(
          (r) =>
            Array.from(document.querySelectorAll('[role="radio"][aria-checked="true"]')).some((n) =>
              new RegExp(r, 'i').test(n.textContent || '')
            ),
          src
        );
      const reached = [];
      /**
       * Every host the app talks to on the way, from a cold start to the
       * lesson path. The privacy policy promises no ad network and no
       * tracking; this is the part of that promise a build can break without
       * anyone writing it down, by adding a font, an analytics snippet or a
       * CDN. With no backend configured (the only case this check runs in),
       * the app's own server is the only host it has any reason to reach.
       */
      const hosts = new Set();
      p.on('request', (r) => {
        const u = new URL(r.url());
        if (u.protocol === 'http:' || u.protocol === 'https:') hosts.add(u.host);
      });
      const step = async (re, label, then) => {
        const before = await said();
        if (!(await tapByText(p, re))) return false;
        reached.push(label);
        // Either the condition named, or for a plain advance, any change.
        return then ? then() : until((b) => document.body.innerText !== b, before);
      };
      try {
        await p.goto(`http://localhost:${PORT}/Urdu/`);
        await openTheDoor(p);
        await shows('let.s start');
        await step(/^Let’s start$/, 'welcome', () => shows('why are you learning urdu'));
        await step(/^Speak with family/, 'goal', () => chosen('speak with family'));
        await step(/^Continue$/, 'goal continue');
        for (let k = 0; k < 3 && !/already speak or understand/i.test(await said()); k++) {
          await step(/^Continue$/, 'track or voice');
        }
        await step(/^I already speak or understand it$/, 'speaker', () => chosen('already speak or understand'));
        await step(/^Continue$/, 'background continue', () => shows('quick check'));
        for (const a of answers) await step(exact(a), `quiz: ${a}`);
        await shows('set a daily goal');
        await step(/^Continue$/, 'daily goal', () => shows('you.re all set'));
        const ready = await said();
        if (!/you.re all set/i.test(ready) || !/skip the alphabet/i.test(ready)) {
          problems.push(
            'Onboarding did not reach "You’re all set" with the alphabet choice offered, so the reach of its ' +
              `button went unmeasured. Got as far as: ${reached.join(' > ') || 'nothing'}.`
          );
        } else {
          const buttonBox = () =>
            p.evaluate(() => {
              const n = [...document.querySelectorAll('[role="button"]')].find((b) =>
                /^start learning$/i.test((b.textContent || '').trim())
              );
              if (!n) return null;
              const r = n.getBoundingClientRect();
              return { top: r.top, bottom: r.bottom, x: r.left + r.width / 2, y: r.top + r.height / 2 };
            });
          await p.mouse.move(W / 2, H / 2);
          let box = await buttonBox();
          for (let k = 0; k < 20 && box && box.bottom > H; k++) {
            await p.mouse.wheel(0, 240);
            await p.waitForTimeout(120);
            box = await buttonBox();
          }
          if (!box) {
            problems.push('"You’re all set" has no Start learning button.');
          } else if (box.bottom > H || box.top < 0) {
            problems.push(
              `At ${W}x${H}, "Start learning" on "You’re all set" sits at ${Math.round(box.top)} to ` +
                `${Math.round(box.bottom)} of a ${H}px screen and scrolling does not bring it up: a learner ` +
                'who already speaks Urdu cannot finish onboarding.'
            );
          } else {
            await p.mouse.click(box.x, box.y);
            if (!(await shows('start this lesson|tap any lesson'))) {
              problems.push('Tapping "Start learning" on "You’re all set" did not land on the lesson path.');
            }
          }
        }
        const elsewhere = [...hosts].filter((h) => h !== `localhost:${PORT}`);
        if (elsewhere.length) {
          problems.push(
            `From a cold start to the lesson path the app contacted ${elsewhere.join(', ')}. The privacy ` +
              'policy promises no tracking and no ad network; anything the app loads should come from its own site.'
          );
        }
      } finally {
        await p.close();
      }
    }

    /**
     * A word whose sound failed to load plays once the network is back.
     *
     * A clip that failed stayed cached, broken, and every later tap replayed
     * the dead copy without asking the network, so one dropped request on a
     * patchy connection silenced that word's speaker button until a reload
     * (performance review, 2026-10-08). Every clip is blocked for the first
     * tap and allowed for the second, which must start the clip playing.
     */
    {
      const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
      await p.addInitScript(() => {
        window.__playing = 0;
        const play = HTMLMediaElement.prototype.play;
        HTMLMediaElement.prototype.play = function () {
          this.addEventListener('playing', () => (window.__playing += 1), { once: true });
          return play.call(this);
        };
      });
      let blocked = true;
      let refused = 0;
      await p.route(/\.mp3(\?|$)/, (r) => {
        if (!blocked) return r.continue();
        refused += 1;
        return r.abort('failed');
      });
      // Polled, not slept: a short wait inside a loop, up to a ceiling.
      const poll = async (ok, ms) => {
        for (const end = Date.now() + ms; Date.now() < end;) {
          if (await ok()) return true;
          await p.waitForTimeout(100);
        }
        return ok();
      };
      try {
        await enterAsGuest(p, `http://localhost:${PORT}/Urdu/lesson/l-1`, {}, { soundEnabled: true });
        const hear = p.locator('[aria-label^="Hear"]').first();
        await hear.waitFor({ timeout: 15000 }).catch(() => {});
        if (!(await hear.count())) {
          problems.push('The first lesson has no "Hear" button, so a sound that failed to load was never retried.');
        } else {
          // The card's own first play is refused; then the learner's tap,
          // which a fixed build answers with another (refused) request.
          await poll(async () => refused > 0, 8000);
          const before = refused;
          await hear.click();
          await poll(async () => refused > before, 3000);
          blocked = false;
          await hear.click();
          if (!(await poll(() => p.evaluate(() => window.__playing > 0), 8000))) {
            problems.push(
              'A word whose sound failed to load stays silent after the network comes back: the speaker ' +
                'button replays the broken copy instead of fetching the clip again.'
            );
          }
        }
      } finally {
        await p.close();
      }
    }
  } finally {
    if (browser) await browser.close();
    server.close();
  }

  if (problems.length) {
    console.error('check:controls — dead or missing controls:\n');
    for (const p of problems) console.error(`  ✗ ${p}`);
    process.exit(1);
  }
  console.log('check:controls — every focusable thing on sign-in, home, profile and settings says it is a button.');
  console.log('check:controls — the wordmark announces its name once in each script, not once per glow layer.');
  console.log("check:controls — Home's two progress bars each carry a label saying what they measure.");
  console.log('check:controls — the league table says on screen that its cohort is not real people.');
  console.log('check:controls — a teaching card ends on one tap, with no banner asking to be acknowledged twice.');
  console.log('check:controls — a lesson puts what a thumb has to reach in the lower half of the screen.');
  console.log("check:controls — a lesson's close and play buttons are at least 44 by 44 on the web.");
  console.log(
    'check:controls — Settings offers a guest no sign-in it cannot honour, and still says where progress lives.'
  );
  console.log('check:controls — the four daily goals are a radio group, and a screen reader can hear which is set.');
  console.log(
    'check:controls — a streak one day from breaking says so on Home, and stays silent once today is played.'
  );
  console.log(
    'check:controls — opening the app applies missed days: a lapsed streak reads 0, each missed day spends a freeze.'
  );
  console.log(
    'check:controls — at 320x568 a speaker who aces the quick check can scroll to "Start learning" and finish onboarding.'
  );
  console.log('check:controls — a sound that failed to load plays on the next tap once the network is back.');
  console.log('check:controls — from a cold start to the lesson path, the app contacts no host but its own.');
}

main().catch((err) => {
  console.error('check:controls — failed to run:', err);
  process.exit(1);
});
