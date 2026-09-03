import type { ComponentType } from 'react';
import { LetterFormExercise, LetterPickExercise, LetterContrastExercise } from './LetterExercises';
import { TraceExercise } from './TraceExercise';
import { LetterSpotExercise } from './LetterSpot';
import { MultipleChoiceExercise, MeaningPickExercise, ListenTapExercise } from './WordChoiceExercises';
import { TypeWordExercise, WordFromMeaningExercise } from './RecallExercises';
import { WordBuildExercise } from './WordBuild';
import { MatchingExercise } from './Matching';
import { GrammarTeachExercise, GrammarDrillExercise } from './GrammarExercises';
import { SentenceBuildExercise, ReadingExercise } from './SentenceReading';
import { DialogueExercise } from './DialogueExercise';
import type { Exercise, ExerciseKind, ExerciseProps } from './types';

/**
 * One `any` cast per case used to stand here, because narrowing
 * `exercise.kind` in a `switch` narrows the local `exercise` variable but
 * cannot re-specialize `props`'s own generic parameter — `ExerciseProps<E>`
 * is invariant in `E`, and TypeScript has no way to prove `props: ExerciseProps`
 * has become `ExerciseProps<LetterFormEx>` just because a sibling property
 * was narrowed (microsoft/TypeScript#33912). That's a real gap, not
 * carelessness, but 15 `any`s threw away every one of those components' prop
 * checks, not just the one line where the gap actually is.
 *
 * A lookup table narrows the gap to a single, precisely-typed cast: each
 * entry below is checked against its own component's real prop type (change
 * a component's signature and this object literal fails to compile), and
 * only the *lookup itself* — turning today's specific `ExerciseKind` back
 * into the general `ExerciseProps` union react needs a single component type
 * for — needs the unchecked step.
 */
const EXERCISE_COMPONENTS: { [K in ExerciseKind]: ComponentType<ExerciseProps<Extract<Exercise, { kind: K }>>> } = {
  letterForm: LetterFormExercise,
  letterPick: LetterPickExercise,
  letterTrace: TraceExercise,
  letterSpot: LetterSpotExercise,
  letterContrast: LetterContrastExercise,
  multipleChoice: MultipleChoiceExercise,
  meaningPick: MeaningPickExercise,
  listenTap: ListenTapExercise,
  wordFromMeaning: WordFromMeaningExercise,
  typeWord: TypeWordExercise,
  wordBuild: WordBuildExercise,
  matching: MatchingExercise,
  grammarTeach: GrammarTeachExercise,
  grammarDrill: GrammarDrillExercise,
  sentenceBuild: SentenceBuildExercise,
  reading: ReadingExercise,
  dialogue: DialogueExercise,
};

/** Renders the right exercise component for a given exercise. */
export function ExerciseView(props: ExerciseProps) {
  const Component = EXERCISE_COMPONENTS[props.exercise.kind] as ComponentType<ExerciseProps>;
  return <Component {...props} />;
}

export { buildLessonExercises, itemsOf } from './generator';
export type { Exercise, ExerciseProps };
