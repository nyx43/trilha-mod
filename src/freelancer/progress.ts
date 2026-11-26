import { useCallback, useEffect, useRef, useState } from 'react';
import { parseReview, Review } from '../components/DeliveryReview';
import { bookingScenario } from './bookingScenario';

export const bookingPath = '/aulas/freelancer/reservas';

export const bookingSteps = [
  { id: 'briefing', title: 'Conversa com o cliente' },
  { id: 'primeira-entrega', title: 'Primeira entrega' },
  { id: 'mudanca', title: 'Mudança de escopo' },
  { id: 'entrega-final', title: 'Entrega final' },
] as const;

type StepId = (typeof bookingSteps)[number]['id'];

interface BookingDraft {
  schemaVersion: 1;
  current: StepId;
  completed: number;
  asked: string[];
  agreement: string;
  project: string;
  initial: Review;
  impact: string;
  message: string;
  revised: Review;
}

const storageKey = 'trilha-freelancer:v1:reservas';
export const maxNoteLength = 1500;
const empty: BookingDraft = {
  schemaVersion: 1,
  current: 'briefing',
  completed: 0,
  asked: [],
  agreement: '',
  project: '',
  initial: {},
  impact: '',
  message: '',
  revised: {},
};

function readStoredDraft() {
  try {
    return localStorage.getItem(storageKey);
  } catch {
    return undefined;
  }
}

function parseDraft(raw: string | null | undefined): BookingDraft {
  try {
    const saved = JSON.parse(raw ?? 'null');
    if (saved?.schemaVersion !== 1) return empty;
    const asked = Array.isArray(saved.asked)
      ? bookingScenario.questions.filter(({ id }) => saved.asked.includes(id)).map(({ id }) => id)
      : empty.asked;
    const note = (value: unknown) =>
      typeof value === 'string' ? value.slice(0, maxNoteLength) : '';
    return {
      schemaVersion: 1,
      current: bookingSteps.find(({ id }) => id === saved.current)?.id ?? empty.current,
      completed: Number.isInteger(saved.completed)
        ? Math.max(0, Math.min(saved.completed, bookingSteps.length))
        : empty.completed,
      asked,
      agreement: note(saved.agreement),
      project: note(saved.project),
      initial: parseReview(saved.initial, bookingScenario.criteria.initial),
      impact: note(saved.impact),
      message: note(saved.message),
      revised: parseReview(saved.revised, bookingScenario.criteria.revised),
    };
  } catch {
    return empty;
  }
}

export function useBookingDraft() {
  const [snapshot, setSnapshot] = useState(() => {
    const raw = readStoredDraft();
    return { raw, draft: parseDraft(raw) };
  });
  const [storageIssue, setStorageIssue] = useState(false);
  const latest = useRef(snapshot);

  const publish = useCallback((next: typeof snapshot) => {
    latest.current = next;
    setSnapshot(next);
  }, []);

  const refresh = useCallback(() => {
    const raw = readStoredDraft();
    if (raw !== undefined && raw !== latest.current.raw) {
      publish({ raw, draft: parseDraft(raw) });
    }
    return latest.current;
  }, [publish]);

  useEffect(() => {
    function sync(event: StorageEvent) {
      if (event.key === storageKey || event.key === null) refresh();
    }
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [refresh]);

  const save = useCallback(
    (change: Partial<BookingDraft>, editingStep?: number) => {
      const { raw, draft } = refresh();
      // An older tab can remain on a page whose delivery has already been registered.
      if (editingStep !== undefined && editingStep !== draft.completed) return false;
      if (editingStep === undefined && change.current === draft.current) return true;

      const next = { ...draft, ...change };
      if (change.asked) next.asked = [...new Set([...draft.asked, ...change.asked])];
      const serialized = JSON.stringify(next);
      try {
        localStorage.setItem(storageKey, serialized);
        publish({ raw: serialized, draft: next });
        setStorageIssue(false);
      } catch {
        publish({ raw, draft: next });
        setStorageIssue(true);
      }
      return true;
    },
    [publish, refresh],
  );

  return { draft: snapshot.draft, save, storageIssue };
}
