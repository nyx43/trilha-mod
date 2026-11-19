import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import { BrowserRouter, Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CustomRoadmapPage from './CustomRoadmapPage';

function createDeferred<T>() {
  let resolvePromise!: (value: T) => void;
  let rejectPromise!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });
  return { promise, resolve: resolvePromise, reject: rejectPromise };
}

function CustomRoadmapHarness({
  initialEntry = '/roadmap/view/trilha-a',
}: {
  initialEntry?: string;
}) {
  return (
    <MemoryRouter initialEntries={[initialEntry]}>
      <nav aria-label="Navegação de trilhas de teste">
        <Link to="/roadmap/view/trilha-a">Ver Trilha A</Link>
        <Link to="/roadmap/view/trilha-b">Ver Trilha B</Link>
      </nav>
      <Routes>
        <Route path="/" element={<div>Início</div>} />
        <Route path="/roadmap/view/:roadmapId" element={<CustomRoadmapPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('CustomRoadmapPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.title = 'Trilha Info';
    vi.stubGlobal('scrollTo', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('remove os dados da trilha A quando a trilha B falha ao carregar', async () => {
    vi.spyOn(axios, 'get').mockImplementation((url: string) => {
      if (url.includes('/roadmap/trilha-a')) {
        return Promise.resolve({
          data: {
            id: 'trilha-a',
            title: 'Trilha Pública A',
            slug: 'trilha-a',
            description: 'Descrição exclusiva da trilha A',
            levels: [{ label: 'Etapa A', items: [{ label: 'Tópico Exclusivo A' }] }],
          },
        });
      }
      return Promise.reject(new Error('404'));
    });

    render(<CustomRoadmapHarness />);

    expect(await screen.findByText('Descrição exclusiva da trilha A')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Trilha Pública A' })).toBeInTheDocument();
    expect(screen.getByText('Tópico Exclusivo A')).toBeInTheDocument();
    expect(document.title).toBe('Trilha Info - Trilha Pública A');

    fireEvent.click(screen.getByRole('link', { name: 'Ver Trilha B' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(screen.queryByText('Descrição exclusiva da trilha A')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Trilha Pública A' })).not.toBeInTheDocument();
    expect(screen.queryByText('Tópico Exclusivo A')).not.toBeInTheDocument();
    expect(document.title).toBe('Trilha Info');
  });

  it('ignora resposta assíncrona atrasada da trilha A após trocar para a trilha B', async () => {
    const deferredA = createDeferred<{ data: Record<string, unknown> }>();

    vi.spyOn(axios, 'get').mockImplementation((url: string) => {
      if (url.includes('/roadmap/trilha-a')) {
        return deferredA.promise;
      }
      return Promise.reject(new Error('Falha na B'));
    });

    render(<CustomRoadmapHarness />);

    fireEvent.click(screen.getByRole('link', { name: 'Ver Trilha B' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    await act(async () => {
      deferredA.resolve({
        data: {
          id: 'trilha-a',
          title: 'Trilha A Atrasada',
          slug: 'trilha-a',
          description: 'Descrição atrasada A',
          levels: [{ label: 'Etapa A', items: [{ label: 'Tópico Atrasado' }] }],
        },
      });
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.queryByText('Descrição atrasada A')).not.toBeInTheDocument();
    expect(screen.queryByText('Tópico Atrasado')).not.toBeInTheDocument();
  });

  it('limpa os dados da trilha A imediatamente enquanto a trilha B ainda está carregando', async () => {
    const deferredB = createDeferred<{ data: Record<string, unknown> }>();

    vi.spyOn(axios, 'get').mockImplementation((url: string) => {
      if (url.includes('/roadmap/trilha-a')) {
        return Promise.resolve({
          data: {
            id: 'trilha-a',
            title: 'Trilha Pública A',
            slug: 'trilha-a',
            description: 'Descrição exclusiva da trilha A',
            levels: [{ label: 'Etapa A', items: [{ label: 'Tópico Exclusivo A' }] }],
          },
        });
      }
      return deferredB.promise;
    });

    render(<CustomRoadmapHarness />);
    expect(await screen.findByText('Descrição exclusiva da trilha A')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: 'Ver Trilha B' }));

    // Enquanto B ainda carrega, dados de A não podem permanecer visíveis
    expect(screen.queryByText('Descrição exclusiva da trilha A')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Trilha Pública A' })).not.toBeInTheDocument();
    expect(screen.queryByText('Tópico Exclusivo A')).not.toBeInTheDocument();

    await act(async () => {
      deferredB.resolve({
        data: {
          id: 'trilha-b',
          title: 'Trilha Pública B',
          slug: 'trilha-b',
          description: 'Descrição da trilha B',
          levels: [{ label: 'Etapa B', items: [{ label: 'Tópico Exclusivo B' }] }],
        },
      });
    });

    expect(await screen.findByText('Descrição da trilha B')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Trilha Pública B' })).toBeInTheDocument();
  });

  it('permite tentar novamente após erro e carrega a trilha quando a requisição passa a responder', async () => {
    let calls = 0;
    vi.spyOn(axios, 'get').mockImplementation(() => {
      calls += 1;
      if (calls === 1) {
        return Promise.reject(new Error('Erro temporário'));
      }
      return Promise.resolve({
        data: {
          id: 'trilha-b',
          title: 'Trilha Recuperada B',
          slug: 'trilha-b',
          description: 'Descrição B',
          levels: [{ label: 'Etapa B', items: [{ label: 'Tópico B' }] }],
        },
      });
    });

    render(<CustomRoadmapHarness initialEntry="/roadmap/view/trilha-b" />);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Tentar novamente/i }));

    expect(await screen.findByText('Descrição B')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Trilha Recuperada B' })).toBeInTheDocument();
  });

  it.each(['/roadmap/v/minha-trilha', '/roadmap/view/trilha-a'])(
    'mantém o endereço %s e seus parâmetros ao fechar um tópico e recarregar',
    async (path) => {
      const url = path + '?origem=curso';
      window.history.replaceState(null, '', url);
      vi.spyOn(axios, 'get').mockResolvedValue({
        data: {
          id: 'trilha-a',
          slug: 'minha-trilha',
          title: 'Trilha Pública A',
          levels: [{ items: [{ label: 'Tópico Público' }] }],
        },
      });

      function renderPublicRoute() {
        return render(
          <BrowserRouter>
            <Routes>
              <Route path="/roadmap/view/:roadmapId" element={<CustomRoadmapPage />} />
              <Route path="/roadmap/v/:roadmapId" element={<CustomRoadmapPage />} />
            </Routes>
          </BrowserRouter>,
        );
      }

      const view = renderPublicRoute();
      fireEvent.click(await screen.findByRole('button', { name: 'Tópico Público' }));
      expect(window.location.hash).toBe('#' + encodeURIComponent('Tópico Público'));
      fireEvent.click(await screen.findByRole('button', { name: 'Fechar painel' }));
      expect(window.location.pathname + window.location.search + window.location.hash).toBe(url);

      window.history.back();
      expect(await screen.findByRole('button', { name: 'Fechar painel' })).toBeInTheDocument();
      window.history.forward();
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(window.location.pathname + window.location.search + window.location.hash).toBe(url);

      view.unmount();
      renderPublicRoute();
      expect(await screen.findByRole('button', { name: 'Tópico Público' })).toBeInTheDocument();
    },
  );
});
