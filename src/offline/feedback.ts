import { useSyncExternalStore } from 'react';
import { forkIssuesUrl } from '../config/site';
import { getContentVersion, isOfflineApp, OFFLINE_APP_BUILD } from '../runtime/mode';

export const FEEDBACK_STORAGE_KEY = 'trilha-local-feedback:v1';
const FEEDBACK_CHANGE_EVENT = 'trilha-feedback-change';

export type FeedbackCategory = 'bug' | 'melhoria' | 'avaliacao';

export const FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug: 'Relato de bug',
  melhoria: 'O que precisa melhorar',
  avaliacao: 'Avaliação da aula/matéria',
};

export interface FeedbackContext {
  route: string;
  lessonId?: string;
  lessonTitle?: string;
  courseId?: string;
  courseTitle?: string;
  sectionId?: string;
  platform: 'android-offline' | 'web';
  contentVersion: string;
  viewport?: string;
}

export interface FeedbackReport {
  id: string;
  category: FeedbackCategory;
  rating?: number;
  title: string;
  description: string;
  excerpt?: string;
  context: FeedbackContext;
  createdAt: string;
  status: 'pending' | 'sent';
  issueUrl?: string;
  issueNumber?: number;
}

export interface FeedbackSubmissionResult {
  status: 'sent' | 'saved-offline' | 'manual-github';
  report: FeedbackReport;
  prefilledUrl: string;
  message: string;
}

const emptyReports: FeedbackReport[] = [];
let cachedRaw: string | null = null;
let cachedList: FeedbackReport[] = emptyReports;

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `fb-${crypto.randomUUID()}`;
  }
  return `fb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function listFeedbackReports(): FeedbackReport[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
  } catch {
    return cachedList;
  }
  if (raw === cachedRaw) return cachedList;

  let list: FeedbackReport[] = emptyReports;
  try {
    const parsed = raw ? (JSON.parse(raw) as unknown) : undefined;
    if (Array.isArray(parsed)) {
      list = parsed.filter(
        (item): item is FeedbackReport =>
          Boolean(item) &&
          typeof item === 'object' &&
          typeof (item as FeedbackReport).id === 'string' &&
          typeof (item as FeedbackReport).title === 'string',
      );
    }
  } catch {
    // Ignore malformed data
  }
  cachedRaw = raw;
  cachedList = list;
  return list;
}

function writeFeedbackReports(next: FeedbackReport[]): void {
  try {
    const serialized = JSON.stringify(next);
    localStorage.setItem(FEEDBACK_STORAGE_KEY, serialized);
    cachedRaw = serialized;
    cachedList = next;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(FEEDBACK_CHANGE_EVENT));
    }
  } catch {
    // Ignore storage errors
  }
}

export function saveFeedbackReport(report: FeedbackReport): FeedbackReport {
  const existing = listFeedbackReports();
  const idx = existing.findIndex((item) => item.id === report.id);
  const next = [...existing];
  if (idx >= 0) next[idx] = report;
  else next.unshift(report);
  writeFeedbackReports(next);
  return report;
}

export function deleteFeedbackReport(id: string): void {
  writeFeedbackReports(listFeedbackReports().filter((item) => item.id !== id));
}

export function markFeedbackReportSent(
  id: string,
  issue: { number?: number; url: string },
): FeedbackReport | undefined {
  const existing = listFeedbackReports();
  const idx = existing.findIndex((item) => item.id === id);
  if (idx < 0) return undefined;
  const updated: FeedbackReport = {
    ...existing[idx],
    status: 'sent',
    issueUrl: issue.url,
    issueNumber: issue.number,
  };
  const next = [...existing];
  next[idx] = updated;
  writeFeedbackReports(next);
  return updated;
}

export function createFeedbackReport(input: {
  category: FeedbackCategory;
  rating?: number;
  title: string;
  description: string;
  excerpt?: string;
  context: Partial<FeedbackContext> & { route: string };
}): FeedbackReport {
  const viewport =
    typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : undefined;
  return {
    id: generateId(),
    category: input.category,
    ...(typeof input.rating === 'number' && input.rating >= 1 && input.rating <= 5
      ? { rating: Math.round(input.rating) }
      : {}),
    title: input.title.trim(),
    description: input.description.trim(),
    ...(input.excerpt?.trim() ? { excerpt: input.excerpt.trim() } : {}),
    context: {
      route: input.context.route,
      ...(input.context.lessonId ? { lessonId: input.context.lessonId } : {}),
      ...(input.context.lessonTitle ? { lessonTitle: input.context.lessonTitle } : {}),
      ...(input.context.courseId ? { courseId: input.context.courseId } : {}),
      ...(input.context.courseTitle ? { courseTitle: input.context.courseTitle } : {}),
      ...(input.context.sectionId ? { sectionId: input.context.sectionId } : {}),
      platform: isOfflineApp() ? 'android-offline' : 'web',
      contentVersion: getContentVersion(),
      ...(viewport ? { viewport } : {}),
    },
    createdAt: new Date().toISOString(),
    status: 'pending',
  };
}

export function buildGitHubIssuePayload(report: FeedbackReport): {
  title: string;
  labels: string[];
  body: string;
} {
  const tag =
    report.category === 'bug'
      ? '[BUG]'
      : report.category === 'melhoria'
      ? '[MELHORIA]'
      : report.rating
      ? `[AVALIACAO ${report.rating}/5]`
      : '[AVALIACAO]';

  const scope = report.context.lessonTitle || report.context.courseTitle || report.context.route;
  const issueTitle = `${tag} ${report.title} (${scope})`.slice(0, 140);
  const labels = ['triage-agente', report.category, report.context.platform];

  const metaJson = JSON.stringify(
    {
      schema: 'trilha-feedback-v1',
      id: report.id,
      category: report.category,
      rating: report.rating ?? null,
      route: report.context.route,
      lessonId: report.context.lessonId ?? null,
      courseId: report.context.courseId ?? null,
      sectionId: report.context.sectionId ?? null,
      platform: report.context.platform,
      contentVersion: report.context.contentVersion,
      viewport: report.context.viewport ?? null,
      createdAt: report.createdAt,
    },
    null,
    2,
  );

  const lines: string[] = [
    `## ${FEEDBACK_CATEGORY_LABELS[report.category]}`,
    '',
    report.rating
      ? `**Avaliação:** ${'★'.repeat(report.rating)}${'☆'.repeat(5 - report.rating)} (${
          report.rating
        }/5)`
      : '',
    report.context.lessonTitle
      ? `**Aula:** ${report.context.lessonTitle} (\`${report.context.lessonId}\`)`
      : '',
    report.context.courseTitle ? `**Matéria / Curso:** ${report.context.courseTitle}` : '',
    report.context.sectionId ? `**Seção:** \`${report.context.sectionId}\`` : '',
    `**Rota:** \`${report.context.route}\``,
    `**Plataforma:** \`${report.context.platform}\` · **Conteúdo:** \`${report.context.contentVersion}\``,
    '',
    '### Descrição',
    report.description,
  ].filter(Boolean);

  if (report.excerpt) {
    lines.push('', '### Trecho ou exercício relacionado', report.excerpt);
  }

  lines.push('', '### Metadados para triagem (agentes)', '```json', metaJson, '```');

  return {
    title: issueTitle,
    labels,
    body: lines.join('\n'),
  };
}

export function buildGitHubPrefilledIssueUrl(report: FeedbackReport): string {
  const { title, labels, body } = buildGitHubIssuePayload(report);
  const params = new URLSearchParams({
    title,
    labels: labels.join(','),
    body: body.slice(0, 3500),
  });
  return `${forkIssuesUrl}?${params.toString()}`;
}

export async function submitFeedbackReport(
  report: FeedbackReport,
): Promise<FeedbackSubmissionResult> {
  const saved = saveFeedbackReport(report);
  const prefilledUrl = buildGitHubPrefilledIssueUrl(saved);

  if (OFFLINE_APP_BUILD || isOfflineApp()) {
    return {
      status: 'saved-offline',
      report: saved,
      prefilledUrl,
      message:
        'Relato salvo localmente neste aparelho. Você pode exportá-lo para os agentes ou abrir no GitHub quando estiver conectado.',
    };
  }

  try {
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saved),
    });
    const body = (await response.json().catch(() => ({}))) as {
      issue?: { number?: number; url?: string };
      mode?: string;
      prefilledUrl?: string;
      error?: string;
    };
    if (response.status === 201 && body.issue?.url) {
      const updated =
        markFeedbackReportSent(saved.id, { number: body.issue.number, url: body.issue.url }) ||
        saved;
      return {
        status: 'sent',
        report: updated,
        prefilledUrl,
        message: `Issue #${
          body.issue.number ?? ''
        } criada no GitHub com metadados prontos para análise.`,
      };
    }
    return {
      status: 'manual-github',
      report: saved,
      prefilledUrl: body.prefilledUrl || prefilledUrl,
      message:
        body.error ||
        'Relato salvo localmente. Envio automático ao GitHub não está ativo neste servidor — use o botão abaixo para abrir a issue já preenchida ou exportar o relato.',
    };
  } catch {
    return {
      status: 'manual-github',
      report: saved,
      prefilledUrl,
      message:
        'Sem conexão com a API agora. O relato ficou salvo localmente e pode ser aberto no GitHub ou exportado.',
    };
  }
}

export function exportFeedbackReportsJson(): string {
  return JSON.stringify(
    {
      app: 'trilha-mod',
      schema: 'trilha-feedback-export-v1',
      exportedAt: new Date().toISOString(),
      contentVersion: getContentVersion(),
      reports: listFeedbackReports(),
    },
    null,
    2,
  );
}

export function exportFeedbackReportsMarkdown(): string {
  const reports = listFeedbackReports();
  if (reports.length === 0) {
    return '# Relatos e avaliações — Trilha Mod\n\nNenhum relato salvo ainda.\n';
  }
  const chunks = ['# Relatos, bugs e avaliações — Trilha Mod', ''];
  for (const report of reports) {
    const issue = buildGitHubIssuePayload(report);
    chunks.push(
      `---`,
      `# ${issue.title}`,
      `Status local: \`${report.status}\`${report.issueUrl ? ` · Issue: ${report.issueUrl}` : ''}`,
      '',
      issue.body,
      '',
    );
  }
  return chunks.join('\n');
}

function subscribe(listener: () => void) {
  if (typeof window === 'undefined') return () => undefined;
  const onStorage = (event: StorageEvent) => {
    if (!event.key || event.key === FEEDBACK_STORAGE_KEY) listener();
  };
  window.addEventListener(FEEDBACK_CHANGE_EVENT, listener);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(FEEDBACK_CHANGE_EVENT, listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function useFeedbackReports(): FeedbackReport[] {
  return useSyncExternalStore(subscribe, listFeedbackReports, () => emptyReports);
}
