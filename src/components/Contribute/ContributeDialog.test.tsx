import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { createCatalog } from '../../learning/catalog';
import { roadmaps } from '../../roadmaps/roadmaps';
import { roadmapGuides } from '../../roadmaps/guides';
import { ContributeDialog } from './ContributeDialog';

const roadmapId = Object.keys(roadmaps)[0] as keyof typeof roadmaps;
const catalog = createCatalog(
  roadmapId,
  roadmaps[roadmapId].title,
  roadmaps[roadmapId].file,
  roadmapGuides[roadmapId as keyof typeof roadmapGuides],
);
const [group] = Object.values(catalog.groups).filter(
  (item) => item.variants.standard.stepIds.length > 0,
);

function open() {
  render(<ContributeDialog catalog={catalog} group={group} />);
  fireEvent.click(screen.getByRole('button', { name: 'Sugerir conteúdo' }));
}

describe('Sugerir conteúdo', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mostra os erros e leva o foco ao primeiro campo', async () => {
    open();
    fireEvent.click(screen.getByRole('radio', { name: /Documentação ou artigo/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Enviar sugestão' }));
    expect(screen.getByRole('alert').textContent).toMatch(/Revise \d+ campos/);
    expect(document.activeElement).toBe(screen.getByLabelText('Link'));
    expect(screen.getByLabelText('Link').getAttribute('aria-invalid')).toBe('true');
    fireEvent.change(screen.getByLabelText('Link'), {
      target: { value: 'https://developer.mozilla.org/pt-BR/docs/Web/HTTP' },
    });
    expect(screen.getByLabelText('Link').getAttribute('aria-invalid')).toBe('false');
  });

  it('envia a sugestão e mostra o resultado', async () => {
    const fetch = vi.fn<[string, RequestInit?], Promise<Response>>(
      async () =>
        new Response(
          JSON.stringify({ pull: { number: 42, url: 'https://github.com/x/y/pull/42' } }),
          { status: 201 },
        ),
    );
    vi.stubGlobal('fetch', fetch);
    open();
    fireEvent.click(screen.getByRole('radio', { name: /Um passo novo/ }));
    fireEvent.change(screen.getByLabelText('Nome do passo'), {
      target: { value: 'Ferramentas de depuração' },
    });
    fireEvent.change(screen.getByLabelText('O que estudar neste passo'), {
      target: { value: 'Use o DevTools para inspecionar e corrigir problemas reais.' },
    });
    fireEvent.change(screen.getByLabelText('Link'), {
      target: { value: 'https://developer.chrome.com/docs/devtools' },
    });
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Guia do DevTools' } });
    fireEvent.click(screen.getByLabelText(/gratuito/));
    fireEvent.change(screen.getByLabelText('Por que isso ajuda quem estuda?'), {
      target: { value: 'Depurar é uma habilidade que falta nesse assunto.' },
    });
    expect(screen.getByText('Novo passo: Ferramentas de depuração')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Enviar sugestão' }));

    await waitFor(() => expect(screen.getByText('Sugestão enviada')).toBeTruthy());
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('/api/contributions');
    expect(JSON.parse(String(init?.body))).toMatchObject({
      kind: 'step',
      roadmapId,
      groupId: group.id,
      step: { title: 'Ferramentas de depuração', resource: { kind: 'read', language: 'pt-BR' } },
    });
    expect(screen.getByRole('link', { name: /Acompanhar no GitHub/ }).getAttribute('href')).toBe(
      'https://github.com/x/y/pull/42',
    );
  });

  it('renova o Turnstile após erro 422 de duplicata, preserva campos, foca o erro e reenvia com novo token (Item 10)', async () => {
    let widgetSeq = 0;
    const removedWidgets: string[] = [];
    window.turnstile = {
      render: (_element, options) => {
        widgetSeq += 1;
        const id = `widget-${widgetSeq}`;
        const onVerify = options.callback as ((token: string) => void) | undefined;
        queueMicrotask(() => onVerify?.(`turnstile-token-${widgetSeq}`));
        return id;
      },
      remove: (id) => {
        removedWidgets.push(id);
      },
    };

    const fetchMock = vi
      .fn<[string, RequestInit?], Promise<Response>>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: 'Esse link já está na trilha.',
            errors: { 'resource.url': 'Esse link já está na trilha.' },
          }),
          { status: 422 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            pull: { number: 55, url: 'https://github.com/nyx43/trilha-mod/pull/55' },
          }),
          { status: 201 },
        ),
      );
    vi.stubGlobal('fetch', fetchMock);

    try {
      render(<ContributeDialog catalog={catalog} group={group} turnstileSiteKey="site-key-test" />);
      fireEvent.click(screen.getByRole('button', { name: 'Sugerir conteúdo' }));
      fireEvent.click(screen.getByRole('radio', { name: /Documentação ou artigo/ }));
      fireEvent.change(screen.getByLabelText('Link'), {
        target: { value: 'https://developer.mozilla.org/pt-BR/docs/Web/HTTP' },
      });
      fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Guia HTTP MDN' } });
      fireEvent.click(screen.getByLabelText(/gratuito/));
      fireEvent.change(screen.getByLabelText('Por que isso ajuda quem estuda?'), {
        target: { value: 'Referência completa e clara sobre HTTP.' },
      });

      const turnstileScript = document.querySelector('script[src*="challenges.cloudflare.com"]');
      if (turnstileScript) fireEvent.load(turnstileScript);
      await waitFor(() => expect(widgetSeq).toBe(1));
      fireEvent.click(screen.getByRole('button', { name: 'Enviar sugestão' }));

      // 422 devolvido -> mantém campos, foca o campo Link e renova o Turnstile
      await waitFor(() =>
        expect(screen.getByText('Esse link já está na trilha.')).toBeInTheDocument(),
      );
      expect(document.activeElement).toBe(screen.getByLabelText('Link'));
      expect(screen.getByLabelText('Título')).toHaveValue('Guia HTTP MDN');
      expect(screen.getByLabelText('Por que isso ajuda quem estuda?')).toHaveValue(
        'Referência completa e clara sobre HTTP.',
      );
      await waitFor(() => expect(widgetSeq).toBe(2));
      expect(removedWidgets).toContain('widget-1');

      // Corrige o link e reenvia -> usa o segundo token e chega à confirmação
      fireEvent.change(screen.getByLabelText('Link'), {
        target: { value: 'https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Overview' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Enviar sugestão' }));

      await waitFor(() => expect(screen.getByText('Sugestão enviada')).toBeInTheDocument());
      const firstBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
      const secondBody = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
      expect(firstBody.turnstileToken).toBe('turnstile-token-1');
      expect(secondBody.turnstileToken).toBe('turnstile-token-2');
      expect(secondBody.turnstileToken).not.toBe(firstBody.turnstileToken);
    } finally {
      delete window.turnstile;
    }
  });

  it('renova o Turnstile e permite reenvio após falha de rede (Item 10)', async () => {
    let widgetSeq = 0;
    window.turnstile = {
      render: (_element, options) => {
        widgetSeq += 1;
        const onVerify = options.callback as ((token: string) => void) | undefined;
        queueMicrotask(() => onVerify?.(`net-token-${widgetSeq}`));
        return `net-widget-${widgetSeq}`;
      },
      remove: vi.fn(),
    };

    const fetchMock = vi
      .fn<[string, RequestInit?], Promise<Response>>()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            pull: { number: 88, url: 'https://github.com/nyx43/trilha-mod/pull/88' },
          }),
          { status: 201 },
        ),
      );
    vi.stubGlobal('fetch', fetchMock);

    try {
      render(<ContributeDialog catalog={catalog} group={group} turnstileSiteKey="site-key-test" />);
      fireEvent.click(screen.getByRole('button', { name: 'Sugerir conteúdo' }));
      fireEvent.click(screen.getByRole('radio', { name: /Documentação ou artigo/ }));
      fireEvent.change(screen.getByLabelText('Link'), {
        target: { value: 'https://web.dev/learn/css' },
      });
      fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Learn CSS' } });
      fireEvent.click(screen.getByLabelText(/gratuito/));
      fireEvent.change(screen.getByLabelText('Por que isso ajuda quem estuda?'), {
        target: { value: 'Explica CSS moderno passo a passo.' },
      });

      const turnstileScript = document.querySelector('script[src*="challenges.cloudflare.com"]');
      if (turnstileScript) fireEvent.load(turnstileScript);
      await waitFor(() => expect(widgetSeq).toBe(1));
      fireEvent.click(screen.getByRole('button', { name: 'Enviar sugestão' }));

      await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
      await waitFor(() => expect(widgetSeq).toBe(2));
      expect(screen.getByLabelText('Link')).toHaveValue('https://web.dev/learn/css');

      fireEvent.click(screen.getByRole('button', { name: 'Enviar sugestão' }));
      await waitFor(() => expect(screen.getByText('Sugestão enviada')).toBeInTheDocument());
      expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)).turnstileToken).toBe(
        'net-token-1',
      );
      expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body)).turnstileToken).toBe(
        'net-token-2',
      );
    } finally {
      delete window.turnstile;
    }
  });
});
