// @vitest-environment node

import type { IncomingMessage, ServerResponse } from 'node:http';
import { Readable } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TutorRequest } from '../src/tutor/types';
import { handleLessonTutor } from './lessonTutor';

const question: TutorRequest = {
  context: 'Aula sobre CORS',
  messages: [{ role: 'user', content: 'Por que o navegador bloqueia minha requisição?' }],
};
const upstreamSuccess = () =>
  Response.json({ choices: [{ message: { content: 'Qual é a origem do frontend?' } }] });

async function callTutor(method: string, body?: TutorRequest, origin = 'http://127.0.0.1:5173') {
  const req = Object.assign(Readable.from(body ? [JSON.stringify(body)] : []), {
    method,
    socket: { remoteAddress: '127.0.0.1' },
    headers: { host: '127.0.0.1:5173', origin, 'content-type': 'application/json' },
  });
  const writeHead = vi.fn();
  const end = vi.fn();
  await handleLessonTutor(
    req as unknown as IncomingMessage,
    { writeHead, end } as unknown as ServerResponse,
  );
  return { status: writeHead.mock.calls[0][0], body: JSON.parse(end.mock.calls[0][0]) };
}

beforeEach(() => {
  for (const key of [
    'TUTOR_API_URL',
    'TUTOR_MODEL',
    'TUTOR_API_KEY',
    'TUTOR_GEMINI_API_KEY',
    'TUTOR_GEMINI_MODEL',
    'TUTOR_GROQ_API_KEY',
    'TUTOR_GROQ_MODEL',
  ]) {
    vi.stubEnv(key, '');
  }
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('Provedores do tutor', () => {
  it('lista apenas provedores ativos e só publica nomes e IDs em origem local', async () => {
    expect(await callTutor('GET')).toEqual({
      status: 200,
      body: { enabled: false, providers: [] },
    });
    vi.stubEnv('TUTOR_GEMINI_API_KEY', 'chave-gemini-de-teste');
    vi.stubEnv('TUTOR_GROQ_API_KEY', 'chave-groq-de-teste');
    expect(await callTutor('GET')).toEqual({
      status: 200,
      body: {
        enabled: true,
        providers: [
          {
            id: 'gemini',
            label: 'Google Gemini',
            defaultModel: 'gemini-4-hydrogen',
            models: expect.arrayContaining([
              { id: 'gemini-4-hydrogen', label: 'Gemini 4 Hydrogen' },
            ]),
          },
          {
            id: 'groq',
            label: 'Groq',
            defaultModel: 'openai/gpt-oss-120b',
            models: expect.arrayContaining([{ id: 'qwen/qwen3.8-27b', label: 'Qwen 3.8 27B' }]),
          },
        ],
      },
    });
    expect(await callTutor('GET', undefined, 'https://outra-origem.example')).toEqual({
      status: 200,
      body: { enabled: false, providers: [] },
    });
  });

  it.each([
    [
      'gemini',
      'gemini-4-hydrogen',
      'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    ],
    ['groq', 'openai/gpt-oss-120b', 'https://api.groq.com/openai/v1/chat/completions'],
  ])(
    'envia a pergunta a %s com o modelo e a chave correspondentes',
    async (provider, model, url) => {
      vi.stubEnv('TUTOR_GEMINI_API_KEY', 'chave-gemini-de-teste');
      vi.stubEnv('TUTOR_GROQ_API_KEY', 'chave-groq-de-teste');
      const upstream = vi.fn().mockResolvedValue(upstreamSuccess());
      vi.stubGlobal('fetch', upstream);

      expect(await callTutor('POST', { ...question, provider })).toEqual({
        status: 200,
        body: { reply: 'Qual é a origem do frontend?' },
      });
      expect(upstream).toHaveBeenCalledTimes(1);
      const [target, request] = upstream.mock.calls[0];
      expect(target.href).toBe(url);
      expect(request.headers.get('Authorization')).toBe(`Bearer chave-${provider}-de-teste`);
      const sent = JSON.parse(request.body);
      expect(sent.model).toBe(model);
      expect(sent.messages[0]).toMatchObject({
        role: 'system',
        content: expect.stringContaining('não entregue a resposta'),
      });
      expect(JSON.parse(sent.messages[1].content)).toEqual({
        contextoDaAula: question.context,
        mensagemDoAluno: question.messages[0].content,
      });
    },
  );

  it('usa o modelo escolhido e recusa modelos fora da lista do provedor', async () => {
    vi.stubEnv('TUTOR_GROQ_API_KEY', 'chave-groq-de-teste');
    const upstream = vi.fn().mockResolvedValue(upstreamSuccess());
    vi.stubGlobal('fetch', upstream);
    expect(
      (await callTutor('POST', { ...question, provider: 'groq', model: 'gemini-4-hydrogen' }))
        .status,
    ).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
    expect(
      (await callTutor('POST', { ...question, provider: 'groq', model: 'qwen/qwen3.8-27b' }))
        .status,
    ).toBe(200);
    const sent = JSON.parse(upstream.mock.calls[0][1].body);
    expect(sent.model).toBe('qwen/qwen3.8-27b');
    expect(sent).not.toHaveProperty('include_reasoning');
  });

  it('informa que a cota acabou e mantém a conversa no provedor escolhido', async () => {
    vi.stubEnv('TUTOR_GEMINI_API_KEY', 'chave-gemini-de-teste');
    vi.stubEnv('TUTOR_GROQ_API_KEY', 'chave-groq-de-teste');
    const upstream = vi
      .fn()
      .mockResolvedValue(Response.json({ error: 'upstream' }, { status: 429 }));
    vi.stubGlobal('fetch', upstream);

    const response = await callTutor('POST', { ...question, provider: 'groq' });
    expect(response.status).toBe(429);
    expect(response.body.error).toContain('O limite de uso de Groq foi atingido');
    expect(upstream).toHaveBeenCalledTimes(1);
  });

  it('preserva a API personalizada como padrão se já estiver configurada', async () => {
    vi.stubEnv('TUTOR_API_URL', 'http://127.0.0.1:9999/v1/chat/completions');
    vi.stubEnv('TUTOR_MODEL', 'modelo-local');
    vi.stubEnv('TUTOR_GEMINI_API_KEY', 'chave-gemini-de-teste');
    const upstream = vi.fn().mockResolvedValue(upstreamSuccess());
    vi.stubGlobal('fetch', upstream);

    expect((await callTutor('POST', { ...question, provider: 'groq' })).status).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
    expect((await callTutor('POST', question)).status).toBe(200);
    const [target, request] = upstream.mock.calls[0];
    expect(target.href).toBe('http://127.0.0.1:9999/v1/chat/completions');
    expect(JSON.parse(request.body).model).toBe('modelo-local');
    expect(request.headers.has('Authorization')).toBe(false);
  });
});
