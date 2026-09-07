export type RootStackParamList = {
  Login: undefined;
  Onboarding: undefined;
  Main: undefined;
  Lesson: { lessonId: string };
  Review: undefined;
  LetterLab: { letterId?: string } | undefined;
  Leaderboard: undefined;
  Achievements: undefined;
  Settings: undefined;
};

/**
 * Screens `nav.navigate(screen)` can reach with no second argument.
 * `navigate`'s real signature is overloaded on whether a screen's params are
 * `undefined` — passing just a name for `Lesson` or `LetterLab` (both take
 * real params) does not typecheck, and a plain `keyof RootStackParamList`
 * can't express that distinction, which is what used to make a blanket
 * `as any` look necessary at every call site built to be a simple "go to
 * this screen" link.
 */
export type NoParamScreen = {
  [K in keyof RootStackParamList]: RootStackParamList[K] extends undefined ? K : never;
}[keyof RootStackParamList];

export type MainTabParamList = {
  Learn: undefined;
  Practice: undefined;
  Profile: undefined;
};
