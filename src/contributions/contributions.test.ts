// @vitest-environment node
import { generateKeyPairSync } from 'crypto';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import type { ServerResponse } from 'http';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCatalog } from '../learning/catalog';
import { roadmaps } from '../roadmaps/roadmaps';
import { roadmapGuides } from '../roadmaps/guides';
import { applyContributions, contributionNodeId } from './apply';
import { Contribution } from './types';
import {
  contributionFile,
  normalizeURL,
  validateContribution,
  validateDraft,
  youtubeId,
} from './validate';
import { handleContribution } from '../../server/contributions';

const catalogFor = (id: string, contributions: Contribution[] = []) => {
  const roadmap = roadmaps[id as keyof typeof roadmaps];
  return createCatalog(
    id,
    roadmap.title,
    roadmap.file,
    roadmapGuides[id as keyof typeof roadmapGuides],
    contributions,
  );
};

const roadmapId = Object.keys(roadmaps)[0];
const base = catalogFor(roadmapId);
const [group] = Object.values(base.groups).filter(
  (item) => item.variants.standard.stepIds.length > 0,
);
const nodeId = group.variants.standard.stepIds[0];

const resourceDraft = {
  kind: 'resource',
  roadmapId,
  groupId: group.id,
  nodeId,
  resource: {
    kind: 'video',
    title: 'Aula completa sobre o assunto',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    language: 'pt-BR',
  },
  reason: 'Explica o assunto do zero com exemplos práticos.',
  author: { name: 'Ana', github: '@ana-dev' },
};

const stepDraft = {
  kind: 'step',
  roadmapId,
  groupId: group.id,
  step: {
    title: 'Ferramentas de depuração',
    description: 'Use o DevTools para inspecionar e corrigir problemas reais.',
    resource: {
      kind: 'read',
      title: 'Guia do DevTools',
      url: 'developer.chrome.com/docs/devtools#intro',
      language: 'en',
    },
  },
  reason: 'Depurar é uma habilidade que falta nesse assunto.',
};

describe('validação de sugestões', () => {
  it('aceita e normaliza uma sugestão de conteúdo', () => {
    const result = validateDraft(resourceDraft);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.author).toEqual({ name: 'Ana', github: 'ana-dev' });
  });

  it('normaliza links e recusa os que não são https', () => {
    expect(normalizeURL('developer.chrome.com/docs#x')).toBe('https://developer.chrome.com/docs');
    expect(normalizeURL('http://example.com')).toBeUndefined();
    expect(normalizeURL('javascript:alert(1)')).toBeUndefined();
    expect(normalizeURL('https://user:pass@example.com')).toBeUndefined();
    expect(youtubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(youtubeId('https://example.com/watch?v=dQw4w9WgXcQ')).toBeUndefined();
  });

  it('aponta os campos com problema', () => {
    const result = validateDraft({
      ...stepDraft,
      step: { title: 'x', description: 'curta', resource: { kind: 'blog', url: 'ftp://x' } },
      reason: '',
      author: { github: 'https://github.com/ana' },
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors).sort()).toEqual(
      [
        'author.github',
        'reason',
        'step.description',
        'step.resource.kind',
        'step.resource.title',
        'step.resource.url',
        'step.title',
      ].sort(),
    );
    expect(validateDraft({}).ok).toBe(false);
  });

  it('gera um arquivo válido', () => {
    const result = validateDraft(stepDraft);
    if (!result.ok) throw new Error('rascunho inválido');
    const file = contributionFile(result.value, new Date('2026-10-13T12:00:00Z'));
    expect(file.id).toMatch(/^2026-10-13-ferramentas-de-depuracao-[a-z0-9]+$/);
    expect(validateContribution(file)).toEqual([]);
  });
});

describe('aplicação das sugestões na trilha', () => {
  const file = (draft: unknown, id: string) => {
    const result = validateDraft(draft);
    if (!result.ok) throw new Error('rascunho inválido');
    return { ...contributionFile(result.value), id };
  };

  it('adiciona conteúdo e passo sem mudar o progresso essencial', () => {
    const resource = file(resourceDraft, '2026-10-13-aula-aaaaaa');
    const step = file(stepDraft, '2026-10-13-devtools-bbbbbb');
    const catalog = catalogFor(roadmapId, [resource, step]);
    const target = catalog.groups[group.id];

    expect(target.requiredIds).toEqual(group.requiredIds);
    expect(target.variants.simple.stepIds).toEqual(group.variants.simple.stepIds);

    const added = catalog.resources[`contribution.${resource.id}`];
    expect(added).toMatchObject({ kind: 'Assista', free: true });
    expect(added.contribution).toEqual({ id: resource.id, author: 'Ana', github: 'ana-dev' });
    expect(catalog.nodes[nodeId].resourceIds).toContain(added.id);

    const stepId = contributionNodeId(step);
    expect(target.variants.standard.stepIds.at(-1)).toBe(stepId);
    expect(target.variants.deep.stepIds.at(-1)).toBe(stepId);
    expect(catalog.nodes[stepId].contribution).toEqual({ id: step.id });
    expect(catalog.version).not.toBe(base.version);
  });

  it('ignora sugestões de assuntos que não existem e links repetidos', () => {
    const catalog = catalogFor(roadmapId);
    const existing = catalog.resources[catalog.nodes[nodeId].resourceIds[0]];
    const before = JSON.stringify(catalog);
    applyContributions(catalog, [
      file({ ...stepDraft, groupId: 'nao.existe' }, '2026-10-13-x-cccccc'),
      file(
        { ...resourceDraft, resource: { ...resourceDraft.resource, url: existing.url } },
        '2026-10-13-y-dddddd',
      ),
    ]);
    expect(JSON.stringify(catalog)).toBe(before);
  });
});

describe('sugestões aprovadas', () => {
  const dir = join(__dirname, 'entries');
  const entries = readdirSync(dir).filter((name) => name.endsWith('.json'));
  const catalogs = Object.keys(roadmaps).map((id) => catalogFor(id));

  it('têm formato válido e apontam para assuntos e passos existentes', () => {
    const problems: string[] = [];
    for (const name of entries) {
      const entry = JSON.parse(readFileSync(join(dir, name), 'utf8')) as Contribution;
      problems.push(...validateContribution(entry).map((problem) => `${name}: ${problem}`));
      if (`${entry.id}.json` !== name) problems.push(`${name}: o nome deve ser ${entry.id}.json`);
      const owner = catalogs.find((catalog) => catalog.groups[entry.groupId]);
      if (!owner) problems.push(`${name}: assunto ${entry.groupId} não existe`);
      else if (entry.kind === 'resource' && owner.nodes[entry.nodeId]?.groupId !== entry.groupId)
        problems.push(`${name}: passo ${entry.nodeId} não existe em ${entry.groupId}`);
    }
    expect(problems).toEqual([]);
  });
});

describe('endpoint de sugestões', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  type ResponseBody = {
    dryRun?: boolean;
    path?: string;
    file?: unknown;
    errors?: Record<string, string>;
  };
  let ip = 0;
  async function post(body: unknown, headers: Record<string, string> = {}, env = {}) {
    ip += 1;
    const req = {
      method: 'POST',
      headers: {
        'x-forwarded-for': `192.0.2.${ip}`,
        host: 'localhost:5199',
        origin: 'http://localhost:5199',
        ...headers,
      },
      body,
      socket: { remoteAddress: '127.0.0.1' },
    };
    const headers_: Record<string, string> = {};
    let body_: ResponseBody = {};
    const res = {
      statusCode: 0,
      setHeader: (key: string, value: string) => (headers_[key] = value),
      getHeader: (key: string) => headers_[key],
      end: (raw: string) => (body_ = JSON.parse(raw)),
    };
    await handleContribution(
      req as never,
      res as unknown as ServerResponse,
      env as NodeJS.ProcessEnv,
    );
    const response = { status: res.statusCode, headers: headers_, body: body_ };
    return response;
  }

  it('responde em modo de teste quando o GitHub não está configurado', async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify(base)));
    vi.stubGlobal('fetch', fetch);
    const response = await post(resourceDraft);
    expect(response.status).toBe(200);
    expect(response.body.dryRun).toBe(true);
    expect(response.body.path).toMatch(/^src\/contributions\/entries\/.+\.json$/);
    expect(validateContribution(response.body.file)).toEqual([]);
    expect(fetch).toHaveBeenCalledWith(`http://localhost:5199/data/${roadmapId}.json`);
  });

  it('recusa links que já estão na trilha', async () => {
    const existing = base.resources[base.nodes[nodeId].resourceIds[0]];
    vi.stubGlobal('fetch', async () => new Response(JSON.stringify(base)));
    const response = await post({
      ...resourceDraft,
      resource: { ...resourceDraft.resource, url: existing.url },
    });
    expect(response.status).toBe(422);
    expect(response.body.errors?.['resource.url']).toBeTruthy();
  });

  it('bloqueia origem estranha, robôs e campos inválidos', async () => {
    expect((await post(resourceDraft, { origin: 'https://evil.example' })).status).toBe(403);
    expect((await post({ ...resourceDraft, website: 'spam' })).status).toBe(202);
    const invalid = await post({ ...resourceDraft, reason: 'curto' });
    expect(invalid.status).toBe(422);
    expect(invalid.body.errors?.reason).toBeTruthy();
  });

  it('não envia nada em produção sem captcha configurado', async () => {
    const response = await post(
      resourceDraft,
      { host: 'trilha-mod.vercel.app', origin: 'https://trilha-mod.vercel.app' },
      { VERCEL_ENV: 'production' },
    );
    expect(response.status).toBe(503);
  });

  it('exige captcha em preview e valida a origem, o domínio e a ação antes de consultar a trilha', async () => {
    const host = 'preview-exemplo.vercel.app';
    const headers = { host, origin: `https://${host}` };
    const env = { VERCEL_ENV: 'preview', VERCEL_URL: host };
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    expect((await post(resourceDraft, headers, env)).status).toBe(503);
    for (const origin of ['', 'https://outro.vercel.app', `http://${host}`]) {
      expect((await post(resourceDraft, { ...headers, origin }, env)).status).toBe(403);
    }
    expect(fetch).not.toHaveBeenCalled();
    for (const [hostname, action] of [
      [host, 'lesson_tutor'],
      ['outro.vercel.app', 'contribution'],
    ]) {
      fetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, hostname, action })),
      );
      expect(
        (
          await post({ ...resourceDraft, turnstileToken: 'teste' }, headers, {
            ...env,
            TURNSTILE_SECRET_KEY: 'teste',
          })
        ).status,
      ).toBe(403);
    }
    expect(fetch).toHaveBeenCalledTimes(2);
    fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, hostname: host, action: 'contribution' })),
    );
    fetch.mockResolvedValueOnce(new Response(null, { status: 404 }));
    expect(
      (
        await post({ ...resourceDraft, turnstileToken: 'teste' }, headers, {
          ...env,
          TURNSTILE_SECRET_KEY: 'teste',
        })
      ).status,
    ).toBe(422);
    expect(fetch).toHaveBeenLastCalledWith(`https://${host}/data/${roadmapId}.json`);
  });

  it('recusa corpos inválidos ou grandes antes de processar sugestões', async () => {
    for (const body of [null, [], { reason: 'á'.repeat(9000) }]) {
      expect((await post(body)).status).toBe(400);
    }
  });

  it('usa origem, repositório e branch do fork para tópico exclusivo e bloqueia escrita sem destino confiável (Item 11)', async () => {
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const pem = privateKey.export({ type: 'pkcs1', format: 'pem' }).toString();

    const forkCatalog = {
      ...base,
      groups: {
        ...base.groups,
        'fork.percurso-web': {
          ...group,
          id: 'fork.percurso-web',
          title: 'Percurso exclusivo do fork',
          variants: {
            simple: { summary: 'Resumo', stepIds: ['fork.step-1'] },
            standard: { summary: 'Resumo', stepIds: ['fork.step-1'] },
            deep: { summary: 'Resumo', stepIds: ['fork.step-1'] },
          },
        },
      },
      nodes: {
        ...base.nodes,
        'fork.step-1': {
          ...base.nodes[nodeId],
          id: 'fork.step-1',
          groupId: 'fork.percurso-web',
          title: 'Etapa exclusiva do fork',
        },
      },
    };

    const forkDraft = {
      ...resourceDraft,
      groupId: 'fork.percurso-web',
      nodeId: 'fork.step-1',
      author: { name: 'Ana' },
    };

    // 1. Sem CONTRIBUTIONS_REPOSITORY ou CONTRIBUTIONS_BASE_BRANCH -> recusa com 503 e 0 chamadas ao GitHub
    const incompleteCalls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL) => {
        const url = String(input);
        incompleteCalls.push(url);
        if (url === `https://trilha-mod.vercel.app/data/${roadmapId}.json`) {
          return new Response(JSON.stringify(forkCatalog));
        }
        throw new Error(`Chamada inesperada: ${url}`);
      }),
    );

    const missingRepoRes = await post(
      forkDraft,
      {},
      {
        SITE_URL: 'https://trilha-mod.vercel.app',
        GITHUB_APP_ID: '12345',
        GITHUB_APP_PRIVATE_KEY: pem,
      },
    );
    expect(missingRepoRes.status).toBe(503);
    expect((missingRepoRes.body as { error?: string }).error).toMatch(/CONTRIBUTIONS_REPOSITORY/);
    expect(incompleteCalls.some((url) => url.includes('api.github.com'))).toBe(false);
    expect(incompleteCalls.some((url) => url.includes('flaviojmendes/trilhainfo'))).toBe(false);

    // 2. Com configuração completa do fork -> consulta catálogo na origem do fork e abre PR no repositório/branch configurados
    const githubCalls: Array<{ url: string; method: string; body?: string }> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method || 'GET';
        const body = typeof init?.body === 'string' ? init.body : undefined;
        githubCalls.push({ url, method, body });

        if (url === `https://trilha-mod.vercel.app/data/${roadmapId}.json`) {
          return new Response(JSON.stringify(forkCatalog));
        }
        if (url === 'https://api.github.com/repos/nyx43/trilha-mod/installation') {
          return new Response(JSON.stringify({ id: 99 }));
        }
        if (url === 'https://api.github.com/app/installations/99/access_tokens') {
          return new Response(JSON.stringify({ token: 'ghs_test_token' }));
        }
        if (url.startsWith('https://api.github.com/search/issues?')) {
          return new Response(JSON.stringify({ total_count: 0, items: [] }));
        }
        if (
          url ===
          'https://api.github.com/repos/nyx43/trilha-mod/git/ref/heads/feat%2Fpercurso-api-tailwind'
        ) {
          return new Response(JSON.stringify({ object: { sha: 'abc123' } }));
        }
        if (url === 'https://api.github.com/repos/nyx43/trilha-mod/git/refs') {
          return new Response(JSON.stringify({}), { status: 201 });
        }
        if (url.startsWith('https://api.github.com/repos/nyx43/trilha-mod/contents/')) {
          return new Response(JSON.stringify({}), { status: 201 });
        }
        if (url === 'https://api.github.com/repos/nyx43/trilha-mod/pulls') {
          return new Response(
            JSON.stringify({ number: 7, html_url: 'https://github.com/nyx43/trilha-mod/pull/7' }),
            { status: 201 },
          );
        }
        if (url === 'https://api.github.com/repos/nyx43/trilha-mod/issues/7/labels') {
          return new Response(JSON.stringify([]), { status: 200 });
        }
        throw new Error(`URL inesperada: ${url}`);
      }),
    );

    const okRes = await post(
      forkDraft,
      {},
      {
        SITE_URL: 'https://trilha-mod.vercel.app',
        GITHUB_APP_ID: '12345',
        GITHUB_APP_PRIVATE_KEY: pem,
        CONTRIBUTIONS_REPOSITORY: 'nyx43/trilha-mod',
        CONTRIBUTIONS_BASE_BRANCH: 'feat/percurso-api-tailwind',
      },
    );

    expect(okRes.status).toBe(201);
    const prCall = githubCalls.find((call) => call.url.endsWith('/repos/nyx43/trilha-mod/pulls'));
    expect(prCall).toBeDefined();
    const prBody = JSON.parse(prCall?.body || '{}') as { base?: string; body?: string };
    expect(prBody.base).toBe('feat/percurso-api-tailwind');
    expect(prBody.body).toContain(`https://trilha-mod.vercel.app/roadmap/${roadmapId}`);
    expect(JSON.stringify(githubCalls)).not.toContain('flaviojmendes/trilhainfo');
    expect(JSON.stringify(githubCalls)).not.toContain('https://trilha.info');
  });
});
