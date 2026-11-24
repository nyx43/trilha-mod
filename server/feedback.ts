import type { IncomingMessage, ServerResponse } from 'http';
import { DEFAULT_FORK_REPOSITORY, normalizeRepositorySlug } from '../src/config/site';
import { installationClient, resolveGitHubConfig } from './github';

interface IncomingFeedback {
  id?: string;
  category?: 'bug' | 'melhoria' | 'avaliacao';
  rating?: number;
  title?: string;
  description?: string;
  excerpt?: string;
  website?: string;
  createdAt?: string;
  context?: {
    route?: string;
    lessonId?: string;
    lessonTitle?: string;
    courseId?: string;
    courseTitle?: string;
    sectionId?: string;
    platform?: string;
    contentVersion?: string;
    viewport?: string;
  };
}

const VALID_CATEGORIES = new Set(['bug', 'melhoria', 'avaliacao']);

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const withBody = req as IncomingMessage & { body?: unknown };
  if (withBody.body !== undefined) {
    return typeof withBody.body === 'string' ? JSON.parse(withBody.body) : withBody.body;
  }
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.length;
    if (total > 64 * 1024) throw new Error('Payload too large');
    chunks.push(buf);
  }
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

export function formatFeedbackIssue(input: IncomingFeedback): {
  title: string;
  labels: string[];
  body: string;
} {
  const category = input.category && VALID_CATEGORIES.has(input.category) ? input.category : 'bug';
  const rating =
    typeof input.rating === 'number' && input.rating >= 1 && input.rating <= 5
      ? Math.round(input.rating)
      : undefined;
  const ctx = input.context || {};
  const tag =
    category === 'bug'
      ? '[BUG]'
      : category === 'melhoria'
        ? '[MELHORIA]'
        : rating
          ? `[AVALIACAO ${rating}/5]`
          : '[AVALIACAO]';
  const scope = ctx.lessonTitle || ctx.courseTitle || ctx.route || '/';
  const title = `${tag} ${(input.title || '').trim()} (${scope})`.slice(0, 140);
  const platform = ctx.platform === 'android-offline' ? 'android-offline' : 'web';
  const labels = ['triage-agente', category, platform];

  const metaJson = JSON.stringify(
    {
      schema: 'trilha-feedback-v1',
      id: input.id || null,
      category,
      rating: rating ?? null,
      route: ctx.route || '/',
      lessonId: ctx.lessonId || null,
      courseId: ctx.courseId || null,
      sectionId: ctx.sectionId || null,
      platform,
      contentVersion: ctx.contentVersion || 'unknown',
      viewport: ctx.viewport || null,
      createdAt: input.createdAt || new Date().toISOString(),
    },
    null,
    2,
  );

  const lines = [
    `## ${category === 'bug' ? 'Relato de bug' : category === 'melhoria' ? 'O que precisa melhorar' : 'Avaliação da aula/matéria'}`,
    '',
    rating ? `**Avaliação:** ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)} (${rating}/5)` : '',
    ctx.lessonTitle ? `**Aula:** ${ctx.lessonTitle} (\`${ctx.lessonId || ''}\`)` : '',
    ctx.courseTitle ? `**Matéria / Curso:** ${ctx.courseTitle}` : '',
    ctx.sectionId ? `**Seção:** \`${ctx.sectionId}\`` : '',
    `**Rota:** \`${ctx.route || '/'}\``,
    `**Plataforma:** \`${platform}\` · **Conteúdo:** \`${ctx.contentVersion || 'unknown'}\``,
    '',
    '### Descrição',
    (input.description || '').trim(),
  ].filter(Boolean);

  if (input.excerpt?.trim()) {
    lines.push('', '### Trecho ou exercício relacionado', input.excerpt.trim());
  }

  lines.push('', '### Metadados para triagem (agentes)', '```json', metaJson, '```');

  return { title, labels, body: lines.join('\n') };
}

async function createIssueWithPersonalToken(
  token: string,
  repository: string,
  issue: { title: string; body: string; labels: string[] },
) {
  const response = await fetch(`https://api.github.com/repos/${repository}/issues`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'trilha-mod-feedback',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(issue),
  });
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status}: ${await response.text()}`);
  }
  return (await response.json()) as { number: number; html_url: string };
}

export async function handleFeedback(
  req: IncomingMessage,
  res: ServerResponse,
  env: NodeJS.ProcessEnv = process.env,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Método não permitido.' });
  }

  let body: IncomingFeedback;
  try {
    body = (await readBody(req)) as IncomingFeedback;
  } catch {
    return sendJson(res, 400, { error: 'Corpo JSON inválido.' });
  }

  // Honeypot field for bots
  if (typeof body.website === 'string' && body.website.trim()) {
    return sendJson(res, 200, { mode: 'ignored' });
  }

  if (!body.category || !VALID_CATEGORIES.has(body.category)) {
    return sendJson(res, 422, { error: 'Escolha o tipo de relato (bug, melhoria ou avaliação).' });
  }
  if (typeof body.title !== 'string' || body.title.trim().length < 3) {
    return sendJson(res, 422, { error: 'Escreva um resumo curto com pelo menos 3 caracteres.' });
  }
  if (typeof body.description !== 'string' || body.description.trim().length < 5) {
    return sendJson(res, 422, { error: 'Descreva o problema ou sugestão com mais detalhes.' });
  }

  const issuePayload = formatFeedbackIssue(body);
  const repoSlug =
    normalizeRepositorySlug(env.FEEDBACK_REPOSITORY) ||
    normalizeRepositorySlug(env.CONTRIBUTIONS_REPOSITORY) ||
    DEFAULT_FORK_REPOSITORY;

  const prefilledParams = new URLSearchParams({
    title: issuePayload.title,
    labels: issuePayload.labels.join(','),
    body: issuePayload.body.slice(0, 3500),
  });
  const prefilledUrl = `https://github.com/${repoSlug}/issues/new?${prefilledParams.toString()}`;

  // 1. Prefer GitHub App installation client if configured
  const ghResolved = resolveGitHubConfig(env);
  if (ghResolved.status === 'ready') {
    try {
      const client = await installationClient(ghResolved.config);
      const created = await client.createIssue(issuePayload);
      return sendJson(res, 201, {
        issue: { number: created.number, url: created.html_url },
      });
    } catch {
      return sendJson(res, 502, {
        error: 'Não foi possível criar a issue automaticamente agora.',
        prefilledUrl,
      });
    }
  }

  // 2. Or lightweight personal/fine-grained token (`GITHUB_FEEDBACK_TOKEN`) if configured on Vercel
  const personalToken = env.GITHUB_FEEDBACK_TOKEN?.trim();
  if (personalToken) {
    try {
      const created = await createIssueWithPersonalToken(personalToken, repoSlug, issuePayload);
      return sendJson(res, 201, {
        issue: { number: created.number, url: created.html_url },
      });
    } catch {
      return sendJson(res, 502, {
        error: 'Não foi possível enviar ao GitHub agora. Use o link preenchido ou exporte o relato.',
        prefilledUrl,
      });
    }
  }

  // 3. Fallback when no GitHub server credential is configured: return prefilled GitHub Issue link
  return sendJson(res, 200, {
    mode: 'manual',
    prefilledUrl,
    issue: issuePayload,
  });
}
