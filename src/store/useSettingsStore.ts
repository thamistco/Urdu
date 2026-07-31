import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from './storage';
import { setMuted } from '../lib/sound';
import { setHapticsEnabled } from '../lib/haptics';
import { setSpeechMuted, setGlossEnabled, setVoiceSet } from '../lib/speech';

export type LearnTrack = 'script' | 'roman' | 'both';

/**
 * Which recorded voice reads the Urdu.
 *
 * Named for the voice, not for the learner: this is a preference about who you
 * would rather be taught by, and it carries no assumption about who is asking.
 */
export type VoiceGender = 'f' | 'm';

type SettingsState = {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  /** show Roman transliteration alongside script */
  showRoman: boolean;
  reducedMotion: boolean;
  /** after a correct answer, say the English meaning as well as the Urdu */
  speakMeaning: boolean;
  /** Which recorded voice reads the Urdu. */
  voiceGender: VoiceGender;
  track: LearnTrack;
  setSound: (v: boolean) => void;
  setHaptics: (v: boolean) => void;
  setShowRoman: (v: boolean) => void;
  setReducedMotion: (v: boolean) => void;
  setSpeakMeaning: (v: boolean) => void;
  setVoiceGender: (v: VoiceGender) => void;
  setTrack: (t: LearnTrack) => void;
  syncEffects: () => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      soundEnabled: true,
      hapticsEnabled: true,
      showRoman: true,
      reducedMotion: false,
      /**
       * Off by default. When on, a correct answer plays the recorded Urdu clip
       * and then has the *device's English voice* read the meaning aloud — two
       * different speakers on one word, the second of them a stock browser
       * voice reading English in an app for learning Urdu. It shipped on by
       * default, and it sounded exactly like the bug it was mistaken for.
       *
       * The feature itself is defensible for a learner who wants it, so the
       * switch stays; being on for everyone who never asked for it is not.
       */
      speakMeaning: false,
      /**
       * The recorded voice. Defaults to the narrator every clip was made with,
       * so an install that has never chosen sounds exactly as it always did.
       */
      voiceGender: 'f',
      track: 'both',
      setSound: (v) => {
        setMuted(!v);
        setSpeechMuted(!v);
        set({ soundEnabled: v });
      },
      setHaptics: (v) => {
        setHapticsEnabled(v);
        set({ hapticsEnabled: v });
      },
      setShowRoman: (v) => set({ showRoman: v }),
      setReducedMotion: (v) => set({ reducedMotion: v }),
      setSpeakMeaning: (v) => {
        setGlossEnabled(v);
        set({ speakMeaning: v });
      },
      setVoiceGender: (v) => {
        setVoiceSet(v);
        set({ voiceGender: v });
      },
      setTrack: (t) => set({ track: t, showRoman: t !== 'script' }),
      syncEffects: () => {
        const s = get();
        setMuted(!s.soundEnabled);
        setSpeechMuted(!s.soundEnabled);
        setHapticsEnabled(s.hapticsEnabled);
        setGlossEnabled(s.speakMeaning);
        setVoiceSet(s.voiceGender);
      },
    }),
    {
      name: 'harf-settings',
      storage: createJSONStorage(() => safeStorage),
      /**
       * Version 1 turns the English gloss off for everyone who already has it.
       *
       * Changing a default only reaches people who have never opened the app;
       * this setting shipped on, so every existing install has `true` written
       * to storage and would go on doing the thing that was reported. A new
       * default without a migration is a fix that reaches nobody who has the
       * problem.
       *
       * Only this one field is touched — sound, haptics, Roman and track are
       * carried through as they were, because those the learner may well have
       * chosen on purpose.
       */
      version: 2,
      migrate: (persisted, from) => {
        let s = (persisted ?? {}) as Partial<SettingsState>;
        // v1 turned the English gloss off for everyone who already had it on.
        if (from < 1) s = { ...s, speakMeaning: false };
        // v2 added the voice choice. An install that predates it has no
        // preference, and the honest default is the voice it has been hearing
        // all along rather than a silent switch to a different narrator.
        if (from < 2) s = { ...s, voiceGender: 'f' };
        return s;
      },
      onRehydrateStorage: () => (state) => state?.syncEffects(),
    }
  )
);
