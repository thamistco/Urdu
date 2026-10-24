import { describe, expect, it } from 'vitest';
import { urduRuns } from './urduRuns';

describe('urduRuns', () => {
  it('leaves English alone', () => {
    expect(urduRuns('No Urdu here.')).toEqual([{ text: 'No Urdu here.', urdu: false }]);
  });

  it('cuts out an Urdu word at the start, in the middle and at the end', () => {
    expect(urduRuns('وہ does double duty, like ہے, and ends with نے')).toEqual([
      { text: 'وہ', urdu: true },
      { text: ' does double duty, like ', urdu: false },
      { text: 'ہے', urdu: true },
      { text: ', and ends with ', urdu: false },
      { text: 'نے', urdu: true },
    ]);
  });

  it('keeps a phrase as one run, spaces inside, not the spaces around it', () => {
    expect(urduRuns('Say خدا حافظ to leave.')).toEqual([
      { text: 'Say ', urdu: false },
      { text: 'خدا حافظ', urdu: true },
      { text: ' to leave.', urdu: false },
    ]);
  });

  it('keeps a zero-width non-joiner inside its word', () => {
    expect(urduRuns('a ب‌ا b').map((r) => r.text)).toEqual(['a ', 'ب‌ا', ' b']);
  });

  it('loses no character', () => {
    const s = 'The past (کیا) and نے, with ؟ and ۔ marks.';
    expect(
      urduRuns(s)
        .map((r) => r.text)
        .join('')
    ).toBe(s);
  });
});
