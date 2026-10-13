import { describe, it, expect } from 'vitest';
import { matchesWord, nearMiss, romanSkeleton } from './roman';
import { isLoanSpelling, LOANWORD_SPELLINGS, OTHER_SPELLINGS } from '../data/loanwords';
import { getWord } from '../data/words';

describe('matchesWord', () => {
  it('folds the conventions romanisers disagree about', () => {
    expect(matchesWord('kitab', 'کتاب', 'kitaab')).toBe(true);
    expect(matchesWord('chay', 'چائے', 'chai')).toBe(true);
    expect(matchesWord('kalam', 'قلم', 'qalam')).toBe(true);
    expect(matchesWord('ladka', 'لڑکا', 'laṛka')).toBe(true);
    expect(matchesWord('chadhna', 'چڑھنا', 'chaṛhna')).toBe(true);
    expect(matchesWord('larka', 'لڑکا', 'laṛka')).toBe(true);
  });

  it('keeps the vowel that is grammar', () => {
    expect(matchesWord('ka', 'کی', 'ki')).toBe(false);
  });
});

/**
 * The spellings QA testers had refused (2026-10-12), against the two kinds of
 * answer that must stay wrong: a different word, and a short word.
 */
describe('nearMiss', () => {
  const taken = new Set(['zehn', 'ret', 'rat', 'garam', 'kharch'].map(romanSkeleton));

  it.each([
    ['garm', 'garam'],
    ['chadhna', 'chaṛhna'],
    ['budhaapa', 'buṛhaapa'],
    ['daakter', 'ḍaakṭar'],
    ['pattar', 'patthar'],
    ['humsafar', 'ham-safar'],
    ['kharach', 'kharch'],
    ['kanstar', 'kanastar'],
    ['fikirmand', 'fikarmand'],
    ['cheenti', 'cheeoñṭi'],
    ['bhiriya', 'bheṛiya'],
  ])('accepts %s for %s', (typed, stored) => {
    expect(nearMiss(typed, stored, taken)).toBe(true);
  });

  it('refuses a spelling that is another word', () => {
    expect(nearMiss('zehn', 'zaheen', taken)).toBe(false);
    expect(nearMiss('rat', 'raat', taken)).toBe(false);
    // pal (a moment) for phal (fruit): one letter, and a different word.
    expect(nearMiss('pal', 'phal', new Set([romanSkeleton('pal')]))).toBe(false);
  });

  // The QA list of 2026-10-13 (H3) asked for these to pass.
  it.each([
    ['reet', 'ret'],
    ['jehaiz', 'jahez'],
    ['kaisay', 'kaise'],
    ['jootay', 'joote'],
    ['kurra-e-ardh', 'kurra-e-arz'],
  ])('accepts %s for %s', (typed, stored) => {
    expect(matchesWord(typed, '', stored) || nearMiss(typed, stored, taken)).toBe(true);
  });

  it('still refuses a short word that is another word, and three letters off', () => {
    expect(nearMiss('rat', 'ret', taken)).toBe(false);
    expect(nearMiss('dozain', 'darjan', new Set())).toBe(false);
  });
});

describe('long vowels', () => {
  // QA round 5, M28: the ai fold ran before doubled letters collapsed, so
  // gaay and gay reduced to different skeletons and gay was refused.
  it.each([
    ['gay', 'gaay'],
    ['tai', 'ṭaai'],
    ['wai-fai', 'waai-faai'],
    ['wai fai', 'waai-faai'],
    ['aeen', 'aaeen'],
    ['kitab', 'kitaab'],
  ])('accepts %s, written with a single vowel, as exactly %s', (typed, stored) => {
    expect(matchesWord(typed, '', stored)).toBe(true);
  });
});

describe('loanword spellings', () => {
  it('accept the English spelling of a word Urdu took from English, and only those', () => {
    expect(isLoanSpelling('w-whale', 'Whale')).toBe(true);
    expect(isLoanSpelling('w-x-ray', 'x-ray')).toBe(true);
    expect(isLoanSpelling('w-doctor', 'doctor')).toBe(true);
    expect(isLoanSpelling('w-paani', 'water')).toBe(false);
    expect(isLoanSpelling('w-wifi', 'wifi')).toBe(true);
    expect(isLoanSpelling('w-chiti', 'cheenti')).toBe(true);
    for (const id of [...Object.keys(LOANWORD_SPELLINGS), ...Object.keys(OTHER_SPELLINGS)])
      expect(getWord(id), id).toBeDefined();
  });
});

describe('Urdu typed on an Arabic keyboard', () => {
  // Learner voice, 2026-10-13: ي ك ه look like ی ک ہ and are other characters.
  it.each([
    ['\u0643\u062A\u0627\u0628', 'کتاب'], // كتاب
    ['\u0643\u0645\u0631\u0647', 'کمرہ'], // كمره
    ['\u0645\u064A\u0632', 'میز'], // ميز
  ])('accepts %s for %s', (typed, urdu) => {
    expect(matchesWord(typed, urdu, 'x')).toBe(true);
  });
});
