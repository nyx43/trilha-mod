import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LessonSection } from '../lessons/types';
import { LessonTutor } from './LessonTutor';
import { tutorPath, TutorRequest } from './types';

const section: LessonSection = {
  id: 'cors',
  title: 'Uma API em outra origem',
  blocks: [
    { type: 'text', text: 'A porta faz parte da origem.' },
    {
      type: 'quiz',
      question: 'Qual configuração libera esta origem?',
      options: [{ text: 'gabarito-interno', feedback: 'explicação-interna', correct: true }],
    },
  ],
};

function renderTutor() {
  render(
    <LessonTutor
      title="Integração com a API"
      summary="Estude requisições no navegador."
      hook="O navegador conversa com outro programa."
      sections={[section]}
      suggestedSection={section.id}
    />,
  );
  const button = screen.getByRole('button', { name: 'Tutor da aula' });
  fireEvent.click(button);
  return button;
}

function response(body: object) {
  return { ok: true, json: async () => body };
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Tutor da aula', () => {
  it('mostra o aviso se não houver provedor e devolve o foco ao botão ao fechar', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ enabled: false }));
    vi.stubGlobal('fetch', fetchMock);
    const button = renderTutor();

    await screen.findByText(/indisponível neste ambiente/);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(screen.getByRole('heading', { name: 'Tutor da aula' }), { key: 'Escape' });
    expect(button).toHaveFocus();
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('envia a dúvida com a seção e usa o histórico para pedir um exercício sem expor o gabarito', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response({ enabled: true }))
      .mockResolvedValueOnce(response({ reply: 'Que origem o navegador mostra na requisição?' }))
      .mockResolvedValueOnce(response({ reply: '**Exercício:** compare duas origens.' }));
    vi.stubGlobal('fetch', fetchMock);
    renderTutor();

    const input = await screen.findByRole('textbox', { name: 'Sua dúvida' });
    expect(screen.getByRole('combobox', { name: 'Seção' })).toHaveValue('cors');
    fireEvent.change(input, { target: { value: 'Por que mudar de porta muda a origem?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    const log = screen.getByRole('log', { name: 'Conversa' });
    await within(log).findByText('Que origem o navegador mostra na requisição?');
    expect(fetchMock.mock.calls[1][0]).toBe(tutorPath);
    const question: TutorRequest = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(question.context).toContain('A porta faz parte da origem.');
    expect(question.context).toContain('Qual configuração libera esta origem?');
    expect(question.context).not.toMatch(/gabarito-interno|explicação-interna/);
    expect(question.messages).toEqual([
      { role: 'user', content: 'Por que mudar de porta muda a origem?' },
    ]);

    fireEvent.click(screen.getByRole('button', { name: 'Pedir exercício' }));
    await within(log).findByText('Exercício:');
    const exercise: TutorRequest = JSON.parse(fetchMock.mock.calls[2][1].body);
    expect(exercise.messages).toEqual([
      question.messages[0],
      { role: 'assistant', content: 'Que origem o navegador mostra na requisição?' },
      { role: 'user', content: expect.stringContaining('Crie um exercício curto') },
    ]);
  });

  it('indica o destino e começa uma conversa nova quando o aluno troca de provedor', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        response({
          enabled: true,
          providers: [
            { id: 'gemini', label: 'Gemini' },
            { id: 'groq', label: 'Groq' },
          ],
        }),
      )
      .mockResolvedValueOnce(response({ reply: 'Qual é a URL do seu frontend?' }))
      .mockResolvedValueOnce(response({ reply: 'Compare os domínios primeiro.' }));
    vi.stubGlobal('fetch', fetchMock);
    renderTutor();
    fireEvent.click(screen.getByRole('button', { name: 'Configurações do tutor' }));

    const provider = await screen.findByRole('combobox', { name: 'Provedor de IA' });
    const input = screen.getByRole('textbox', { name: 'Sua dúvida' });
    const send = screen.getByRole('button', { name: 'Enviar' });
    expect(provider).toHaveValue('gemini');
    expect(input).toHaveAccessibleDescription(/Gemini recebe/);
    fireEvent.change(input, { target: { value: 'Por que minha requisição foi bloqueada?' } });
    fireEvent.click(send);
    await screen.findByText('Qual é a URL do seu frontend?');

    fireEvent.change(input, { target: { value: 'Como comparar origens?' } });
    fireEvent.change(provider, { target: { value: 'groq' } });
    expect(screen.queryByText('Qual é a URL do seu frontend?')).not.toBeInTheDocument();
    expect(input).toHaveValue('Como comparar origens?');
    expect(input).toHaveAccessibleDescription(/Groq recebe/);
    fireEvent.click(send);
    await screen.findByText('Compare os domínios primeiro.');

    const first: TutorRequest = JSON.parse(fetchMock.mock.calls[1][1].body);
    const second: TutorRequest = JSON.parse(fetchMock.mock.calls[2][1].body);
    expect(first.provider).toBe('gemini');
    expect(second.provider).toBe('groq');
    expect(second.context).toBe(first.context);
    expect(second.messages).toEqual([{ role: 'user', content: 'Como comparar origens?' }]);
  });

  it('troca o modelo no mesmo provedor e exibe uma tabela na resposta', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        response({
          enabled: true,
          providers: [
            {
              id: 'groq',
              label: 'Groq',
              defaultModel: 'qwen/qwen3.8-27b',
              models: [
                { id: 'qwen/qwen3.8-27b', label: 'Qwen 3.8 27B' },
                { id: 'openai/gpt-oss-20b', label: 'GPT-OSS 20B' },
              ],
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        response({ reply: '| Origem | Porta |\n| --- | --- |\n| API | 3000 |' }),
      );
    vi.stubGlobal('fetch', fetchMock);
    renderTutor();
    fireEvent.click(screen.getByRole('button', { name: 'Configurações do tutor' }));
    const model = await screen.findByRole('combobox', { name: 'Modelo de IA' });
    expect(model).toHaveValue('qwen/qwen3.8-27b');
    fireEvent.change(model, { target: { value: 'openai/gpt-oss-20b' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Sua dúvida' }), {
      target: { value: 'Monte uma tabela com exemplos.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    const table = await screen.findByRole('table');
    expect(within(table).getByRole('columnheader', { name: 'Porta' })).toBeInTheDocument();
    expect(within(table).getByRole('cell', { name: '3000' })).toBeInTheDocument();
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toMatchObject({
      provider: 'groq',
      model: 'openai/gpt-oss-20b',
    });
  });

  it('envia o token do tutor hospedado e renova a verificação após a resposta', async () => {
    const renderWidget = vi.fn(() => 'widget');
    vi.stubGlobal('turnstile', { render: renderWidget, remove: vi.fn() });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response({ enabled: true, turnstileSiteKey: 'publica' }))
      .mockResolvedValueOnce(response({ reply: 'Compare as duas origens.' }));
    vi.stubGlobal('fetch', fetchMock);
    renderTutor();
    const input = await screen.findByRole('textbox', { name: 'Sua dúvida' });
    fireEvent.change(input, { target: { value: 'Como identifico a origem?' } });
    const send = screen.getByRole('button', { name: 'Enviar' });
    expect(send).toBeDisabled();
    const script = document.querySelector('script[src*="challenges.cloudflare.com"]');
    if (!script) throw new Error('Script de verificação ausente');
    fireEvent.load(script);
    await waitFor(() => expect(renderWidget).toHaveBeenCalled());
    const options = renderWidget.mock.calls[0] as unknown as [
      HTMLElement,
      {
        action: string;
        callback: (token: string) => void;
      },
    ];
    expect(options[1].action).toBe('lesson_tutor');
    act(() => options[1].callback('token-hosted'));
    fireEvent.click(send);
    await screen.findByText('Compare as duas origens.');
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).turnstileToken).toBe('token-hosted');
    expect(send).toBeDisabled();
    expect(renderWidget).toHaveBeenCalledTimes(2);
  });

  it('envia dúvida com Ctrl+Enter e permite iniciar uma nova conversa', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response({ enabled: true }))
      .mockResolvedValueOnce(response({ reply: 'Primeira resposta do tutor.' }));
    vi.stubGlobal('fetch', fetchMock);
    renderTutor();

    const input = await screen.findByRole('textbox', { name: 'Sua dúvida' });
    fireEvent.change(input, { target: { value: 'Dúvida com atalho' } });
    fireEvent.keyDown(input, { key: 'Enter', ctrlKey: true });

    const log = screen.getByRole('log', { name: 'Conversa' });
    await within(log).findByText('Primeira resposta do tutor.');

    const resetBtn = screen.getByRole('button', { name: 'Nova conversa' });
    fireEvent.click(resetBtn);
    expect(within(log).queryByText('Primeira resposta do tutor.')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Nova conversa' })).not.toBeInTheDocument();
  });
});
