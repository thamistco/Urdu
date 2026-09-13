/**
 * Clips one voice says wrongly, and the voice to use for them instead.
 *
 * Not the same problem as `voice-fallback.js`, and the difference is why this
 * table has to exist and has to be written by hand.
 *
 * `FALLBACK_VOICE` handles a clip that comes back *silent*. Silence is
 * measurable, so the generator detects it and switches voices on its own, and
 * `check:voice` fails on it if anything slips through.
 *
 * These come back as perfectly good audio, at a healthy length, in the right
 * voice, saying the wrong word. Nothing automatic catches that. `check:voice`
 * hears sound and is satisfied; `check:voice-fidelity` compares the ledger
 * against the course and finds them in agreement; even speech-to-text is too
 * noisy on isolated words to be trusted as a gate (see the false alarm recorded
 * in `check-pronunciation.js`). The only instrument that works is a person who
 * speaks Urdu listening to the clip.
 *
 * So each entry here is a defect somebody heard, with the voice that was
 * checked by ear to say it correctly. Keyed by voice set, then by clip id,
 * because the two sets fail differently: the same word can be right in one
 * voice and wrong in the other, which is exactly the case that made this
 * necessary. A per-word `pronounce` could not have fixed it — that field is
 * shared by both sets, so respelling لال to rescue the man's voice would have
 * changed the woman's clip, which was already correct.
 *
 * `check:voice-fidelity` asserts every entry is honoured in the ledger, so an
 * override that gets dropped in a regeneration fails the build rather than
 * quietly restoring the mispronunciation.
 *
 * What that check cannot catch, stated plainly: deleting an entry from this
 * table. The rule only holds the ledger to the entries it finds here, so
 * removing one removes the assertion with it, and the next regeneration puts
 * the mispronunciation back with every check green. There is no way around
 * that from inside the repo, because the evidence for each entry is a person
 * having heard the clip and it exists nowhere a script can read. Treat a line
 * here as a recorded observation rather than as configuration: it can be added
 * to, and it can be corrected by someone who has listened again, but it should
 * not be tidied away by someone who has not.
 */
const VOICE_OVERRIDE = {
  f: {},
  m: {
    // ur-IN-Chirp3-HD-Achird reads لال ("red") as the wrong word. The older
    // Wavenet male voice says it correctly. Heard and confirmed by a native
    // speaker against four candidates, including the same voice with a zabar
    // written in and the same voice reading it inside لال رنگ; only the
    // Wavenet rendering was right.
    'w-laal': 'ur-IN-Wavenet-B',
  },
};

/** The voice this clip should actually be recorded in, for this set. */
const overrideFor = (set, id) => VOICE_OVERRIDE[set]?.[id];

module.exports = { VOICE_OVERRIDE, overrideFor };
