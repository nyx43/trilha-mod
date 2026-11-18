import { findLesson, lessonPlace, lessons, lessonUrl } from '../lessons';
import { LessonMeta } from '../lessons/types';
import {
  ContextSignal,
  ignoredFramingPhrases,
  ignoredStopWords,
  SectionTarget,
  TopicRule,
  webContextSignals,
  webTopicRules,
} from './webRules';

export type RecommendationKind = 'requested' | 'prerequisite' | 'support';

export interface RecommendedLesson {
  lesson: LessonMeta;
  url: string;
  courseTitle?: string;
  kind: RecommendationKind;
  order: number;
  matchedSnippets: string[];
  reason: string;
  sectionId?: string;
  sectionTitle?: string;
  practiceAction: string;
  successCriteria: string;
  objectives: string[];
}

export interface WeakMatch {
  snippet: string;
  reason: string;
  candidates: Array<{
    lesson: LessonMeta;
    url: string;
    courseTitle?: string;
  }>;
}

export interface UnmatchedFragment {
  snippet: string;
  message: 'Não encontrei uma aula para este trecho';
}

export interface StudyRecommendation {
  query: string;
  isEmpty: boolean;
  sequence: RecommendedLesson[];
  supportSuggestions: RecommendedLesson[];
  weakMatches: WeakMatch[];
  unmatched: UnmatchedFragment[];
}

interface NormalizedText {
  norm: string;
  /** Maps each character index in `norm` back to its index in the original string. */
  origIndex: number[];
}

interface SpanMatch {
  start: number;
  end: number;
  snippet: string;
  rule: TopicRule;
  phrase: string;
}

const ruleByLessonId = new Map<string, TopicRule>(
  webTopicRules.map((rule) => [rule.lessonId, rule]),
);

const lessonOrderById = new Map<string, number>(
  webTopicRules.map((rule) => [rule.lessonId, rule.order]),
);

export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function normalizeWithMap(raw: string): NormalizedText {
  const chars: string[] = [];
  const origIndex: number[] = [];

  for (let i = 0; i < raw.length; i += 1) {
    const clean = raw[i]
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    for (let j = 0; j < clean.length; j += 1) {
      chars.push(clean[j]);
      origIndex.push(i);
    }
  }

  return { norm: chars.join(''), origIndex };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findPhraseOccurrences(
  norm: string,
  phrase: string,
): Array<{ start: number; end: number }> {
  const regex = new RegExp(`(?<![a-z0-9])${escapeRegex(phrase)}(?![a-z0-9])`, 'g');
  const hits: Array<{ start: number; end: number }> = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(norm)) !== null) {
    hits.push({ start: match.index, end: match.index + match[0].length });
  }
  return hits;
}

function overlaps(
  range: { start: number; end: number },
  existing: Array<{ start: number; end: number }>,
): boolean {
  return existing.some((item) => range.start < item.end && range.end > item.start);
}

function originalSlice(raw: string, map: NormalizedText, start: number, end: number): string {
  if (start >= end || start < 0 || end > map.origIndex.length) return '';
  const origStart = map.origIndex[start];
  const origEnd = map.origIndex[end - 1] + 1;
  return raw.slice(origStart, origEnd).trim();
}

function tokenizeNormalized(normText: string): string[] {
  return normText
    .replace(/[^a-z0-9.\-_+/]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function cleanUncoveredPiece(rawPiece: string): string {
  let cleaned = rawPiece
    .replace(/^[\s\-*•–—:;,.!?()[\]]+/, '')
    .replace(/[\s\-*•–—:;,.!?()[\]]+$/, '')
    .trim();
  if (!cleaned) return '';

  // Strip framing boilerplate phrases repeatedly from the edges while preserving the real topic.
  let changed = true;
  while (changed && cleaned) {
    changed = false;
    const normCleaned = normalizeText(cleaned);
    for (const framing of ignoredFramingPhrases) {
      if (normCleaned === framing) {
        return '';
      }
      if (normCleaned.startsWith(`${framing} `)) {
        cleaned = cleaned.slice(framing.length).trim();
        changed = true;
        break;
      }
    }
  }

  // Strip leading/trailing stopwords while preserving meaningful internal connectors (e.g. "de" in "transformada de Fourier").
  const words = cleaned.split(/\s+/).filter(Boolean);
  while (words.length > 0 && ignoredStopWords.has(normalizeText(words[0]))) {
    words.shift();
  }
  while (words.length > 0 && ignoredStopWords.has(normalizeText(words[words.length - 1]))) {
    words.pop();
  }
  return words.join(' ').trim();
}

function splitUncoveredGap(rawGap: string): string[] {
  // Split lists, punctuation, and coordinating conjunctions separating distinct topics.
  const roughParts = rawGap.split(
    /(?:\r?\n|;|,|•|\s[-–—]\s|\.\s+|(?:^|\s+)(?:e|ou|com|mas|para|usando|utilizando|via)\s+|^\s*(?:\d+[.)]|[-*•])\s+)/i,
  );
  return roughParts.map(cleanUncoveredPiece).filter((part) => {
    if (!part) return false;
    const norm = normalizeText(part);
    const tokens = tokenizeNormalized(norm).filter((token) => !ignoredStopWords.has(token));
    return tokens.some((token) => token.length >= 2);
  });
}

function catalogFallbackScore(
  fragmentNorm: string,
  lesson: LessonMeta,
): { score: number; matchedTokens: number; totalTokens: number } {
  const tokens = tokenizeNormalized(fragmentNorm).filter(
    (token) => token.length >= 3 && !ignoredStopWords.has(token),
  );
  if (tokens.length === 0) return { score: 0, matchedTokens: 0, totalTokens: 0 };

  const titleNorm = normalizeText(lesson.title);
  const summaryNorm = normalizeText(lesson.summary);
  const objectivesNorm = normalizeText(lesson.objectives.join(' '));
  const titleWords = new Set(tokenizeNormalized(titleNorm));
  const objWords = new Set(tokenizeNormalized(objectivesNorm));
  const summaryWords = new Set(tokenizeNormalized(summaryNorm));

  let score = 0;
  let matchedTokens = 0;

  if (fragmentNorm.length >= 5 && titleNorm.includes(fragmentNorm)) {
    score += 5;
  }

  for (const token of tokens) {
    let hit = false;
    if (titleWords.has(token)) {
      score += 3;
      hit = true;
    }
    if (objWords.has(token)) {
      score += 2;
      hit = true;
    } else if (summaryWords.has(token)) {
      score += 1;
      hit = true;
    }
    if (hit) matchedTokens += 1;
  }

  return { score, matchedTokens, totalTokens: tokens.length };
}

function buildLessonCard(
  lesson: LessonMeta,
  kind: RecommendationKind,
  matchedSnippets: string[],
  customReason?: string,
  preferredSection?: SectionTarget,
): RecommendedLesson {
  const place = lessonPlace(lesson.id);
  const rule = ruleByLessonId.get(lesson.id);
  const targetSection = preferredSection || rule?.section;
  const reason = customReason || (rule ? `${rule.reason} (${lesson.summary})` : lesson.summary);
  const practiceAction =
    rule?.practiceAction ||
    `Pratique o objetivo principal desta aula: ${lesson.objectives[0] || lesson.summary}`;
  const baseUrl = lessonUrl(lesson.id, place?.course.id);
  const url = targetSection ? `${baseUrl}#${targetSection.id}` : baseUrl;

  return {
    lesson,
    url,
    courseTitle: place?.course.title,
    kind,
    order: lessonOrderById.get(lesson.id) ?? 90,
    matchedSnippets,
    reason,
    sectionId: targetSection?.id,
    sectionTitle: targetSection?.title,
    practiceAction,
    successCriteria:
      rule?.successCriteria ||
      'Registre o resultado esperado e confirme que consegue repetir a prática.',
    objectives: lesson.objectives,
  };
}

export function recommendStudyPlan(rawInput: string): StudyRecommendation {
  const query = rawInput.trim();
  if (!query) {
    return {
      query: '',
      isEmpty: true,
      sequence: [],
      supportSuggestions: [],
      weakMatches: [],
      unmatched: [],
    };
  }

  const map = normalizeWithMap(rawInput);

  // 1. Collect synonym candidates sorted longest-first so compound terms win over single words.
  const allRulesByPhraseLength: Array<{ phrase: string; rule: TopicRule }> = [];
  for (const rule of webTopicRules) {
    for (const phrase of rule.synonyms) {
      allRulesByPhraseLength.push({ phrase, rule });
    }
  }
  allRulesByPhraseLength.sort((a, b) => b.phrase.length - a.phrase.length);

  const coveredRanges: Array<{ start: number; end: number }> = [];
  const spanMatches: SpanMatch[] = [];

  for (const entry of allRulesByPhraseLength) {
    const hits = findPhraseOccurrences(map.norm, entry.phrase);
    for (const hit of hits) {
      if (overlaps(hit, coveredRanges)) continue;
      const snippet = originalSlice(rawInput, map, hit.start, hit.end);
      if (!snippet) continue;
      coveredRanges.push(hit);
      spanMatches.push({
        start: hit.start,
        end: hit.end,
        snippet,
        rule: entry.rule,
        phrase: entry.phrase,
      });
    }
  }

  // 2. Capture context signals (like "frontend") in uncovered portions without forcing frameworks.
  const contextMatches: Array<{ signal: ContextSignal; snippet: string }> = [];
  const signalEntries: Array<{ phrase: string; signal: ContextSignal }> = [];
  for (const signal of webContextSignals) {
    for (const phrase of signal.phrases) {
      signalEntries.push({ phrase, signal });
    }
  }
  signalEntries.sort((a, b) => b.phrase.length - a.phrase.length);

  for (const entry of signalEntries) {
    const hits = findPhraseOccurrences(map.norm, entry.phrase);
    for (const hit of hits) {
      if (overlaps(hit, coveredRanges)) continue;
      const snippet = originalSlice(rawInput, map, hit.start, hit.end);
      if (!snippet) continue;
      coveredRanges.push(hit);
      contextMatches.push({ signal: entry.signal, snippet });
    }
  }

  // 3. Group repeated synonym hits by lessonId.
  const grouped = new Map<
    string,
    {
      rule: TopicRule;
      snippets: string[];
      specificSection?: SectionTarget;
    }
  >();

  for (const m of spanMatches) {
    const existing = grouped.get(m.rule.lessonId);
    const narrowedSection = m.rule.sectionByPhrase?.[m.phrase];
    if (existing) {
      existing.snippets.push(m.snippet);
      if (!existing.specificSection && narrowedSection) {
        existing.specificSection = narrowedSection;
      }
    } else {
      grouped.set(m.rule.lessonId, {
        rule: m.rule,
        snippets: [m.snippet],
        specificSection: narrowedSection,
      });
    }
  }

  // 4. Inspect uncovered spans for catalog fallback, weak matches, or unmatched topics.
  coveredRanges.sort((a, b) => a.start - b.start);
  const uncoveredGaps: Array<{ start: number; end: number }> = [];
  let cursor = 0;
  for (const range of coveredRanges) {
    if (cursor < range.start) {
      uncoveredGaps.push({ start: cursor, end: range.start });
    }
    cursor = Math.max(cursor, range.end);
  }
  if (cursor < map.norm.length) {
    uncoveredGaps.push({ start: cursor, end: map.norm.length });
  }

  const weakMatches: WeakMatch[] = [];
  const unmatched: UnmatchedFragment[] = [];

  for (const gap of uncoveredGaps) {
    const rawGap = originalSlice(rawInput, map, gap.start, gap.end);
    if (!rawGap) continue;
    const pieces = splitUncoveredGap(rawGap);

    for (const piece of pieces) {
      const pieceNorm = normalizeText(piece);
      const scored = lessons
        .map((lesson) => ({ lesson, ...catalogFallbackScore(pieceNorm, lesson) }))
        .filter((item) => item.score >= 2)
        .sort((a, b) => b.score - a.score);

      if (scored.length === 0) {
        unmatched.push({
          snippet: piece,
          message: 'Não encontrei uma aula para este trecho',
        });
        continue;
      }

      const best = scored[0];
      const multipleSimilar = scored.length >= 2 && scored[1].score === best.score;
      const exactTitle = normalizeText(best.lesson.title) === pieceNorm;

      if (
        exactTitle ||
        (best.totalTokens >= 2 &&
          best.matchedTokens === best.totalTokens &&
          best.score >= 5 &&
          !multipleSimilar)
      ) {
        if (!grouped.has(best.lesson.id)) {
          const fallbackRule: TopicRule = ruleByLessonId.get(best.lesson.id) || {
            id: `catalog-${best.lesson.id}`,
            lessonId: best.lesson.id,
            order: 70,
            synonyms: [],
            reason: best.lesson.summary,
            practiceAction: `Pratique: ${best.lesson.objectives[0] || best.lesson.summary}`,
          };
          grouped.set(best.lesson.id, {
            rule: fallbackRule,
            snippets: [piece],
          });
        } else {
          grouped.get(best.lesson.id)!.snippets.push(piece);
        }
      } else {
        weakMatches.push({
          snippet: piece,
          reason:
            'Correspondência fraca: o termo aparece de forma ampla no catálogo. Ajuste com uma palavra mais específica se quiser focar em uma aula exata.',
          candidates: scored.slice(0, 2).map(({ lesson }) => {
            const place = lessonPlace(lesson.id);
            return {
              lesson,
              url: lessonUrl(lesson.id, place?.course.id),
              courseTitle: place?.course.title,
            };
          }),
        });
      }
    }
  }

  // 5. Assemble core sequence (requested + foundational prerequisites ordered before practice).
  const sequenceMap = new Map<string, RecommendedLesson>();

  for (const [lessonId, info] of grouped.entries()) {
    const lesson = findLesson(lessonId);
    if (!lesson) continue;
    const displaySnippets = formatGroupedSnippets(info.snippets);
    sequenceMap.set(
      lessonId,
      buildLessonCard(
        lesson,
        'requested',
        displaySnippets,
        `${info.rule.reason}`,
        info.specificSection || info.rule.section,
      ),
    );
  }

  // Inject useful prerequisites before the practical lessons when not already requested.
  for (const [lessonId, info] of grouped.entries()) {
    const prereqs = info.rule.prerequisiteIds || [];
    const targetLesson = findLesson(lessonId);
    if (!targetLesson) continue;
    for (const prereqId of prereqs) {
      if (sequenceMap.has(prereqId)) continue;
      const prereqLesson = findLesson(prereqId);
      if (!prereqLesson) continue;
      sequenceMap.set(
        prereqId,
        buildLessonCard(
          prereqLesson,
          'prerequisite',
          [],
          `Pré-requisito útil antes de "${targetLesson.title}". ${prereqLesson.summary}`,
        ),
      );
    }
  }

  const sequence = [...sequenceMap.values()].sort((a, b) => a.order - b.order);

  // 6. Optional support suggestions from context signals (never override requested status).
  const supportMap = new Map<string, RecommendedLesson>();
  for (const ctx of contextMatches) {
    for (const supportId of ctx.signal.supportLessonIds) {
      if (sequenceMap.has(supportId)) continue;
      const lesson = findLesson(supportId);
      if (!lesson) continue;
      const reason = ctx.signal.reasonByLessonId[supportId] || lesson.summary;
      if (!supportMap.has(supportId)) {
        supportMap.set(supportId, buildLessonCard(lesson, 'support', [ctx.snippet], reason));
      }
    }
  }

  const supportSuggestions = [...supportMap.values()].sort((a, b) => a.order - b.order);

  return {
    query,
    isEmpty: false,
    sequence,
    supportSuggestions,
    weakMatches,
    unmatched,
  };
}

function formatGroupedSnippets(snippets: string[]): string[] {
  const counts = new Map<string, { label: string; count: number }>();
  for (const raw of snippets) {
    const key = normalizeText(raw);
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, { label: raw, count: 1 });
    }
  }
  return [...counts.values()].map(({ label, count }) =>
    count > 1 ? `${label} (${count}×)` : label,
  );
}
