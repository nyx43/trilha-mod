import type { IncomingMessage, ServerResponse } from 'http';
import {
  contributionFile,
  contributionResource,
  FieldErrors,
  validateDraft,
  youtubeId,
} from '../src/contributions/validate';
import {
  Contribution,
  ContributionDraft,
  contributionTurnstileAction,
  languageLabels,
  resourceKindLabels,
} from '../src/contributions/types';
import type { RoadmapCatalog } from '../src/learning/types';
import { normalizeSiteUrl, resolveSiteUrl } from '../src/config/site';
import { GitHubError, installationClient, resolveGitHubConfig } from './github';

type Request = IncomingMessage & { body?: unknown };

const label = 'contribuição';
const maxOpenPulls = 40;
const perHour = 5;
const recent = new Map<string, number[]>();

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (!res.getHeader('Cache-Control')) res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

async function readBody(req: Request): Promise<unknown> {
  const limit = 16_000;
  if (req.body !== undefined) {
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (Buffer.byteLength(raw) > limit) throw new Error('too large');
    return JSON.parse(raw);
  }
  const chunks: Buffer[] = [];
  let bytes = 0;
  for await (const chunk of req) {
    const buffer = Buffer.from(chunk);
    bytes += buffer.length;
    if (bytes > limit) throw new Error('too large');
    chunks.push(buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function clientIP(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  return (
    (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0].trim() ||
    req.socket.remoteAddress ||
    ''
  );
}

function allowedOrigin(req: Request, env: NodeJS.ProcessEnv, hosted: boolean): boolean {
  const origin = req.headers.origin;
  if (!origin) return false;
  if (hosted) {
    const trusted = [new URL(resolveSiteUrl(env)).origin];
    for (const host of [env.VERCEL_URL, env.VERCEL_PROJECT_PRODUCTION_URL]) {
      if (host) trusted.push(`https://${host}`);
    }
    return trusted.includes(origin) && new URL(origin).host === req.headers.host;
  }
  const host = req.headers.host || '';
  return (
    /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host) &&
    origin === `http://${host}` &&
    ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress || '')
  );
}

function limited(ip: string): boolean {
  const now = Date.now();
  if (recent.size > 500) {
    for (const [key, times] of recent.entries()) {
      const fresh = times.filter((time) => now - time < 3_600_000);
      if (fresh.length) recent.set(key, fresh);
      else recent.delete(key);
    }
  }
  const hits = (recent.get(ip) || []).filter((time) => now - time < 3_600_000);
  if (hits.length >= perHour) return true;
  recent.set(ip, [...hits, now]);
  return false;
}

async function verifyTurnstile(
  token: unknown,
  ip: string,
  secret: string,
  hostname: string,
): Promise<boolean> {
  if (typeof token !== 'string' || !token) return false;
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return false;
    const result = await response.json();
    return (
      result.success === true &&
      result.hostname === hostname &&
      result.action === contributionTurnstileAction
    );
  } catch {
    return false;
  }
}

function checkAgainstCatalog(draft: ContributionDraft, catalog: RoadmapCatalog): FieldErrors {
  const group = catalog.groups[draft.groupId];
  if (!group) return { groupId: 'Esse assunto não existe mais na trilha. Recarregue a página.' };
  if (draft.kind === 'resource') {
    const node = catalog.nodes[draft.nodeId];
    if (!node || node.groupId !== group.id) return { nodeId: 'Escolha um passo deste assunto.' };
  }
  const url = contributionResource(draft).url.replace(/\/$/, '');
  if (Object.values(catalog.resources).some((resource) => resource.url.replace(/\/$/, '') === url))
    return {
      [draft.kind === 'resource' ? 'resource.url' : 'step.resource.url']:
        'Esse link já está na trilha.',
    };
  return {};
}

// User text ends up in a public PR body: neutralize mentions, tables and raw HTML.
function md(text: string): string {
  return text
    .replace(/[<>]/g, '')
    .replace(/\|/g, '\\|')
    .replace(/@/g, '@\u200b')
    .replace(/\s+/g, ' ');
}

function pullBody(
  contribution: Contribution,
  catalog: RoadmapCatalog,
  origin: string,
  github?: string,
): string {
  const group = catalog.groups[contribution.groupId];
  const resource =
    contribution.kind === 'resource' ? contribution.resource : contribution.step.resource;
  const language = resource.language ? languageLabels[resource.language] : 'Idioma não informado';
  const author = contribution.author?.name ? md(contribution.author.name) : '';
  const rows = [
    ['Trilha', `[${catalog.title}](${origin}/roadmap/${catalog.id})`],
    ['Assunto', `${md(group.title)} (\`${group.id}\`)`],
    contribution.kind === 'resource'
      ? ['Passo', md(catalog.nodes[contribution.nodeId].title)]
      : ['Novo passo', `**${md(contribution.step.title)}**: ${md(contribution.step.description)}`],
    [
      'Conteúdo',
      `${resourceKindLabels[resource.kind]} · ${language} · [${md(resource.title)}](${
        resource.url
      })`,
    ],
    ['Sugerido por', [author, github ? `@${github}` : ''].filter(Boolean).join(' ') || 'Anônimo'],
  ];
  return [
    `## ${contribution.kind === 'resource' ? 'Sugestão de conteúdo' : 'Sugestão de novo passo'}`,
    '',
    '| | |',
    '|---|---|',
    ...rows.map(([key, value]) => `| ${key} | ${value} |`),
    '',
    '### Por que isso ajuda quem estuda',
    '',
    `> ${md(contribution.reason)}`,
    '',
    '### Revisão',
    '',
    '- [ ] O link abre e o conteúdo é gratuito',
    '- [ ] Está no assunto e no passo certos',
    '- [ ] O título descreve o conteúdo',
    '',
    '---',
    'Enviado pelo botão "Sugerir conteúdo" da Trilha Info. Depois do merge, o conteúdo aparece na trilha no próximo deploy.',
    '',
    `<!-- contribution-url: ${resource.url} -->`,
  ].join('\n');
}

export async function handleContribution(
  req: Request,
  res: ServerResponse,
  env = process.env,
  hosted = env.VERCEL === '1' || env.VERCEL_ENV === 'production' || env.VERCEL_ENV === 'preview',
) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Use POST.' });
  const requestOrigin = req.headers.origin;
  if (!requestOrigin || !allowedOrigin(req, env, hosted))
    return send(res, 403, { error: 'Origem não permitida.' });

  let input: Record<string, unknown>;
  try {
    const body = await readBody(req);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('invalid body');
    input = body as Record<string, unknown>;
  } catch {
    return send(res, 400, { error: 'Não foi possível ler a sugestão.' });
  }
  if (input.website) return send(res, 202, { ok: true });

  const result = validateDraft(input);
  if (!result.ok)
    return send(res, 422, { error: 'Revise os campos destacados.', errors: result.errors });
  const draft = result.value;

  const ip = clientIP(req);
  if (limited(ip))
    return send(res, 429, {
      error: 'Você já enviou várias sugestões nesta hora. Tente de novo mais tarde.',
    });

  if (env.TURNSTILE_SECRET_KEY) {
    if (
      !(await verifyTurnstile(
        input.turnstileToken,
        ip,
        env.TURNSTILE_SECRET_KEY,
        new URL(requestOrigin).hostname,
      ))
    )
      return send(res, 403, {
        error: 'Não conseguimos confirmar que você não é um robô. Tente de novo.',
      });
  } else if (hosted)
    return send(res, 503, { error: 'O envio de sugestões ainda não está configurado.' });

  const origin = normalizeSiteUrl(env.SITE_URL) || requestOrigin;
  let catalogResponse: globalThis.Response;
  try {
    catalogResponse = await fetch(`${origin}/data/${encodeURIComponent(draft.roadmapId)}.json`);
  } catch {
    return send(res, 502, {
      error: 'Não foi possível carregar os dados da trilha agora. Tente novamente.',
    });
  }
  if (!catalogResponse.ok)
    return send(res, 422, {
      error: 'Trilha não encontrada.',
      errors: { roadmapId: 'Trilha não encontrada.' },
    });
  const catalog = (await catalogResponse.json()) as RoadmapCatalog;
  const conflicts = checkAgainstCatalog(draft, catalog);
  if (Object.keys(conflicts).length)
    return send(res, 422, { error: Object.values(conflicts)[0], errors: conflicts });

  const contribution = contributionFile(draft);
  const path = `src/contributions/entries/${contribution.id}.json`;
  const content = `${JSON.stringify(contribution, null, 2)}\n`;
  const destination = resolveGitHubConfig(env);
  if (destination.status === 'invalid') {
    return send(res, 503, { error: destination.error });
  }
  if (destination.status === 'unconfigured') {
    if (hosted)
      return send(res, 503, { error: 'O envio de sugestões ainda não está configurado.' });
    return send(res, 200, { dryRun: true, path, file: contribution });
  }
  if (hosted && !normalizeSiteUrl(env.SITE_URL)) {
    return send(res, 503, {
      error: 'Origem pública não configurada: defina SITE_URL antes de publicar contribuições.',
    });
  }
  const config = destination.config;

  try {
    const client = await installationClient(config);
    const resource = contributionResource(draft);
    const duplicate = await client.searchOpenPulls(`"contribution-url: ${resource.url}" in:body`);
    if (duplicate.total_count > 0)
      return send(res, 409, {
        error: 'Alguém já sugeriu esse link e a sugestão está em revisão.',
        pull: { number: duplicate.items[0].number, url: duplicate.items[0].html_url },
      });
    const open = await client.searchOpenPulls(`label:"${label}"`);
    if (open.total_count >= maxOpenPulls)
      return send(res, 503, {
        error: 'Há muitas sugestões aguardando revisão. Tente de novo em alguns dias.',
      });

    let coAuthor = '';
    const login = draft.author?.github;
    if (login) {
      const user = await client.findUser(login);
      if (!user)
        return send(res, 422, {
          error: 'Não encontramos esse usuário no GitHub.',
          errors: { 'author.github': 'Não encontramos esse usuário no GitHub.' },
        });
      coAuthor = `\n\nCo-authored-by: ${draft.author?.name || user.name || user.login} <${
        user.id
      }+${user.login}@users.noreply.github.com>`;
    }

    const subject = draft.kind === 'resource' ? resource.title : draft.step.title;
    const groupTitle = catalog.groups[draft.groupId].title;
    const pull = await client.openPull({
      branch: `contribuicao/${contribution.id}`,
      path,
      content,
      message: `content(${draft.roadmapId}): sugere "${subject}" em ${groupTitle}${coAuthor}`,
      title: `${
        draft.kind === 'resource' ? 'Conteúdo' : 'Novo passo'
      } em ${groupTitle}: ${subject}`.slice(0, 200),
      body: pullBody(contribution, catalog, normalizeSiteUrl(env.SITE_URL) || origin, login),
      labels: [label],
    });
    return send(res, 201, { pull: { number: pull.number, url: pull.html_url } });
  } catch (error) {
    console.error('contribution failed', error instanceof GitHubError ? error.message : error);
    return send(res, 502, {
      error: 'O GitHub não respondeu como esperado. Tente de novo em alguns minutos.',
    });
  }
}

export async function handleLinkInfo(req: Request, res: ServerResponse) {
  const url = new URL(req.url || '/', 'http://localhost').searchParams.get('url') || '';
  const id = youtubeId(url);
  if (!id) return send(res, 404, { error: 'Sem informações para esse link.' });
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(
        `https://www.youtube.com/watch?v=${id}`,
      )}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!response.ok) return send(res, 404, { error: 'Vídeo não encontrado.' });
    const data = (await response.json()) as { title?: string; author_name?: string };
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return send(res, 200, {
      kind: 'video',
      title: data.title || '',
      author: data.author_name || '',
    });
  } catch {
    return send(res, 502, { error: 'Não foi possível consultar o vídeo agora.' });
  }
}
