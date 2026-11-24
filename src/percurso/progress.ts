import { useSyncExternalStore } from 'react';
import {
  resolveSectionPosition,
  sectionPosition,
  SectionPosition,
} from '../lessons/sectionPosition';
import { publishedStageOrder } from './publishedSectionOrder';

export interface PercursoStore {
  schemaVersion: 1;
  completed: Record<string, string[]>;
  reached: Record<string, Record<string, number>>;
  positions?: Record<string, Record<string, SectionPosition>>;
  completedRevisions?: Record<string, Record<string, number>>;
}

export const percursoStoreKey = 'trilha-percurso:v1';
const changeEvent = 'trilha-percurso-change';
const emptyStore: PercursoStore = { schemaVersion: 1, completed: {}, reached: {} };

let cachedRaw: string | null | undefined;
let cachedValue: PercursoStore = emptyStore;

export function readPercursoStore(): PercursoStore {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(percursoStoreKey);
  } catch {
    return cachedValue;
  }
  if (cachedRaw === raw) return cachedValue;
  let value: PercursoStore = emptyStore;
  try {
    const parsed = raw ? JSON.parse(raw) : undefined;
    if (
      parsed &&
      typeof parsed === 'object' &&
      parsed.schemaVersion === 1 &&
      parsed.completed &&
      typeof parsed.completed === 'object'
    ) {
      value = {
        schemaVersion: 1,
        completed: parsed.completed,
        positions: parsed.positions,
        completedRevisions: parsed.completedRevisions,
        reached:
          parsed.reached && typeof parsed.reached === 'object' && !Array.isArray(parsed.reached)
            ? parsed.reached
            : {},
      };
    }
  } catch {
    /* Ignore unreadable local record. */
  }
  cachedRaw = raw;
  cachedValue = value;
  return value;
}

function writePercursoStore(next: PercursoStore) {
  try {
    localStorage.setItem(percursoStoreKey, JSON.stringify(next));
  } catch {
    /* Keep the current session usable when storage is unavailable or full. */
    cachedValue = next;
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

export function usePercursoStore(): PercursoStore {
  return useSyncExternalStore(subscribe, readPercursoStore, () => emptyStore);
}

export function advanceStage(
  percursoId: string,
  stageSlug: string,
  reached: number,
  sectionIds: readonly string[],
) {
  const store = readPercursoStore();
  const stages = store.reached[percursoId] || {};
  const positions = store.positions?.[percursoId] || {};
  const previous = resolveSectionPosition(
    sectionIds,
    positions[stageSlug],
    stages[stageSlug],
    publishedStageOrder[percursoId]?.[stageSlug],
  );
  if (previous >= reached || reached >= sectionIds.length) return;
  writePercursoStore({
    ...store,
    positions: {
      ...store.positions,
      [percursoId]: { ...positions, [stageSlug]: sectionPosition(sectionIds, reached) },
    },
    reached: {
      ...store.reached,
      [percursoId]: { ...stages, [stageSlug]: reached },
    },
  });
}

export function markStageDone(percursoId: string, stageSlug: string, revision?: number) {
  const store = readPercursoStore();
  const list = store.completed[percursoId] || [];
  if (list.includes(stageSlug)) return;
  writePercursoStore({
    ...store,
    ...(revision === undefined
      ? {}
      : {
          completedRevisions: {
            ...store.completedRevisions,
            [percursoId]: { ...store.completedRevisions?.[percursoId], [stageSlug]: revision },
          },
        }),
    completed: {
      ...store.completed,
      [percursoId]: [...list, stageSlug],
    },
  });
}

export function toggleStageDone(percursoId: string, stageSlug: string) {
  const store = readPercursoStore();
  const list = store.completed[percursoId] || [];
  const next = list.includes(stageSlug)
    ? list.filter((item) => item !== stageSlug)
    : [...list, stageSlug];
  const revisions = { ...store.completedRevisions?.[percursoId] };
  delete revisions[stageSlug];
  writePercursoStore({
    ...store,
    ...(store.completedRevisions
      ? {
          completedRevisions: { ...store.completedRevisions, [percursoId]: revisions },
        }
      : {}),
    completed: {
      ...store.completed,
      [percursoId]: next,
    },
  });
}
