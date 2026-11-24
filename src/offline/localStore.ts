import { NoteModel } from '../entity/NoteModel';
import { RoadmapModel } from '../entity/RoadmapModel';

export const LOCAL_PROFILE_KEY = 'trilha-local-profile:v1';
export const LOCAL_NOTES_KEY = 'trilha-local-notes:v1';
export const LOCAL_ROADMAPS_KEY = 'trilha-local-roadmaps:v1';
export const LOCAL_CONTRIBUTIONS_KEY = 'trilha-local-contributions:v1';
export const LOCAL_STORE_EVENT = 'trilha-local-store-change';

export interface LocalProfile {
  name: string;
  goal: string;
  updatedAt: string;
}

export interface LocalContributionDraft {
  id: string;
  createdAt: string;
  updatedAt: string;
  catalogId: string;
  catalogTitle: string;
  groupId: string;
  groupTitle: string;
  payload: Record<string, unknown>;
}

const DEFAULT_PROFILE: LocalProfile = {
  name: 'Estudante local',
  goal: '',
  updatedAt: '',
};

function notifyStoreChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(LOCAL_STORE_EVENT));
  }
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
  notifyStoreChange();
}

function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// Local Profile
// ---------------------------------------------------------------------------

export function loadLocalProfile(): LocalProfile {
  const saved = readJson<Partial<LocalProfile>>(LOCAL_PROFILE_KEY, {});
  return {
    name: typeof saved.name === 'string' && saved.name.trim() ? saved.name : DEFAULT_PROFILE.name,
    goal: typeof saved.goal === 'string' ? saved.goal : '',
    updatedAt: typeof saved.updatedAt === 'string' ? saved.updatedAt : '',
  };
}

export function saveLocalProfile(update: { name?: string; goal?: string }): LocalProfile {
  const current = loadLocalProfile();
  const next: LocalProfile = {
    name: typeof update.name === 'string' && update.name.trim() ? update.name.trim() : current.name,
    goal: typeof update.goal === 'string' ? update.goal.trim() : current.goal,
    updatedAt: new Date().toISOString(),
  };
  writeJson(LOCAL_PROFILE_KEY, next);
  return next;
}

// ---------------------------------------------------------------------------
// Local Notes
// ---------------------------------------------------------------------------

export function listAllLocalNotes(): NoteModel[] {
  const items = readJson<NoteModel[]>(LOCAL_NOTES_KEY, []);
  if (!Array.isArray(items)) return [];
  return items.filter((item) => item && typeof item === 'object' && typeof item.text === 'string');
}

export function listLocalNotes(contentId: string): NoteModel[] {
  return listAllLocalNotes().filter((note) => note.contentId === contentId);
}

export function addLocalNote(contentId: string, text: string, author?: string): NoteModel {
  const trimmed = text.trim();
  const profile = loadLocalProfile();
  const note: NoteModel = {
    id: generateId('note'),
    contentId,
    text: trimmed,
    author: author || profile.name,
    createdAt: new Date(),
  };
  const next = [note, ...listAllLocalNotes()];
  writeJson(LOCAL_NOTES_KEY, next);
  return note;
}

export function deleteLocalNote(noteId: string): void {
  const next = listAllLocalNotes().filter((note) => note.id !== noteId);
  writeJson(LOCAL_NOTES_KEY, next);
}

export function exportLocalNotesMarkdown(): string {
  const notes = listAllLocalNotes();
  if (notes.length === 0) {
    return '# Minhas anotações — Trilha Mod\n\nNenhuma anotação salva ainda.\n';
  }
  const byContent = new Map<string, NoteModel[]>();
  for (const note of notes) {
    const key = note.contentId || 'Geral';
    const list = byContent.get(key) || [];
    list.push(note);
    byContent.set(key, list);
  }
  const lines: string[] = ['# Minhas anotações — Trilha Mod', ''];
  for (const [contentId, group] of byContent.entries()) {
    lines.push(`## ${contentId}`, '');
    for (const note of group) {
      const dateStr = note.createdAt ? new Date(note.createdAt).toLocaleString('pt-BR') : '';
      lines.push(`- ${dateStr ? `(${dateStr}) ` : ''}${note.text}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Local Custom Roadmaps
// ---------------------------------------------------------------------------

function hydrateRoadmap(raw: Partial<RoadmapModel>): RoadmapModel {
  const model = Object.assign(new RoadmapModel(), raw);
  model.levels = Array.isArray(raw.levels) ? raw.levels : [];
  return model;
}

export function listLocalRoadmaps(): RoadmapModel[] {
  const rawList = readJson<Partial<RoadmapModel>[]>(LOCAL_ROADMAPS_KEY, []);
  if (!Array.isArray(rawList)) return [];
  return rawList.filter((item) => item && typeof item === 'object').map(hydrateRoadmap);
}

export function findLocalRoadmap(idOrSlug: string): RoadmapModel | undefined {
  const needle = idOrSlug.trim();
  if (!needle) return undefined;
  return listLocalRoadmaps().find((item) => item.id === needle || item.slug === needle);
}

export function isLocalSlugTaken(slug: string, excludeId?: string): boolean {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return false;
  return listLocalRoadmaps().some(
    (item) => (item.slug || '').trim().toLowerCase() === normalized && item.id !== excludeId,
  );
}

export function saveLocalRoadmap(roadmap: RoadmapModel): RoadmapModel {
  const existing = listLocalRoadmaps();
  const id = roadmap.id || generateId('roadmap');
  const slug = roadmap.slug?.trim() || id;
  const saved = hydrateRoadmap({
    ...roadmap,
    id,
    slug,
    owner: roadmap.owner || loadLocalProfile().name,
  });
  const index = existing.findIndex((item) => item.id === id);
  const next = [...existing];
  if (index >= 0) {
    next[index] = saved;
  } else {
    next.unshift(saved);
  }
  writeJson(LOCAL_ROADMAPS_KEY, next);
  return saved;
}

export function deleteLocalRoadmap(roadmapId: string): void {
  const next = listLocalRoadmaps().filter((item) => item.id !== roadmapId);
  writeJson(LOCAL_ROADMAPS_KEY, next);
  try {
    localStorage.removeItem(`selectedItems-${roadmapId}`);
  } catch {
    // ignore storage errors
  }
}

// ---------------------------------------------------------------------------
// Local Contribution Drafts
// ---------------------------------------------------------------------------

export function listContributionDrafts(): LocalContributionDraft[] {
  const items = readJson<LocalContributionDraft[]>(LOCAL_CONTRIBUTIONS_KEY, []);
  if (!Array.isArray(items)) return [];
  return items.filter(
    (item) =>
      item && typeof item === 'object' && typeof item.id === 'string' && Boolean(item.payload),
  );
}

export function saveContributionDraft(
  draft: Omit<LocalContributionDraft, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
): LocalContributionDraft {
  const existing = listContributionDrafts();
  const now = new Date().toISOString();
  const existingIndex = draft.id ? existing.findIndex((item) => item.id === draft.id) : -1;
  const saved: LocalContributionDraft = {
    id: draft.id || generateId('draft'),
    createdAt: existingIndex >= 0 ? existing[existingIndex].createdAt : now,
    updatedAt: now,
    catalogId: draft.catalogId,
    catalogTitle: draft.catalogTitle,
    groupId: draft.groupId,
    groupTitle: draft.groupTitle,
    payload: draft.payload,
  };
  const next = [...existing];
  if (existingIndex >= 0) {
    next[existingIndex] = saved;
  } else {
    next.unshift(saved);
  }
  writeJson(LOCAL_CONTRIBUTIONS_KEY, next);
  return saved;
}

export function deleteContributionDraft(draftId: string): void {
  const next = listContributionDrafts().filter((item) => item.id !== draftId);
  writeJson(LOCAL_CONTRIBUTIONS_KEY, next);
}

export function exportContributionDraftsJson(): string {
  return JSON.stringify(
    {
      app: 'trilha-mod',
      kind: 'contribution-drafts',
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      drafts: listContributionDrafts(),
    },
    null,
    2,
  );
}
