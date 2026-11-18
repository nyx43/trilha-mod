import { findLesson } from '../lessons';
import type { RecommendedLesson } from './studyRecommender';

export const lessonPlanStorageKey = 'trilha-plano-aulas:v1';

export interface LessonPlanStep {
  lessonId: string;
  sectionId?: string;
  sectionTitle?: string;
  practiceAction: string;
  successCriteria: string;
  done: boolean;
}

export interface SavedLessonPlan {
  schemaVersion: 1;
  steps: LessonPlanStep[];
  lastOpened?: string;
  deliveryChecklist: boolean;
}

function isStep(value: unknown): value is LessonPlanStep {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<LessonPlanStep>;
  return (
    typeof item.lessonId === 'string' &&
    Boolean(findLesson(item.lessonId)) &&
    (item.sectionId === undefined ||
      (typeof item.sectionId === 'string' && /^[a-z0-9-]+$/.test(item.sectionId))) &&
    (item.sectionTitle === undefined || typeof item.sectionTitle === 'string') &&
    typeof item.practiceAction === 'string' &&
    typeof item.successCriteria === 'string' &&
    typeof item.done === 'boolean'
  );
}

export function readLessonPlan(): SavedLessonPlan | undefined {
  try {
    const raw = localStorage.getItem(lessonPlanStorageKey);
    const plan = raw ? JSON.parse(raw) : undefined;
    if (plan?.schemaVersion !== 1 || !Array.isArray(plan.steps)) return;
    const steps = plan.steps.filter(isStep);
    if (steps.length)
      return {
        schemaVersion: 1,
        steps,
        lastOpened: typeof plan.lastOpened === 'string' ? plan.lastOpened : undefined,
        deliveryChecklist: plan.deliveryChecklist === true,
      };
  } catch {
    return;
  }
}

export function makeLessonPlan(
  items: RecommendedLesson[],
  includeChecklist: boolean,
  previous?: SavedLessonPlan,
): SavedLessonPlan {
  const steps = items.map<LessonPlanStep>((item) => ({
    lessonId: item.lesson.id,
    sectionId: item.sectionId,
    sectionTitle: item.sectionTitle,
    practiceAction: item.practiceAction,
    successCriteria: item.successCriteria,
    done:
      previous?.steps.some(
        (step) =>
          step.lessonId === item.lesson.id && step.sectionId === item.sectionId && step.done,
      ) || false,
  }));
  return {
    schemaVersion: 1,
    steps,
    lastOpened: steps.find((step) => step.lessonId === previous?.lastOpened && !step.done)
      ?.lessonId,
    deliveryChecklist: includeChecklist,
  };
}
