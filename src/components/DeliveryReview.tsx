export type ReviewCriterion = { id: string; title: string; hint: string };

const sources = {
  pending: 'Pendente',
  adjustment: 'Precisa de ajuste',
  observed: 'Cumprido · observação própria',
  tested: 'Cumprido · teste que executei',
  reviewed: 'Cumprido · revisão de outra pessoa',
} as const;

type Result = keyof typeof sources;
type ReviewEntry = { result: Result; evidence: string };
export type Review = Record<string, ReviewEntry>;

const maxEvidence = 1500;
const emptyEntry: ReviewEntry = { result: 'pending', evidence: '' };

function knownResult(value: unknown): value is Result {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(sources, value);
}

export function parseReview(value: unknown, criteria: readonly ReviewCriterion[]): Review {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const saved = value as Record<string, Partial<ReviewEntry> | undefined>;
  const entries: Review = {};
  for (const { id } of criteria) {
    const entry = saved[id];
    if (entry && knownResult(entry.result) && typeof entry.evidence === 'string') {
      entries[id] = { result: entry.result, evidence: entry.evidence.slice(0, maxEvidence) };
    }
  }
  return entries;
}

export function missingReviewEvidence(value: Review, criteria: readonly ReviewCriterion[]) {
  return criteria.find(({ id }) => {
    const entry = value[id];
    return entry && entry.result !== 'pending' && !entry.evidence.trim();
  });
}

export function ReviewFields({
  criteria,
  value,
  onChange,
  showHints = false,
}: {
  criteria: readonly ReviewCriterion[];
  value: Review;
  onChange: (next: Review) => void;
  showHints?: boolean;
}) {
  return (
    <>
      {criteria.map(({ id, title, hint }) => {
        const entry = value[id] ?? emptyEntry;
        return (
          <fieldset className="mission-review-item" key={id}>
            <legend>{title}</legend>
            {showHints && <p className="guide-text">{hint}</p>}
            <label>
              Resultado
              <select
                value={entry.result}
                onChange={(event) => {
                  const result = event.target.value;
                  if (knownResult(result)) onChange({ ...value, [id]: { ...entry, result } });
                }}
              >
                {Object.entries(sources).map(([result, label]) => (
                  <option key={result} value={result}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Evidência
              <textarea
                rows={3}
                maxLength={maxEvidence}
                placeholder={hint}
                value={entry.evidence}
                onChange={(event) =>
                  onChange({ ...value, [id]: { ...entry, evidence: event.target.value } })
                }
              />
            </label>
          </fieldset>
        );
      })}
    </>
  );
}
