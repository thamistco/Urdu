export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  Lesson: { lessonId: string };
  Review: undefined;
  LetterLab: { letterId?: string } | undefined;
  Leaderboard: undefined;
  Achievements: undefined;
  Settings: undefined;
};

export type MainTabParamList = {
  Learn: undefined;
  Practice: undefined;
  Profile: undefined;
};
