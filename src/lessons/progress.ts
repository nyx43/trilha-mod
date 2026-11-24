import { useCallback, useSyncExternalStore } from 'react';
import type { SectionPosition } from './sectionPosition';

export interface LessonRecord {
  /** Index of the furthest section opened by the learner. */
  reached: number;
  position?: SectionPosition;
  /** Activity key → answered correctly on the first attempt. */
  answers: Record<string, boolean>;
  answerRevisions?: Record<string, number>;
  /** Activity key → eventually solved by the learner (independent of first-attempt score). */
  completed?: Record<string, boolean>;
  done?: string;
  doneRevision?: number;
}

export interface LessonStore {
  schemaVersion: 1;
  lessons: Record<string, LessonRecord>;
  /** Trail groups already credited in the study record after their lessons were finished. */
  credited: string[];
}

export interface CardState {
  box: number;
  due: string;
  reviewedAt?: string;
}

export interface ReviewStore {
  schemaVersion: 1;
  cards: Record<string, CardState>;
}

export const lessonStoreKey = 'trilha-lessons:v1';
export const reviewStoreKey = 'trilha-review:v1';
const changeEvent = 'trilha-lessons-change';

/** Days until the next review for each Leitner box. */
export const reviewIntervals = [0, 1, 3, 7, 14, 30];

const emptyLessons: LessonStore = { schemaVersion: 1, lessons: {}, credited: [] };
const emptyReview: ReviewStore = { schemaVersion: 1, cards: {} };

const cache = new Map<string, { raw: string | null; value: unknown }>();

function readStore<T extends { schemaVersion: 1 }>(key: string, fallback: T): T {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return (cache.get(key)?.value as T) ?? fallback;
  }
  const cached = cache.get(key);
  if (cached && cached.raw === raw) return cached.value as T;
  let value: T = fallback;
  try {
    const parsed = raw ? (JSON.parse(raw) as unknown) : undefined;
    if (
      parsed &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed) &&
      (parsed as { schemaVersion?: unknown }).schemaVersion === 1
    ) {
      const obj = parsed as Record<string, unknown>;
      if ('lessons' in fallback) {
        const lessons =
          obj.lessons && typeof obj.lessons === 'object' && !Array.isArray(obj.lessons)
            ? obj.lessons
            : {};
        const credited = Array.isArray(obj.credited)
          ? obj.credited.filter((item): item is string => typeof item === 'string')
          : [];
        value = { ...fallback, lessons, credited } as T;
      } else if ('cards' in fallback) {
        const cards =
          obj.cards && typeof obj.cards === 'object' && !Array.isArray(obj.cards) ? obj.cards : {};
        value = { ...fallback, cards } as T;
      } else {
        value = { ...fallback, ...(obj as Partial<T>) };
      }
    }
  } catch {
    /* An unreadable record is ignored, never overwritten until the learner acts. */
  }
  cache.set(key, { raw, value });
  return value;
}

function writeStore(key: string, value: unknown) {
  let currentRaw: string | null = null;
  try {
    currentRaw = localStorage.getItem(key);
  } catch {
    currentRaw = null;
  }
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    cache.set(key, { raw: serialized, value });
  } catch {
    /* Storage can be unavailable in private mode; keep the session working in memory. */
    cache.set(key, { raw: currentRaw, value });
  }
  window.dispatchEvent(new Event(changeEvent));
}

function subscribe(callback: () => void) {
  window.addEventListener(changeEvent, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(changeEvent, callback);
    window.removeEventListener('storage', callback);
  };
}

export const readLessons = () => readStore(lessonStoreKey, emptyLessons);
export const readReview = () => readStore(reviewStoreKey, emptyReview);

export function updateLessons(change: (store: LessonStore) => LessonStore) {
  writeStore(lessonStoreKey, change(readLessons()));
}

export function updateLesson(id: string, change: (record: LessonRecord) => LessonRecord) {
  updateLessons((store) => ({
    ...store,
    lessons: { ...store.lessons, [id]: change(store.lessons[id] || { reached: 0, answers: {} }) },
  }));
}

export function useLessonStore(): LessonStore {
  return useSyncExternalStore(subscribe, readLessons, () => emptyLessons);
}

export function useReviewStore(): ReviewStore {
  return useSyncExternalStore(subscribe, readReview, () => emptyReview);
}

export function useLessonRecord(id: string) {
  const store = useLessonStore();
  const record = store.lessons[id];
  const update = useCallback(
    (change: (record: LessonRecord) => LessonRecord) => updateLesson(id, change),
    [id],
  );
  return [record, update] as const;
}

/** Keeps only the first attempt, so the score reflects what the learner knew. */
export function recordAnswer(lessonId: string, key: string, correct: boolean, revision = 1) {
  updateLesson(lessonId, (record) =>
    Object.prototype.hasOwnProperty.call(record.answers, key)
      ? record
      : {
          ...record,
          answers: { ...record.answers, [key]: correct },
          answerRevisions: { ...record.answerRevisions, [key]: revision },
        },
  );
}

export type ExerciseOutcome = 'pass' | 'fail' | 'solution';

/**
 * Records the first evaluated attempt (including failure or revealing a solution before solving)
 * while tracking subsequent learner-authored completion separately.
 * Existing recorded answers are preserved untouched.
 */
export function recordExerciseOutcome(
  lessonId: string,
  key: string,
  outcome: ExerciseOutcome,
  revision = 1,
) {
  updateLesson(lessonId, (record) => {
    const hasFirstAttempt = Object.prototype.hasOwnProperty.call(record.answers, key);
    const nextAnswers = hasFirstAttempt
      ? record.answers
      : { ...record.answers, [key]: outcome === 'pass' };
    const nextAnswerRevisions = hasFirstAttempt
      ? record.answerRevisions
      : { ...record.answerRevisions, [key]: revision };
    const shouldMarkCompleted = outcome === 'pass' && !record.completed?.[key];
    const nextCompleted = shouldMarkCompleted
      ? { ...record.completed, [key]: true }
      : record.completed;

    if (hasFirstAttempt && !shouldMarkCompleted) return record;
    return {
      ...record,
      answers: nextAnswers,
      answerRevisions: nextAnswerRevisions,
      ...(nextCompleted ? { completed: nextCompleted } : {}),
    };
  });
}

export function localDay(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addDays(day: string, days: number): string {
  const [year, month, date] = day.split('-').map(Number);
  return localDay(new Date(year, month - 1, date + days));
}

export function nextCardState(
  current: CardState | undefined,
  remembered: boolean,
  today = localDay(),
): CardState {
  if (current?.reviewedAt === today) return current;
  if (!remembered) return { box: 1, due: addDays(today, 1), reviewedAt: today };
  const box = Math.min((current?.box || 0) + 1, reviewIntervals.length - 1);
  return { box, due: addDays(today, reviewIntervals[box]), reviewedAt: today };
}

export const cardKey = (lessonId: string, cardId: string) => `${lessonId}:${cardId}`;

export function rateCard(key: string, remembered: boolean, today = localDay()) {
  const store = readReview();
  const current = store.cards[key];
  const next = nextCardState(current, remembered, today);
  if (current === next) return;
  writeStore(reviewStoreKey, {
    ...store,
    cards: { ...store.cards, [key]: next },
  });
}

/** Cards join the deck when a lesson ends, due the next day. */
export function enrollCards(keys: string[], today = localDay()) {
  const store = readReview();
  const cards = { ...store.cards };
  keys.forEach((key) => {
    if (!cards[key]) cards[key] = { box: 1, due: addDays(today, 1) };
  });
  writeStore(reviewStoreKey, { ...store, cards });
}

export function dueCardKeys(store: ReviewStore, today = localDay()): string[] {
  return Object.entries(store.cards)
    .filter(([, state]) => state.due <= today)
    .sort(([, a], [, b]) => a.box - b.box || a.due.localeCompare(b.due))
    .map(([key]) => key);
}

export function lessonScore(record: LessonRecord | undefined, activityIds?: ReadonlySet<string>) {
  const values = Object.entries(record?.answers || {})
    .filter(([key]) => !activityIds || activityIds.has(key))
    .map(([, correct]) => correct);
  return { correct: values.filter(Boolean).length, total: values.length };
}

/**
 * Groups of a trail whose lessons are all finished and that were not yet credited there.
 * Crediting happens once per trail, so the learner can still uncheck the step afterwards.
 */
export function groupsToCredit(
  store: LessonStore,
  lessonsByGroup: Record<string, string[]>,
  roadmapId: string,
): string[] {
  return Object.entries(lessonsByGroup)
    .filter(
      ([groupId, ids]) =>
        ids.length > 0 &&
        !store.credited.includes(`${roadmapId}/${groupId}`) &&
        ids.every((id) => store.lessons[id]?.done),
    )
    .map(([groupId]) => groupId);
}

export function markCredited(roadmapId: string, groupIds: string[]) {
  if (!groupIds.length) return;
  updateLessons((store) => ({
    ...store,
    credited: [...new Set([...store.credited, ...groupIds.map((id) => `${roadmapId}/${id}`)])],
  }));
}
