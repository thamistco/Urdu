import { describe, it, expect } from 'vitest';
import { MAX_INTERVAL, capIntervals, cardsOnTrack, dueCount, isDue, newCard, review } from './srs';

const DAY = 24 * 60 * 60 * 1000;
const T0 = Date.UTC(2026, 9, 9, 8, 0);

describe('review', () => {
  it('a word answered right again on the day it was taught is still due tomorrow, not in 3 days', () => {
    const taught = review(newCard('w', T0), 'good', T0);
    expect(taught.interval).toBe(1);

    const afternoon = T0 + 6 * 60 * 60 * 1000;
    const again = review(taught, 'good', afternoon);
    expect(again.interval).toBe(1);
    expect(again.reps).toBe(1);
    expect(again.ease).toBe(taught.ease);
    // Still due when it was, the next morning: the afternoon's answer does
    // not push the test it has not taken yet further away.
    expect(again.due).toBe(taught.due);
  });

  it('a word met in every one of three sessions a day still moves out, rather than staying due tomorrow', () => {
    const HOUR = 60 * 60 * 1000;
    let card = newCard('w', T0);
    for (let day = 0; day < 21; day++) {
      for (const hour of [8, 13, 21]) card = review(card, 'good', T0 + day * DAY + hour * HOUR);
    }
    expect(card.interval).toBeGreaterThan(3);
  });

  it('a right answer on time never brings a word back sooner than its last gap', () => {
    const taught = review(newCard('w', T0), 'good', T0);
    // Early answers after 23 hours and again a day and a half later carry it
    // past the 3-day step while reps is still 1.
    const grown = review(review(taught, 'good', T0 + 23 * 60 * 60 * 1000), 'good', T0 + 2.5 * DAY);
    expect(grown.reps).toBe(1);
    expect(grown.interval).toBeGreaterThan(3);
    const onTime = review(grown, 'good', grown.due);
    expect(onTime.interval).toBeGreaterThan(grown.interval);
  });

  it('answering on time earns at least what answering a little early would have', () => {
    // Taught at 9pm, met again at 1pm the next day: grown to 2 days, reps 1.
    const HOUR = 60 * 60 * 1000;
    const taught = review(newCard('w', T0), 'good', T0);
    const grown = review(taught, 'good', T0 + 16 * HOUR);
    expect(grown.interval).toBe(2);
    const early = review(grown, 'good', grown.due - HOUR);
    const onTime = review(grown, 'good', grown.due);
    expect(onTime.interval).toBeGreaterThanOrEqual(early.interval);
  });

  it('once it is due, a right answer grows the interval as before', () => {
    const taught = review(newCard('w', T0), 'good', T0);
    const nextDay = review(taught, 'good', T0 + DAY);
    expect(nextDay.reps).toBe(2);
    expect(nextDay.interval).toBe(3);
  });

  it('an early right answer counts the time that really passed', () => {
    // Interval 3, reviewed after 2 days: 2 × ease rounds to 5, more than 3.
    const card = { id: 'w', ease: 2.5, interval: 3, reps: 2, due: T0 + 3 * DAY, lastSeen: T0 };
    const early = review(card, 'good', T0 + 2 * DAY);
    expect(early.interval).toBe(5);
    expect(early.reps).toBe(2);
  });

  it('a miss is due straight away, so Review after the lesson already has it', () => {
    const missed = review(newCard('w', T0), 'again', T0);
    expect(isDue(missed, T0)).toBe(true);
  });

  it('a miss before it was due still sends the word back', () => {
    const taught = review(newCard('w', T0), 'good', T0);
    const missed = review(taught, 'again', T0 + 60 * 60 * 1000);
    expect(missed.reps).toBe(0);
    expect(missed.interval).toBe(0);
  });

  it('a word relearning after a miss moves on when answered right, even within the minute', () => {
    const missed = review(review(newCard('w', T0), 'good', T0), 'again', T0 + DAY);
    const right = review(missed, 'good', T0 + DAY + 30 * 1000);
    expect(right.reps).toBe(1);
    expect(right.interval).toBe(1);
  });

  it('a word answered right every time it comes due never gets a gap beyond a year', () => {
    let card = newCard('w', T0);
    for (let day = 0; day < 400; day++) card = review(card, 'easy', card.due);
    expect(card.interval).toBe(MAX_INTERVAL);
    expect(card.due - card.lastSeen).toBe(MAX_INTERVAL * DAY);
  });
});

describe('capIntervals', () => {
  it('brings a runaway saved card back inside a year, and leaves sane ones alone', () => {
    const sane = { id: 's', ease: 2.5, interval: 10, reps: 3, due: T0 + 10 * DAY, lastSeen: T0 };
    const runaway = { id: 'r', ease: 1.3, interval: 6e18, reps: 84, due: T0 + 6e18 * DAY, lastSeen: T0 };
    // Infinity does not survive JSON, so a far enough card was saved as null.
    const lost = {
      id: 'n',
      ease: 1.3,
      interval: null as unknown as number,
      reps: 90,
      due: null as unknown as number,
      lastSeen: T0,
    };
    const out = capIntervals({ s: sane, r: runaway, n: lost })!;
    expect(out.s).toBe(sane);
    expect(out.r.interval).toBe(MAX_INTERVAL);
    expect(out.r.due).toBe(T0 + MAX_INTERVAL * DAY);
    expect(out.n.interval).toBe(MAX_INTERVAL);
    expect(out.n.due).toBe(T0 + MAX_INTERVAL * DAY);
    expect(capIntervals({ s: sane })).toBeNull();
  });
});

describe('cardsOnTrack', () => {
  it('leaves letters out on the Roman track, which cannot show them, and keeps them elsewhere', () => {
    const letter = { ...newCard('alif', T0), due: T0 - DAY };
    const word = { ...newCard('w-paani', T0), due: T0 - DAY };
    const cards = { alif: letter, 'w-paani': word };
    const types = { alif: 'letter', 'w-paani': 'word' };
    expect(dueCount(cardsOnTrack(cards, types, 'roman'), T0)).toBe(1);
    expect(dueCount(cardsOnTrack(cards, types, 'both'), T0)).toBe(2);
    expect(dueCount(cardsOnTrack(cards, types, 'script'), T0)).toBe(2);
  });
});
