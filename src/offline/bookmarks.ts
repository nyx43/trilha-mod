import { useSyncExternalStore } from 'react';

export const BOOKMARKS_STORAGE_KEY = 'trilha-bookmarks:v1';
const BOOKMARKS_CHANGE_EVENT = 'trilha-bookmarks-change';

export interface SavedLessonEntry {
  savedAt: string;
  courseId?: string;
}

export interface FavoriteCourseEntry {
  savedAt: string;
}

export interface RecentLessonEntry {
  openedAt: string;
  courseId?: string;
}

export interface BookmarksStore {
  schemaVersion: 1;
  savedLessons: Record<string, SavedLessonEntry>;
  favoriteCourses: Record<string, FavoriteCourseEntry>;
  recentLessons: Record<string, RecentLessonEntry>;
}

const emptyStore: BookmarksStore = {
  schemaVersion: 1,
  savedLessons: {},
  favoriteCourses: {},
  recentLessons: {},
};

let cachedRaw: string | null = null;
let cachedValue: BookmarksStore = emptyStore;

export function readBookmarks(): BookmarksStore {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
  } catch {
    return cachedValue;
  }
  if (raw === cachedRaw) return cachedValue;

  let next: BookmarksStore = emptyStore;
  try {
    const parsed = raw ? (JSON.parse(raw) as unknown) : undefined;
    if (
      parsed &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed) &&
      (parsed as { schemaVersion?: unknown }).schemaVersion === 1
    ) {
      const obj = parsed as Record<string, unknown>;
      const savedLessons =
        obj.savedLessons && typeof obj.savedLessons === 'object' && !Array.isArray(obj.savedLessons)
          ? (obj.savedLessons as Record<string, SavedLessonEntry>)
          : {};
      const favoriteCourses =
        obj.favoriteCourses &&
        typeof obj.favoriteCourses === 'object' &&
        !Array.isArray(obj.favoriteCourses)
          ? (obj.favoriteCourses as Record<string, FavoriteCourseEntry>)
          : {};
      const recentLessons =
        obj.recentLessons &&
        typeof obj.recentLessons === 'object' &&
        !Array.isArray(obj.recentLessons)
          ? (obj.recentLessons as Record<string, RecentLessonEntry>)
          : {};
      next = { schemaVersion: 1, savedLessons, favoriteCourses, recentLessons };
    }
  } catch {
    // Ignore malformed store
  }

  cachedRaw = raw;
  cachedValue = next;
  return next;
}

function writeBookmarks(next: BookmarksStore): void {
  try {
    const serialized = JSON.stringify(next);
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, serialized);
    cachedRaw = serialized;
    cachedValue = next;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(BOOKMARKS_CHANGE_EVENT));
    }
  } catch {
    // Storage unavailable
  }
}

export function isLessonSaved(lessonId: string): boolean {
  return Boolean(readBookmarks().savedLessons[lessonId]);
}

export function toggleSavedLesson(lessonId: string, courseId?: string): boolean {
  const current = readBookmarks();
  const nextSaved = { ...current.savedLessons };
  let saved: boolean;
  if (nextSaved[lessonId]) {
    delete nextSaved[lessonId];
    saved = false;
  } else {
    nextSaved[lessonId] = {
      savedAt: new Date().toISOString(),
      ...(courseId ? { courseId } : {}),
    };
    saved = true;
  }
  writeBookmarks({ ...current, savedLessons: nextSaved });
  return saved;
}

export function touchRecentLesson(lessonId: string, courseId?: string): void {
  const current = readBookmarks();
  const nextRecent = {
    ...current.recentLessons,
    [lessonId]: {
      openedAt: new Date().toISOString(),
      ...(courseId ? { courseId } : {}),
    },
  };
  writeBookmarks({ ...current, recentLessons: nextRecent });
}

export function isCourseFavorite(courseId: string): boolean {
  return Boolean(readBookmarks().favoriteCourses[courseId]);
}

export function toggleFavoriteCourse(courseId: string): boolean {
  const current = readBookmarks();
  const nextFavorites = { ...current.favoriteCourses };
  let favorited: boolean;
  if (nextFavorites[courseId]) {
    delete nextFavorites[courseId];
    favorited = false;
  } else {
    nextFavorites[courseId] = { savedAt: new Date().toISOString() };
    favorited = true;
  }
  writeBookmarks({ ...current, favoriteCourses: nextFavorites });
  return favorited;
}

function subscribe(listener: () => void) {
  if (typeof window === 'undefined') return () => undefined;
  const onStorage = (event: StorageEvent) => {
    if (!event.key || event.key === BOOKMARKS_STORAGE_KEY) listener();
  };
  window.addEventListener(BOOKMARKS_CHANGE_EVENT, listener);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(BOOKMARKS_CHANGE_EVENT, listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function useBookmarks(): BookmarksStore {
  return useSyncExternalStore(subscribe, readBookmarks, () => emptyStore);
}
