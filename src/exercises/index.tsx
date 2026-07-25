import { LetterFormExercise, LetterPickExercise } from './LetterExercises';
import { TraceExercise } from './TraceExercise';
import {
  MultipleChoiceExercise,
  MeaningPickExercise,
  ListenTapExercise,
} from './WordChoiceExercises';
import { TypeWordExercise, WordFromMeaningExercise } from './RecallExercises';
import { WordBuildExercise } from './WordBuild';
import { MatchingExercise } from './Matching';
import { GrammarTeachExercise, GrammarDrillExercise } from './GrammarExercises';
import { SentenceBuildExercise, ReadingExercise } from './SentenceReading';
import type { Exercise, ExerciseProps } from './types';

/** Renders the right exercise component for a given exercise. */
export function ExerciseView(props: ExerciseProps) {
  const { exercise } = props;
  switch (exercise.kind) {
    case 'letterForm':
      return <LetterFormExercise {...(props as any)} />;
    case 'letterPick':
      return <LetterPickExercise {...(props as any)} />;
    case 'letterTrace':
      return <TraceExercise {...(props as any)} />;
    case 'multipleChoice':
      return <MultipleChoiceExercise {...(props as any)} />;
    case 'meaningPick':
      return <MeaningPickExercise {...(props as any)} />;
    case 'listenTap':
      return <ListenTapExercise {...(props as any)} />;
    case 'wordFromMeaning':
      return <WordFromMeaningExercise {...(props as any)} />;
    case 'typeWord':
      return <TypeWordExercise {...(props as any)} />;
    case 'wordBuild':
      return <WordBuildExercise {...(props as any)} />;
    case 'matching':
      return <MatchingExercise {...(props as any)} />;
    case 'grammarTeach':
      return <GrammarTeachExercise {...(props as any)} />;
    case 'grammarDrill':
      return <GrammarDrillExercise {...(props as any)} />;
    case 'sentenceBuild':
      return <SentenceBuildExercise {...(props as any)} />;
    case 'reading':
      return <ReadingExercise {...(props as any)} />;
    default:
      return null;
  }
}

export { buildLessonExercises, itemsOf } from './generator';
export type { Exercise, ExerciseProps };
