import { createContext, useContext } from 'react';
import { LessonBlock } from '../../lessons/types';

export const LessonContext = createContext<{ lessonId: string; revision?: number }>({
  lessonId: 'avulsa',
});

export const useLessonIdentity = () => useContext(LessonContext);

export type Block<T extends LessonBlock['type']> = Extract<LessonBlock, { type: T }>;
