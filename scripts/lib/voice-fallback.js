/**
 * Where to turn when Chirp3-HD will not say a word at all.
 *
 * Measured over repeated attempts (`generate-voice.js`, where this table used
 * to live): ہاں and ں came back silent 8 times out of 8 and کیا 5 times out of
 * 8, on every Chirp3-HD voice tried. The model does not handle one- to
 * three-character Urdu input, full stop — this is not flakiness a rerun fixes,
 * and no amount of retrying reaches the requested voice. The older Wavenet
 * voices produce all three cleanly, every time.
 *
 * So a clip that stays silent falls back to the Wavenet voice of the same
 * gender, and the ledger records both the request and what actually happened
 * (`voice` and `actual`). A slightly different timbre on a handful of very
 * short items is a far smaller cost than a course whose alphabet cards play
 * nothing.
 *
 * Pulled out of `generate-voice.js` so `check-voice-fidelity.js` can hold a
 * clip's `actual` against the *same* mapping rather than guessing at one: a
 * clip landing on its documented fallback is the system working as designed;
 * a clip landing anywhere else is a real defect. Confusing those two is
 * exactly the mistake that first shipped in this repo — every `actual`
 * mismatch was reported as a defect, which flagged five clips (ہاں in both
 * voices, بھی, جی, ف) that were never wrong at all, and buried the two that
 * were (`do-chashmi-he`/`noon-ghunna`, silent letters recorded from a bare
 * glyph — a content bug, not a voice bug, and the reason those two now carry
 * a real `pronounce` instead of landing here).
 */
const FALLBACK_VOICE = {
  'ur-IN-Chirp3-HD-Zephyr': 'ur-IN-Wavenet-A',
  'ur-IN-Chirp3-HD-Kore': 'ur-IN-Wavenet-A',
  'ur-IN-Chirp3-HD-Achird': 'ur-IN-Wavenet-B',
  'ur-IN-Chirp3-HD-Algieba': 'ur-IN-Wavenet-B',
};

module.exports = { FALLBACK_VOICE };
