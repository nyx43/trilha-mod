import type { IncomingMessage, ServerResponse } from 'http';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleFeedback } from './feedback';

function mockReqRes(method: string, body?: unknown) {
  const req = { method, body } as unknown as IncomingMessage;
  let statusCode = 200;
  let rawBody = '';
  const headers: Record<string, string> = {};
  const res = {
    set statusCode(code: number) {
      statusCode = code;
    },
    get statusCode() {
      return statusCode;
    },
    setHeader(name: string, value: string) {
      headers[name.toLowerCase()] = value;
    },
    end(chunk?: string) {
      rawBody = chunk || '';
    },
  } as unknown as ServerResponse;
  return {
    req,
    res,
    result: () => ({ status: statusCode, headers, body: rawBody ? JSON.parse(rawBody) : null }),
  };
}

describe('Endpoint /api/feedback (GitHub Issues + triagem para agentes)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejeita relato incompleto com 422', async () => {
    const { req, res, result } = mockReqRes('POST', { category: 'bug', title: 'oi', description: 'a' });
    await handleFeedback(req, res, {});
    expect(result().status).toBe(422);
  });

  it('retorna prefilledUrl estruturado para nyx43/trilha-mod quando sem credenciais no servidor', async () => {
    const { req, res, result } = mockReqRes('POST', {
      id: 'fb-1',
      category: 'melhoria',
      rating: 4,
      title: 'Adicionar mais exemplos de JOIN',
      description: 'Um segundo exemplo com LEFT JOIN ajudaria muito.',
      context: {
        route: '/aula/sql-consultas',
        lessonId: 'sql-consultas',
        lessonTitle: 'SQL: consultas',
        platform: 'web',
        contentVersion: '2026-11-23.test',
      },
    });
    await handleFeedback(req, res, {});
    const out = result();
    expect(out.status).toBe(200);
    expect(out.body.mode).toBe('manual');
    expect(out.body.prefilledUrl).toContain('https://github.com/nyx43/trilha-mod/issues/new?');
    expect(out.body.issue.labels).toContain('triage-agente');
    expect(out.body.issue.body).toContain('trilha-feedback-v1');
  });

  it('cria Issue diretamente no GitHub quando GITHUB_FEEDBACK_TOKEN está configurado', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({ number: 77, html_url: 'https://github.com/nyx43/trilha-mod/issues/77' }),
        { status: 201 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const { req, res, result } = mockReqRes('POST', {
      id: 'fb-2',
      category: 'bug',
      title: 'Erro no quiz 3',
      description: 'A opção B marca erro mesmo correta.',
      context: {
        route: '/aula/git-do-zero',
        lessonId: 'git-do-zero',
        lessonTitle: 'Git do zero',
        platform: 'web',
        contentVersion: '2026-11-23.test',
      },
    });

    await handleFeedback(req, res, {
      GITHUB_FEEDBACK_TOKEN: 'ghp_test_token',
      CONTRIBUTIONS_REPOSITORY: 'nyx43/trilha-mod',
    });

    const out = result();
    expect(out.status).toBe(201);
    expect(out.body.issue).toEqual({
      number: 77,
      url: 'https://github.com/nyx43/trilha-mod/issues/77',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/repos/nyx43/trilha-mod/issues',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
