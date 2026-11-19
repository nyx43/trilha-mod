import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CoursePage from './CoursePage';
import NewRoadmapPage from './NewRoadmap';

function createDeferred<T>() {
  let resolvePromise!: (value: T) => void;
  let rejectPromise!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });
  return { promise, resolve: resolvePromise, reject: rejectPromise };
}

function EditorRoutesHarness({ initialEntry }: { initialEntry: string }) {
  return (
    <MemoryRouter initialEntries={[initialEntry]}>
      <nav aria-label="Atalhos de teste">
        <Link to="/edit-roadmap/trilha-a">Editar Trilha A</Link>
        <Link to="/edit-roadmap/trilha-b">Editar Trilha B</Link>
        <Link to="/edit-roadmap/frontend">Editar Trilha Frontend</Link>
        <Link to="/course/frontend">Curso Frontend</Link>
        <Link to="/new-roadmap">Nova Trilha</Link>
        <Link to="/">Ir para início</Link>
      </nav>
      <Routes>
        <Route path="/" element={<div data-testid="home-screen">Página inicial</div>} />
        <Route path="/course/:name" element={<CoursePage />} />
        <Route path="/new-roadmap" element={<NewRoadmapPage />} />
        <Route path="/edit-roadmap/:roadmapId" element={<NewRoadmapPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('NewRoadmapPage', () => {
  beforeEach(() => {
    vi.stubGlobal('scrollTo', vi.fn());
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('limpa os dados da trilha A e desabilita/oculta o salvamento quando a trilha B falha ao carregar', async () => {
    const getSpy = vi.spyOn(axios, 'get').mockImplementation((url: string) => {
      if (url.includes('/roadmap/trilha-a')) {
        return Promise.resolve({
          data: {
            id: 'trilha-a',
            title: 'Trilha A',
            slug: 'slug-trilha-a',
            description: 'Descrição da Trilha A',
            levels: [],
          },
        });
      }
      if (url.includes('/roadmap/trilha-b')) {
        return Promise.reject(new Error('Falha de rede na trilha B'));
      }
      return Promise.resolve({ data: false });
    });
    const postSpy = vi.spyOn(axios, 'post').mockResolvedValue({ data: {} });

    render(<EditorRoutesHarness initialEntry="/edit-roadmap/trilha-a" />);

    expect(await screen.findByDisplayValue('Trilha A')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Salvar$/i })).toBeEnabled();

    fireEvent.click(screen.getByRole('link', { name: 'Editar Trilha B' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(screen.queryByDisplayValue('Trilha A')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('slug-trilha-a')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('Descrição da Trilha A')).not.toBeInTheDocument();

    const saveButton = screen.queryByRole('button', { name: /^Salvar$/i });
    if (saveButton) {
      expect(saveButton).toBeDisabled();
      fireEvent.click(saveButton);
    }
    expect(postSpy).not.toHaveBeenCalled();
    expect(getSpy).toHaveBeenCalled();
  });

  it('ignora resposta assíncrona atrasada da trilha A após navegar para a trilha B', async () => {
    const deferredA = createDeferred<{ data: Record<string, unknown> }>();

    vi.spyOn(axios, 'get').mockImplementation((url: string) => {
      if (url.includes('/roadmap/trilha-a')) {
        return deferredA.promise;
      }
      if (url.includes('/roadmap/trilha-b')) {
        return Promise.resolve({
          data: {
            id: 'trilha-b',
            title: 'Trilha B',
            slug: 'slug-trilha-b',
            description: 'Descrição B',
            levels: [],
          },
        });
      }
      return Promise.resolve({ data: false });
    });
    const postSpy = vi.spyOn(axios, 'post').mockResolvedValue({ data: {} });

    render(<EditorRoutesHarness initialEntry="/edit-roadmap/trilha-a" />);

    fireEvent.click(screen.getByRole('link', { name: 'Editar Trilha B' }));
    expect(await screen.findByDisplayValue('Trilha B')).toBeInTheDocument();

    await act(async () => {
      deferredA.resolve({
        data: {
          id: 'trilha-a',
          title: 'Trilha A Atrasada',
          slug: 'slug-a-atrasada',
          description: 'Descrição A Atrasada',
          levels: [],
        },
      });
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Trilha B')).toBeInTheDocument();
    });
    expect(screen.queryByDisplayValue('Trilha A Atrasada')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Salvar$/i }));
    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledTimes(1);
    });
    expect(postSpy.mock.calls[0]?.[1]).toMatchObject({ id: 'trilha-b', title: 'Trilha B' });
    expect(await screen.findByTestId('home-screen')).toBeInTheDocument();
  });

  it('ignora resposta atrasada da trilha A quando a trilha B falha e mantém Salvar indisponível', async () => {
    const deferredA = createDeferred<{ data: Record<string, unknown> }>();

    vi.spyOn(axios, 'get').mockImplementation((url: string) => {
      if (url.includes('/roadmap/trilha-a')) {
        return deferredA.promise;
      }
      if (url.includes('/roadmap/trilha-b')) {
        return Promise.reject(new Error('Falha na trilha B'));
      }
      return Promise.resolve({ data: false });
    });

    render(<EditorRoutesHarness initialEntry="/edit-roadmap/trilha-a" />);

    fireEvent.click(screen.getByRole('link', { name: 'Editar Trilha B' }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    await act(async () => {
      deferredA.resolve({
        data: {
          id: 'trilha-a',
          title: 'Trilha A Atrasada',
          slug: 'slug-a-atrasada',
          description: 'Descrição A',
          levels: [],
        },
      });
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Trilha A Atrasada')).not.toBeInTheDocument();
    const saveButton = screen.queryByRole('button', { name: /^Salvar$/i });
    if (saveButton) expect(saveButton).toBeDisabled();
  });

  it('limpa os dados carregados ao navegar para /new-roadmap', async () => {
    vi.spyOn(axios, 'get').mockResolvedValue({
      data: {
        id: 'trilha-a',
        title: 'Trilha Existente',
        slug: 'trilha-existente',
        description: 'Descrição Existente',
        levels: [],
      },
    });

    render(<EditorRoutesHarness initialEntry="/edit-roadmap/trilha-a" />);
    expect(await screen.findByDisplayValue('Trilha Existente')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: 'Nova Trilha' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Título:')).toHaveValue('');
    });
    expect(screen.getByPlaceholderText('Uma URL customizada para seu Roadmap')).toHaveValue('');
  });

  it('ignora resposta atrasada de validação de slug mais antiga', async () => {
    const slowCheck = createDeferred<{ data: boolean }>();

    vi.spyOn(axios, 'get').mockImplementation((url: string) => {
      if (url.includes('/roadmap/slug/ocupado')) {
        return slowCheck.promise;
      }
      if (url.includes('/roadmap/slug/livre')) {
        return Promise.resolve({ data: false });
      }
      return Promise.resolve({ data: false });
    });

    render(<EditorRoutesHarness initialEntry="/new-roadmap" />);

    const slugInput = screen.getByPlaceholderText('Uma URL customizada para seu Roadmap');
    fireEvent.change(slugInput, { target: { value: 'ocupado' } });
    fireEvent.change(slugInput, { target: { value: 'livre' } });

    const saveButton = screen.getByRole('button', { name: /^Salvar$/i });
    await waitFor(() => {
      expect(saveButton).toBeEnabled();
      expect(
        screen.queryByText(/essa URL já foi escolhida por outra pessoa/i),
      ).not.toBeInTheDocument();
    });

    await act(async () => {
      slowCheck.resolve({ data: true });
    });

    await waitFor(() => {
      expect(saveButton).toBeEnabled();
      expect(
        screen.queryByText(/essa URL já foi escolhida por outra pessoa/i),
      ).not.toBeInTheDocument();
    });
  });

  it('não lança navigator.block is not a function ao digitar e protege alterações não salvas sem bloquear após salvar', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    vi.spyOn(axios, 'post').mockResolvedValue({ data: {} });

    render(<EditorRoutesHarness initialEntry="/new-roadmap" />);

    const titleInput = screen.getByLabelText('Título:');
    expect(() => {
      fireEvent.change(titleInput, { target: { value: 'Trilha editada localmente' } });
    }).not.toThrow();

    expect(titleInput).toHaveValue('Trilha editada localmente');

    // Tenta sair sem salvar e cancela na confirmação
    fireEvent.click(screen.getByRole('link', { name: 'Ir para início' }));
    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Título:')).toHaveValue('Trilha editada localmente');
    expect(screen.queryByTestId('home-screen')).not.toBeInTheDocument();

    // Confirma saída na segunda tentativa
    confirmSpy.mockReturnValue(true);
    fireEvent.click(screen.getByRole('link', { name: 'Ir para início' }));
    expect(await screen.findByTestId('home-screen')).toBeInTheDocument();
  });

  it('redireciona ao salvar sem disparar confirmação de alterações não salvas', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const postSpy = vi.spyOn(axios, 'post').mockResolvedValue({ data: {} });

    render(<EditorRoutesHarness initialEntry="/new-roadmap" />);

    fireEvent.change(screen.getByLabelText('Título:'), {
      target: { value: 'Trilha pronta para salvar' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^Salvar$/i }));

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('home-screen')).toBeInTheDocument();
    });
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it('permite clicar em "+ Novo Nível" com nível vazio e criar uma trilha completa do zero sem quebrar o editor', async () => {
    const postSpy = vi.spyOn(axios, 'post').mockResolvedValue({ data: {} });
    vi.spyOn(axios, 'get').mockResolvedValue({ data: false });

    render(<EditorRoutesHarness initialEntry="/new-roadmap" />);

    fireEvent.change(screen.getByPlaceholderText('Uma URL customizada para seu Roadmap'), {
      target: { value: 'minha-trilha-zero' },
    });
    fireEvent.change(screen.getByLabelText('Título:'), {
      target: { value: 'Trilha do Zero' },
    });
    fireEvent.change(screen.getByLabelText('Descrição:'), {
      target: { value: 'Descrição inicial da trilha' },
    });

    // Primeiro clique cria nível vazio ({ items: [] }) — não pode derrubar a prévia nem o editor
    expect(() => {
      fireEvent.click(screen.getByRole('button', { name: /\+ Novo Nível/i }));
    }).not.toThrow();

    const levelTitleInput = screen.getAllByPlaceholderText('Título')[0];
    fireEvent.change(levelTitleInput, { target: { value: 'Fundamentos' } });

    fireEvent.click(screen.getByRole('button', { name: /\+ Novo Item/i }));
    const titleInputsAfterItem = screen.getAllByPlaceholderText('Título');
    fireEvent.change(titleInputsAfterItem[1], { target: { value: 'HTML' } });

    fireEvent.click(screen.getByRole('button', { name: /\+ Nova Seção/i }));
    const titleInputsAfterSection = screen.getAllByPlaceholderText('Título');
    fireEvent.change(titleInputsAfterSection[2], { target: { value: 'O básico' } });

    fireEvent.click(screen.getByRole('button', { name: /\+ Novo Link/i }));
    fireEvent.change(screen.getByPlaceholderText('Título do Link'), {
      target: { value: 'Guia MDN' },
    });
    fireEvent.change(screen.getByPlaceholderText('URL do Link'), {
      target: { value: 'https://developer.mozilla.org' },
    });

    const saveButton = screen.getByRole('button', { name: /^Salvar$/i });
    await waitFor(() => {
      expect(saveButton).toBeEnabled();
    });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('home-screen')).toBeInTheDocument();
    });

    expect(postSpy.mock.calls[0]?.[1]).toMatchObject({
      slug: 'minha-trilha-zero',
      title: 'Trilha do Zero',
      description: 'Descrição inicial da trilha',
      levels: [
        {
          label: 'Fundamentos',
          items: [
            {
              label: 'HTML',
              children: [
                {
                  label: 'O básico',
                  links: [
                    {
                      label: 'Guia MDN',
                      url: 'https://developer.mozilla.org',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
  });

  it('preserva edições feitas durante um salvamento pendente, não redireciona e permite salvar a nova versão', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const firstSave = createDeferred<{ data: Record<string, unknown> }>();
    const secondSave = createDeferred<{ data: Record<string, unknown> }>();

    const postSpy = vi
      .spyOn(axios, 'post')
      .mockImplementationOnce(() => firstSave.promise)
      .mockImplementationOnce(() => secondSave.promise);

    render(<EditorRoutesHarness initialEntry="/new-roadmap" />);

    const titleInput = screen.getByLabelText('Título:');
    fireEvent.change(titleInput, { target: { value: 'Versão 1' } });
    fireEvent.click(screen.getByRole('button', { name: /^Salvar$/i }));

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(postSpy.mock.calls[0]?.[1]).toMatchObject({ title: 'Versão 1' });

    // Edita enquanto a requisição da Versão 1 ainda está pendente
    fireEvent.change(titleInput, { target: { value: 'Versão 2' } });
    expect(titleInput).toHaveValue('Versão 2');

    // Resposta da Versão 1 chega: não pode descartar Versão 2 nem sair da página
    await act(async () => {
      firstSave.resolve({ data: {} });
    });

    expect(screen.queryByTestId('home-screen')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Título:')).toHaveValue('Versão 2');

    // Proteção contra saída continua ativa para a Versão 2 ainda não salva
    fireEvent.click(screen.getByRole('link', { name: 'Ir para início' }));
    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('home-screen')).not.toBeInTheDocument();

    // Agora salva a Versão 2
    const saveButton = screen.getByRole('button', { name: /^Salvar$/i });
    expect(saveButton).toBeEnabled();
    fireEvent.click(saveButton);

    expect(postSpy).toHaveBeenCalledTimes(2);
    expect(postSpy.mock.calls[1]?.[1]).toMatchObject({ title: 'Versão 2' });

    await act(async () => {
      secondSave.resolve({ data: {} });
    });

    expect(await screen.findByTestId('home-screen')).toBeInTheDocument();
  });

  it('ignora resposta atrasada de salvamento da trilha A após abrir a trilha B', async () => {
    const saveA = createDeferred<{ data: Record<string, unknown> }>();

    vi.spyOn(axios, 'get').mockImplementation((url: string) => {
      if (url.includes('/roadmap/trilha-a')) {
        return Promise.resolve({
          data: {
            id: 'trilha-a',
            title: 'Trilha A',
            slug: 'trilha-a',
            description: 'Desc A',
            levels: [],
          },
        });
      }
      if (url.includes('/roadmap/trilha-b')) {
        return Promise.resolve({
          data: {
            id: 'trilha-b',
            title: 'Trilha B',
            slug: 'trilha-b',
            description: 'Desc B',
            levels: [],
          },
        });
      }
      return Promise.resolve({ data: false });
    });
    const postSpy = vi
      .spyOn(axios, 'post')
      .mockImplementationOnce(() => saveA.promise)
      .mockResolvedValueOnce({ data: {} });

    render(<EditorRoutesHarness initialEntry="/edit-roadmap/trilha-a" />);
    expect(await screen.findByDisplayValue('Trilha A')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Salvar$/i }));
    expect(postSpy).toHaveBeenCalledTimes(1);

    // Navega para Trilha B enquanto salvamento de A ainda está pendente
    fireEvent.click(screen.getByRole('link', { name: 'Editar Trilha B' }));
    expect(await screen.findByDisplayValue('Trilha B')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Salvar$/i })).toBeEnabled();

    // Resposta atrasada de A chega: não pode redirecionar nem alterar estado de B
    await act(async () => {
      saveA.resolve({ data: {} });
    });

    expect(screen.queryByTestId('home-screen')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('Trilha B')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Salvar$/i })).toBeEnabled();
  });

  it('ignora erro atrasado de salvamento da trilha A após abrir a trilha B', async () => {
    const saveA = createDeferred<{ data: Record<string, unknown> }>();

    vi.spyOn(axios, 'get').mockImplementation((url: string) => {
      if (url.includes('/roadmap/trilha-a')) {
        return Promise.resolve({
          data: {
            id: 'trilha-a',
            title: 'Trilha A',
            slug: 'trilha-a',
            description: 'Desc A',
            levels: [],
          },
        });
      }
      if (url.includes('/roadmap/trilha-b')) {
        return Promise.resolve({
          data: {
            id: 'trilha-b',
            title: 'Trilha B',
            slug: 'trilha-b',
            description: 'Desc B',
            levels: [],
          },
        });
      }
      return Promise.resolve({ data: false });
    });
    vi.spyOn(axios, 'post').mockImplementationOnce(() => saveA.promise);

    render(<EditorRoutesHarness initialEntry="/edit-roadmap/trilha-a" />);
    expect(await screen.findByDisplayValue('Trilha A')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Salvar$/i }));
    fireEvent.click(screen.getByRole('link', { name: 'Editar Trilha B' }));
    expect(await screen.findByDisplayValue('Trilha B')).toBeInTheDocument();

    await act(async () => {
      saveA.reject(new Error('Falha tardia em A'));
    });

    expect(screen.getByDisplayValue('Trilha B')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('isola a prévia do editor do progresso real em /course/frontend tanto em /new-roadmap quanto em /edit-roadmap/:id', async () => {
    window.localStorage.clear();
    vi.spyOn(axios, 'get').mockImplementation((url: string) => {
      if (url.includes('/roadmap/frontend')) {
        return Promise.resolve({
          data: {
            id: 'frontend',
            title: 'frontend',
            slug: 'frontend',
            description: 'Rascunho existente',
            levels: [{ label: 'Etapa Rascunho', items: [{ label: 'Item Rascunho' }] }],
          },
        });
      }
      return Promise.resolve({ data: false });
    });

    render(<EditorRoutesHarness initialEntry="/course/frontend" />);

    // 1. Conclui o primeiro recurso no Modo Curso
    fireEvent.click(screen.getByRole('button', { name: /concluir conteúdo/i }));
    expect(screen.getByRole('button', { name: /desmarcar conteúdo/i })).toBeInTheDocument();
    const savedCourseSnapshot = window.localStorage.getItem('selectedItems-frontend');
    expect(savedCourseSnapshot).toBeTruthy();

    // 2. Abre /new-roadmap, dá título "frontend" e adiciona um nível (monta a prévia)
    fireEvent.click(screen.getByRole('link', { name: 'Nova Trilha' }));
    fireEvent.change(screen.getByLabelText('Título:'), { target: { value: 'frontend' } });
    fireEvent.click(screen.getByRole('button', { name: /\+ Novo Nível/i }));

    expect(window.localStorage.getItem('selectedItems-frontend')).toBe(savedCourseSnapshot);

    fireEvent.click(screen.getByRole('button', { name: /Novo Item/i }));
    fireEvent.change(screen.getAllByPlaceholderText('Título')[1], { target: { value: 'HTML' } });
    const previewItem = screen.getByRole('checkbox', { name: 'Marcar HTML como concluído' });
    fireEvent.click(previewItem);
    expect(previewItem).toBeChecked();
    fireEvent.click(previewItem);
    expect(previewItem).not.toBeChecked();
    expect(window.localStorage.getItem('selectedItems-frontend')).toBe(savedCourseSnapshot);

    // 3. Abre uma trilha existente com título/id "frontend" para edição
    fireEvent.click(screen.getByRole('link', { name: 'Editar Trilha Frontend' }));
    expect(await screen.findByRole('button', { name: 'Item Rascunho' })).toBeInTheDocument();
    expect(screen.getByLabelText('Título:')).toHaveValue('frontend');

    expect(window.localStorage.getItem('selectedItems-frontend')).toBe(savedCourseSnapshot);

    // 4. Reabre o curso e confirma que o recurso continua concluído
    fireEvent.click(screen.getByRole('link', { name: 'Curso Frontend' }));
    expect(await screen.findByRole('button', { name: /desmarcar conteúdo/i })).toBeInTheDocument();
  });

  it('preserva endereço e histórico ao abrir e fechar um item na prévia em /new-roadmap e /edit-roadmap/:id', async () => {
    const pushStateSpy = vi.spyOn(window.history, 'pushState');
    vi.spyOn(axios, 'get').mockImplementation((url: string) => {
      if (url.includes('/roadmap/trilha-a')) {
        return Promise.resolve({
          data: {
            id: 'trilha-a',
            title: 'Trilha A',
            slug: 'trilha-a',
            description: 'Descrição A',
            levels: [
              {
                label: 'Etapa A',
                items: [
                  {
                    label: 'Item Preview Edit',
                    description: 'Descrição do item na prévia',
                    children: [{ label: 'O básico', links: [] }],
                  },
                ],
              },
            ],
          },
        });
      }
      return Promise.resolve({ data: false });
    });

    render(<EditorRoutesHarness initialEntry="/new-roadmap" />);

    // Em /new-roadmap: cria nível e item e abre/fecha na prévia
    fireEvent.change(screen.getByLabelText('Título:'), { target: { value: 'Meu Rascunho' } });
    fireEvent.click(screen.getByRole('button', { name: /\+ Novo Nível/i }));
    fireEvent.click(screen.getByRole('button', { name: /\+ Novo Item/i }));
    const titleInputs = screen.getAllByPlaceholderText('Título');
    fireEvent.change(titleInputs[1], { target: { value: 'Item Preview Novo' } });

    const beforeNewUrl = window.location.pathname + window.location.hash;
    pushStateSpy.mockClear();

    fireEvent.click(screen.getByRole('button', { name: 'Item Preview Novo' }));
    const closeNewDrawer = await screen.findByRole('button', { name: /Fechar painel/i });
    fireEvent.click(closeNewDrawer);

    expect(pushStateSpy).not.toHaveBeenCalled();
    expect(window.location.pathname + window.location.hash).toBe(beforeNewUrl);

    // Em /edit-roadmap/trilha-a: abre e fecha item na prévia
    fireEvent.click(screen.getByRole('link', { name: 'Editar Trilha A' }));
    const editPreviewItem = await screen.findByRole('button', { name: 'Item Preview Edit' });

    const beforeEditUrl = window.location.pathname + window.location.hash;
    pushStateSpy.mockClear();

    fireEvent.click(editPreviewItem);
    const closeEditDrawer = await screen.findByRole('button', { name: /Fechar painel/i });
    fireEvent.click(closeEditDrawer);

    expect(pushStateSpy).not.toHaveBeenCalled();
    expect(window.location.pathname + window.location.hash).toBe(beforeEditUrl);
  });

  it('bloqueia Salvar com zero POSTs enquanto validação do slug está pendente ou ocupada e libera quando disponível', async () => {
    const checkTaken = createDeferred<{ data: boolean }>();
    const checkFree = createDeferred<{ data: boolean }>();

    vi.spyOn(axios, 'get').mockImplementation((url: string) => {
      if (url.includes('/roadmap/slug/slug-ocupado')) {
        return checkTaken.promise;
      }
      if (url.endsWith('/roadmap/slug/slug-disponivel')) {
        return checkFree.promise;
      }
      return Promise.resolve({ data: false });
    });
    const postSpy = vi.spyOn(axios, 'post').mockResolvedValue({ data: {} });

    render(<EditorRoutesHarness initialEntry="/new-roadmap" />);

    const slugInput = screen.getByPlaceholderText('Uma URL customizada para seu Roadmap');
    const saveButton = screen.getByRole('button', { name: /^Salvar$/i });

    // Consulta pendente -> Salvar desabilitado e clique gera 0 POSTs
    fireEvent.change(slugInput, { target: { value: 'slug-ocupado' } });
    expect(saveButton).toBeDisabled();
    fireEvent.click(saveButton);
    expect(postSpy).not.toHaveBeenCalled();

    // Endereço ocupado -> continua desabilitado e clique gera 0 POSTs
    await act(async () => {
      checkTaken.resolve({ data: true });
    });
    expect(
      await screen.findByText(/essa URL já foi escolhida por outra pessoa/i),
    ).toBeInTheDocument();
    expect(saveButton).toBeDisabled();
    fireEvent.click(saveButton);
    expect(postSpy).not.toHaveBeenCalled();

    // Altera para endereço disponível -> pendente continua bloqueado
    fireEvent.change(slugInput, { target: { value: '  slug-disponivel  ' } });
    expect(saveButton).toBeDisabled();
    fireEvent.click(saveButton);
    expect(postSpy).not.toHaveBeenCalled();

    // Consulta confirma disponibilidade -> libera Salvar e envia POST
    await act(async () => {
      checkFree.resolve({ data: false });
    });
    await waitFor(() => {
      expect(saveButton).toBeEnabled();
    });
    fireEvent.click(saveButton);
    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('home-screen')).toBeInTheDocument();
    });
    expect(postSpy.mock.calls[0]?.[1]).toMatchObject({ slug: 'slug-disponivel' });
  });

  it('permite restaurar o slug da própria trilha durante uma consulta pendente', async () => {
    const pending = createDeferred<{ data: boolean }>();
    const get = vi.spyOn(axios, 'get').mockImplementation((url: string) => {
      if (url.endsWith('/roadmap/slug/alternativo')) return pending.promise;
      if (url.includes('/roadmap/slug/')) return Promise.resolve({ data: true });
      return Promise.resolve({ data: { id: 'trilha-a', slug: 'original', levels: [] } });
    });
    const post = vi.spyOn(axios, 'post').mockResolvedValue({ data: {} });

    render(<EditorRoutesHarness initialEntry="/edit-roadmap/trilha-a" />);
    const input = await screen.findByDisplayValue('original');
    const save = screen.getByRole('button', { name: 'Salvar' });

    fireEvent.change(input, { target: { value: 'alternativo' } });
    expect(save).toBeDisabled();
    fireEvent.change(input, { target: { value: 'original' } });
    expect(save).toBeEnabled();
    await act(async () => pending.resolve({ data: true }));
    expect(get.mock.calls.map(([url]) => url)).not.toContainEqual(
      expect.stringMatching(/\/slug\/original$/),
    );
    fireEvent.click(save);
    expect(post.mock.calls[0]?.[1]).toMatchObject({ id: 'trilha-a', slug: 'original' });
    await screen.findByTestId('home-screen');
  });

  it('revalida o slug antigo se outro endereço foi salvo durante a edição', async () => {
    const saving = createDeferred<{ data: object }>();
    vi.spyOn(axios, 'get').mockImplementation(async (url: string) => {
      if (url.includes('/roadmap/slug/')) return { data: url.endsWith('/original') };
      return { data: { id: 'trilha-a', slug: 'original', levels: [] } };
    });
    vi.spyOn(axios, 'post').mockImplementationOnce(() => saving.promise);
    render(<EditorRoutesHarness initialEntry="/edit-roadmap/trilha-a" />);
    const input = await screen.findByDisplayValue('original');
    fireEvent.change(input, { target: { value: 'novo' } });
    const save = screen.getByRole('button', { name: 'Salvar' });
    await waitFor(() => expect(save).toBeEnabled());
    fireEvent.click(save);
    fireEvent.change(input, { target: { value: 'original' } });
    await act(async () => saving.resolve({ data: {} }));
    expect(await screen.findByText(/essa URL já foi escolhida/i)).toBeInTheDocument();
    expect(save).toBeDisabled();
    fireEvent.change(input, { target: { value: 'novo' } });
    expect(save).toBeEnabled();
  });

  it('mantém Salvar bloqueado quando resposta antiga "disponível" chega depois de resposta mais recente "ocupado"', async () => {
    const slowFree = createDeferred<{ data: boolean }>();
    const fastTaken = createDeferred<{ data: boolean }>();

    vi.spyOn(axios, 'get').mockImplementation((url: string) => {
      if (url.includes('/roadmap/slug/primeiro-livre')) {
        return slowFree.promise;
      }
      if (url.includes('/roadmap/slug/segundo-ocupado')) {
        return fastTaken.promise;
      }
      return Promise.resolve({ data: false });
    });
    const postSpy = vi.spyOn(axios, 'post').mockResolvedValue({ data: {} });

    render(<EditorRoutesHarness initialEntry="/new-roadmap" />);

    const slugInput = screen.getByPlaceholderText('Uma URL customizada para seu Roadmap');
    const saveButton = screen.getByRole('button', { name: /^Salvar$/i });

    fireEvent.change(slugInput, { target: { value: 'primeiro-livre' } });
    fireEvent.change(slugInput, { target: { value: 'segundo-ocupado' } });
    expect(saveButton).toBeDisabled();

    await act(async () => {
      fastTaken.resolve({ data: true });
    });
    expect(
      await screen.findByText(/essa URL já foi escolhida por outra pessoa/i),
    ).toBeInTheDocument();
    expect(saveButton).toBeDisabled();

    // Resposta mais antiga chega depois dizendo "disponível": não pode reabilitar Salvar
    await act(async () => {
      slowFree.resolve({ data: false });
    });

    expect(saveButton).toBeDisabled();
    fireEvent.click(saveButton);
    expect(postSpy).not.toHaveBeenCalled();
  });
});
